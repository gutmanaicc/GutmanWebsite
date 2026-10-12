import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createCloudRuntime } from '../server/cloud-runtime.mjs';

const NOW = Date.parse('2026-10-12T10:00:00Z');
const RECEIPT_ID = '01234567-89ab-4cde-8fab-0123456789ab';
const ADMIN = 'mock-only-cloud-admin-token-at-least-32-characters';
const ENV = {
  ACADEMY_PAYMENT_MODE: 'morning', ACADEMY_PUBLIC_ORIGIN: 'https://academy.example.test',
  ACADEMY_ALLOWED_ORIGINS: 'https://academy.example.test', ACADEMY_ADMIN_TOKEN: ADMIN,
  ACADEMY_ORDER_SECRET: 'mock-only-order-signing-secret-at-least-32-characters', ACADEMY_BOOKING_TERMS_APPROVED: '1',
  MORNING_API_ID: 'mock-oauth-client-id', MORNING_API_SECRET: 'mock-oauth-client-secret',
  MORNING_WEBHOOK_SECRET: 'mock-only-provider-webhook-secret-at-least-32-characters',
  MORNING_BUSINESS_TAX_ID: 'mock-merchant', MORNING_MERCHANT_VERIFIED: '1',
  MORNING_CHECKOUT_ORIGINS: 'https://verified-checkout.example.test',
};

// Models a private remote object with atomic ETag compare-and-swap. No disk,
// supplier, Blob account, email or CRM connection is used by these tests.
class PrivateBackend {
  record = null; writes = 0;
  async read() { await Promise.resolve(); return this.record && structuredClone(this.record); }
  async write(snapshot, { etag }) {
    await Promise.resolve();
    if ((etag === null && this.record !== null) || (etag !== null && this.record?.etag !== etag)) {
      const error = new Error('mock CAS conflict'); error.code = etag === null ? 'ALREADY_EXISTS' : 'PRECONDITION_FAILED'; throw error;
    }
    this.record = { snapshot: structuredClone(snapshot), etag: `mock-etag-${++this.writes}` };
    return { etag: this.record.etag };
  }
}

async function setup(t, extra = {}) {
  let now = NOW;
  let paid = false;
  let returnedDocument = {};
  let providerRedirect = false;
  const backend = new PrivateBackend();
  const calls = [];
  const forms = [];
  const providerFetch = async (url, options) => {
    // This mock rejects every endpoint not in the reviewed contract.
    const body = options.body && JSON.parse(options.body);
    calls.push({ url, method: options.method, body });
    assert.equal(options.redirect, 'error');
    const response = data => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    if (url === 'https://api.resend.com/emails') {
      assert.equal(options.headers.Authorization, 'Bearer mock-only-resend-secret');
      assert.ok(options.headers['Idempotency-Key'].startsWith('academy-outbox-'));
      assert.equal(body.from, 'academy@example.test'); assert.deepEqual(body.to, ['cloud-buyer@example.test']);
      return response({ id: '11234567-89ab-4cde-8fab-0123456789ab' });
    }
    if (url === 'https://api.morning.co/idp/v1/oauth/token') return response({ accessToken: 'mock-provider-bearer', tokenType: 'Bearer', expiresAt: Math.floor(now / 1000) + 3600 });
    assert.equal(options.headers.Authorization, 'Bearer mock-provider-bearer');
    if (url === 'https://api.greeninvoice.co.il/api/v1/payments/form') {
      forms.push(body);
      assert.equal(body.type, 400); assert.equal(body.amount, 1190); assert.equal(body.vatType, 1); assert.equal(body.income[0].vatType, 2);
      assert.equal(body.maxPayments, 1); assert.deepEqual(body.client.emails, ['cloud-buyer@example.test']);
      if (providerRedirect) return { ok: true, redirected: true, json: async () => ({ success: true, errorCode: 0, url: 'https://verified-checkout.example.test/redirect' }) };
      return response({ success: true, errorCode: 0, url: `https://verified-checkout.example.test/pay/${body.custom}` });
    }
    if (url === 'https://api.greeninvoice.co.il/api/v1/documents/search') {
      assert.equal(options.method, 'POST'); assert.deepEqual(body.type, [400]);
      assert.equal(body.description, forms.at(-1).description); assert.equal(body.fromDate, '2026-10-12');
      return response({ pages: paid ? 1 : 0, items: paid ? [{ id: RECEIPT_ID, description: body.description }] : [] });
    }
    if (url === `https://api.greeninvoice.co.il/api/v1/documents/${RECEIPT_ID}`) {
      assert.equal(options.method, 'GET');
      return response({ id: RECEIPT_ID, description: forms.at(-1).description, type: 400, status: 0, currency: 'ILS', amount: 1190, vat: 0, vatType: 1, business: { taxId: 'mock-merchant', exemption: true }, payment: [{ type: 3, price: 1190, currency: 'ILS', ref: [] }], ...returnedDocument });
    }
    assert.fail(`Unexpected mock provider route: ${url}`);
  };
  const runtime = createCloudRuntime({ ...ENV, ...extra }, { backend, fetchImpl: providerFetch, clock: () => now });
  async function serve(current) {
    const server = createServer(current.handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    return async (path, { method = 'GET', data, token, headers = {}, raw } = {}) => {
      const response = await fetch(`${base}/api/academy${path}`, {
        method, headers: { ...(data !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
        ...(data !== undefined ? { body: JSON.stringify(data) } : raw !== undefined ? { body: raw } : {}),
      });
      return { status: response.status, value: await response.json() };
    };
  }
  const request = await serve(runtime);
  const drafts = await request('/admin/dates', { token: ADMIN });
  assert.equal(drafts.status, 200);
  const dateId = drafts.value.dates[0].id;
  assert.equal((await request(`/admin/dates/${dateId}/approve`, { method: 'POST', token: ADMIN, data: { checksConfirmed: true, publish: true, openRegistration: true } })).status, 200);
  const orderBody = { dateId, termsAccepted: true, customer: { name: 'Mock cloud participant', email: 'cloud-buyer@example.test', phone: '0501234567' } };
  const create = () => request('/orders', { method: 'POST', data: orderBody, headers: { 'idempotency-key': 'mock-durable-cloud-order' } });
  return { request, create, runtime, backend, calls, forms, dateId, setPaid: value => { paid = value; }, setDocument: value => { returnedDocument = value; }, advance: ms => { now += ms; }, redirectProvider: () => { providerRedirect = true; }, restart: async () => {
    const restarted = createCloudRuntime({ ...ENV, ...extra }, { backend, fetchImpl: providerFetch, clock: () => now });
    return { runtime: restarted, request: await serve(restarted) };
  } };
}

test('real cloud HTTP/runtime facade creates one mocked Morning form, preserves scoped order across restart and reconciles exactly once', async t => {
  const context = await setup(t);
  const result = await context.create(); assert.equal(result.status, 201);
  const order = result.value; assert.equal(order.status, 'pending'); assert.equal(order.simulation, false);
  assert.equal(order.checkoutUrl, `https://verified-checkout.example.test/pay/${order.orderId}`);
  assert.equal(context.forms[0].custom, order.orderId);
  assert.equal(context.forms[0].successUrl, `https://academy.example.test/orders/${order.orderId}`);
  assert.equal(context.forms[0].notifyUrl, `https://academy.example.test/api/academy/payments/morning/notify/${order.orderId}`);
  assert.equal((await context.create()).value.checkoutUrl, order.checkoutUrl); assert.equal(context.forms.length, 1);
  assert.equal((await context.runtime.store.all('registrations')).length, 0);
  const stored = await context.runtime.store.get('orders', order.orderId);
  assert.equal(stored.providerExpiryEnforced, false); // Local seat deadline is not a claimed provider expiry.
  const restarted = await context.restart();
  assert.equal((await restarted.request(`/orders/${order.orderId}`)).status, 401);
  assert.equal((await restarted.request(`/orders/${order.orderId}`, { token: order.orderAccessToken })).value.status, 'pending');
  context.setPaid(true);
  const reconcile = () => restarted.request(`/orders/${order.orderId}/reconcile`, { method: 'POST', token: order.orderAccessToken, data: {} });
  assert.equal((await reconcile()).value.status, 'paid'); assert.equal((await reconcile()).value.status, 'paid');
  const registrations = await restarted.runtime.store.all('registrations'); assert.equal(registrations.length, 1);
  assert.equal(registrations[0].orderId, order.orderId); assert.equal(registrations[0].simulation, false);
  assert.equal((await restarted.runtime.store.all('payment_events')).length, 1);
  assert.equal((await restarted.runtime.store.all('outbox')).filter(item => item.kind === 'confirmation').length, 1);
  assert.equal((await restarted.runtime.store.get('dates', context.dateId)).capacity, 12);
  const summary = await restarted.request('/admin/summary', { token: ADMIN });
  assert.equal(summary.value.dates.find(date => date.id === context.dateId).paidCount, 1);
  assert.equal(summary.value.revenue.netAgorot, 119000);
  assert.ok(!JSON.stringify(order).includes(ENV.MORNING_API_SECRET));
  assert.ok(context.backend.writes > 0);
});

test('browser success fields, unsigned notify body and closed receipt without payment rows never enroll; exact server receipt is required', async t => {
  const context = await setup(t); const order = (await context.create()).value;
  const query = await context.request(`/orders/${order.orderId}?status=paid&amount=1190`, { token: order.orderAccessToken });
  assert.equal(query.value.status, 'pending');
  const notify = await context.request(`/payments/morning/notify/${order.orderId}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, raw: 'status=paid&amount=1190&currency=ILS' });
  assert.equal(notify.status, 200); assert.equal((await context.runtime.store.all('registrations')).length, 0);
  const reconcile = data => context.request(`/orders/${order.orderId}/reconcile`, { method: 'POST', token: order.orderAccessToken, data });
  assert.equal((await reconcile({ status: 'paid', amount: 1190, transactionId: 'forged-browser-proof' })).value.status, 'pending');
  context.setPaid(true);
  for (const invalid of [{ status: 1, payment: [] }, { payment: [{ type: 0, price: 1190, currency: 'ILS' }] }, { business: { taxId: 'another-merchant', exemption: true } }, { amount: 1 }, { status: 4 }]) {
    context.setDocument(invalid);
    assert.equal((await reconcile({ status: 'paid' })).value.status, 'pending');
    assert.equal((await context.runtime.store.all('registrations')).length, 0);
  }
  context.setDocument({});
  assert.equal((await reconcile({ status: 'failed', amount: 1 })).value.status, 'paid');
  assert.equal((await context.runtime.store.all('registrations')).length, 1);
});

test('a real verified receipt after the seat hold expires requires refund review and never grants a seat, including after runtime restart', async t => {
  const context = await setup(t); const order = (await context.create()).value;
  context.advance(16 * 60_000); context.setPaid(true);
  const restarted = await context.restart();
  const response = await restarted.request(`/orders/${order.orderId}/reconcile`, { method: 'POST', token: order.orderAccessToken, data: {} });
  assert.equal(response.status, 200); assert.equal(response.value.status, 'refund_required');
  assert.equal((await restarted.runtime.store.all('registrations')).length, 0);
  const summary = (await restarted.request('/admin/summary', { token: ADMIN })).value;
  const date = summary.dates.find(item => item.id === context.dateId);
  assert.equal(date.paidCount, 0); assert.equal(date.pendingCount, 0); assert.equal(date.remainingCapacity, 12);
  assert.equal(summary.outbox.filter(item => item.kind === 'payment_review').length, 1);
  assert.equal(summary.outbox.filter(item => item.kind === 'confirmation').length, 0);
  assert.equal((await restarted.request(`/orders/${order.orderId}/reconcile`, { method: 'POST', token: order.orderAccessToken, data: {} })).value.status, 'refund_required');
  assert.equal((await restarted.runtime.store.all('outbox')).filter(item => item.kind === 'payment_review').length, 1);
});

test('provider redirects suppress checkout and an idempotent HTTP retry cannot create a second form', async t => {
  const context = await setup(t); context.redirectProvider();
  const first = await context.create(); assert.equal(first.status, 201);
  assert.equal(first.value.checkoutState, 'unknown'); assert.equal(first.value.checkoutUrl, null);
  assert.equal((await context.create()).value.checkoutState, 'unknown'); assert.equal(context.forms.length, 1);
  assert.equal((await context.runtime.store.all('registrations')).length, 0);
});


test('owner-only delivery endpoints fail closed by default; explicit approved mock service delivery returns counts without private payloads', async t => {
  const disabled = await setup(t);
  assert.equal((await disabled.request('/admin/outbox/drain', { method: 'POST', data: {} })).status, 401);
  assert.equal((await disabled.request('/admin/delivery-readiness')).status, 401);
  const readiness = await disabled.request('/admin/delivery-readiness', { token: ADMIN });
  assert.equal(readiness.status, 200); assert.equal(readiness.value.ready, false);
  assert.equal((await disabled.request('/admin/outbox/drain', { method: 'POST', token: ADMIN, data: {} })).status, 503);
  assert.equal(disabled.calls.filter(call => call.url.includes('api.resend.com')).length, 0);

  const enabled = await setup(t, { RESEND_API_KEY: 'mock-only-resend-secret', ACADEMY_EMAIL_FROM: 'academy@example.test', ACADEMY_EMAIL_DELIVERY_ENABLED: '1', ACADEMY_EMAIL_SENDER_VERIFIED: '1', ACADEMY_EMAIL_APPROVED_KINDS: 'confirmation' });
  const order = (await enabled.create()).value; enabled.setPaid(true);
  assert.equal((await enabled.request(`/orders/${order.orderId}/reconcile`, { method: 'POST', token: order.orderAccessToken, data: {} })).value.status, 'paid');
  assert.equal((await enabled.request('/admin/outbox/drain', { method: 'POST', data: {} })).status, 401);
  assert.equal(enabled.calls.filter(call => call.url.includes('api.resend.com')).length, 0);
  assert.equal((await enabled.request('/admin/outbox/drain', { method: 'POST', token: ADMIN, data: { limit: 21 } })).status, 400);
  const drained = await enabled.request('/admin/outbox/drain', { method: 'POST', token: ADMIN, data: { limit: 10 } });
  assert.equal(drained.status, 200); assert.equal(drained.value.sent, 1); assert.equal(drained.value.claimed, 1);
  assert.equal(enabled.calls.filter(call => call.url.includes('api.resend.com')).length, 1);
  const report = JSON.stringify(drained.value);
  assert.ok(!report.includes('cloud-buyer')); assert.ok(!report.includes('Mock cloud participant')); assert.ok(!report.includes('mock-only-resend-secret')); assert.ok(!report.includes(order.orderId));
  const messages = await enabled.runtime.store.all('outbox');
  assert.equal(messages.find(item => item.kind === 'confirmation').deliveryStatus, 'accepted');
  assert.equal(messages.find(item => item.kind === 'crm_registration').status, 'pending');
  assert.equal(messages.find(item => item.kind === 'preparation').status, 'pending');
  assert.equal((await enabled.request('/admin/outbox/drain', { method: 'POST', token: ADMIN, data: {} })).value.claimed, 0);
  assert.equal(enabled.calls.filter(call => call.url.includes('api.resend.com')).length, 1);
});
