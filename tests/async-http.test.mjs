import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { CommerceStore } from '../server/commerce.mjs';
import { createAcademyHandler, createAcademyServer } from '../server/http.mjs';
import { HostedCheckout } from '../server/hosted-checkout.mjs';

const NOW = Date.parse('2026-10-12T09:00:00Z');
const SECRET = 'async-store-test-secret-at-least-32-characters';
const ADMIN = 'async-admin-test-secret-at-least-32-characters';
const payload = dateId => ({ dateId, termsAccepted: true, customer: { name: 'משתתף בדיקה', email: 'async@example.test', phone: '0501234567' } });

// External calls resolve later; methods inside CommerceStore keep their normal
// synchronous this binding. This models the durable facade without network I/O.
function asynchronous(store) {
  return new Proxy(store, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    if (['clock', 'orderResult'].includes(key)) return value.bind(target);
    return async (...args) => { await Promise.resolve(); return value.apply(target, args); };
  } });
}
async function setup(t, options = {}, useQuery = false) {
  const original = new CommerceStore({ clock: () => NOW, mode: 'simulation', development: true, simulationSecret: SECRET, bookingTermsApproved: true, ...options });
  original.seedDrafts();
  t.after(() => original.close());
  const store = asynchronous(original);
  const handler = createAcademyHandler({ store, adminToken: ADMIN });
  const server = useQuery ? createServer((req, res) => {
    req.query = { academyPath: req.headers['x-test-path'] };
    return handler(req, res);
  }) : createAcademyServer({ store, adminToken: ADMIN });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, { method = 'GET', data, token, headers = {} } = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: { ...headers, ...(data ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: response.status, value: await response.json() };
  }
  return { store, original, request };
}

test('async store HTTP returns resolved catalog, admin collections, date approval and coupon mutations', async t => {
  const { request } = await setup(t);
  const admin = { token: ADMIN };
  assert.deepEqual((await request('/api/academy/catalog')).value.dates, []);
  assert.equal((await request('/api/academy/admin/summary')).status, 401);
  const dates = (await request('/api/academy/admin/dates', admin)).value.dates;
  assert.equal(dates.length, 10);
  const approved = await request(`/api/academy/admin/dates/${dates[0].id}/approve`, { ...admin, method: 'POST', data: { checksConfirmed: true, publish: true, openRegistration: true } });
  assert.equal(approved.value.date.approvalStatus, 'approved');
  assert.equal((await request('/api/academy/catalog')).value.dates.length, 1);
  const added = await request('/api/academy/admin/dates', { ...admin, method: 'POST', data: { seminarId: 'ai-business-owners', date: '2026-12-01', venue: 'מקום בדיקה' } });
  assert.equal(added.status, 201);
  const changed = await request(`/api/academy/admin/dates/${added.value.date.id}`, { ...admin, method: 'PATCH', data: { venue: 'מקום בדיקה מעודכן' } });
  assert.equal(changed.value.date.venue, 'מקום בדיקה מעודכן');
  assert.equal((await request(`/api/academy/admin/dates/${added.value.date.id}/reject`, { ...admin, method: 'POST', data: {} })).value.date.approvalStatus, 'rejected');
  const coupon = await request('/api/academy/admin/coupons', { ...admin, method: 'POST', data: { code: 'ASYNC10', type: 'percentage', value: 10, active: true } });
  assert.equal(coupon.value.coupon.value, 10);
  assert.equal((await request('/api/academy/admin/coupons', admin)).value.coupons.length, 1);
  assert.equal((await request(`/api/academy/admin/coupons/${coupon.value.coupon.id}`, { ...admin, method: 'PATCH', data: { active: false } })).value.coupon.active, false);
  const summary = (await request('/api/academy/admin/summary', admin)).value;
  assert.equal(summary.dates.length, 11);
  for (const collection of ['registrations', 'orders', 'outbox']) assert.deepEqual((await request(`/api/academy/admin/${collection}`, admin)).value[collection], []);
  assert.equal((await request('/api/academy/admin/revenue', admin)).value.netAgorot, 0);
});

test('async HTTP quote, scoped order, simulation confirmation, refund and outbox retry preserve shape', async t => {
  const { original, request } = await setup(t);
  const date = original.approveDate(original.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const quote = await request('/api/academy/quote', { method: 'POST', data: { dateId: date.id } });
  assert.equal(quote.value.totalAgorot, 119000);
  assert.ok(!('couponId' in quote.value));
  const created = await request('/api/academy/orders', { method: 'POST', data: payload(date.id), headers: { 'idempotency-key': 'async-http-order' } });
  assert.equal(created.status, 201);
  const order = created.value;
  assert.equal(order.status, 'pending');
  assert.equal((await request(`/api/academy/orders/${order.orderId}`)).status, 401);
  assert.equal((await request(`/api/academy/orders/${order.orderId}`, { token: order.orderAccessToken })).value.customer.email, 'async@example.test');
  assert.equal((await request('/api/academy/simulation/pay', { method: 'POST', token: order.orderAccessToken, data: { orderId: order.orderId } })).value.status, 'paid');
  assert.equal((await request('/api/academy/admin/registrations', { token: ADMIN })).value.registrations.length, 1);
  assert.equal((await request('/api/academy/admin/orders', { token: ADMIN })).value.orders[0].status, 'paid');
  const outbox = (await request('/api/academy/admin/outbox', { token: ADMIN })).value.outbox;
  assert.ok(outbox.length > 0);
  assert.equal((await request(`/api/academy/admin/outbox/${outbox[0].id}/retry`, { method: 'POST', token: ADMIN, data: {} })).value.outbox.status, 'pending');
  assert.equal((await request(`/api/academy/admin/orders/${order.orderId}/refund`, { method: 'POST', token: ADMIN, data: {} })).value.order.status, 'refunded');
});

test('Vercel query routing supports suffixes and rejects malformed or traversal paths', async t => {
  const { request } = await setup(t);
  assert.deepEqual((await request('/api/academy?academyPath=catalog')).value.dates, []);
  assert.equal((await request('/api/academy?academyPath=admin%2Fdates', { token: ADMIN })).value.dates.length, 10);
  for (const invalid of ['', '../admin/dates', '/../../catalog', 'admin//dates', 'catalog/', 'catalog?admin=1', 'catalog%2f', 'catalog\\foo', 'a'.repeat(301)]) {
    const response = await request(`/api/academy?academyPath=${encodeURIComponent(invalid)}`);
    assert.equal(response.status, 400, invalid);
    assert.equal(response.value.error.code, 'INVALID_PATH');
  }
  const query = await setup(t, {}, true);
  assert.deepEqual((await query.request('/api/academy', { headers: { 'x-test-path': 'catalog' } })).value.dates, []);
  assert.equal((await query.request('/api/academy', { headers: { 'x-test-path': '../catalog' } })).status, 400);
});

test('HostedCheckout awaits asynchronous claims, completion, lookup and pending reconciliation', async t => {
  let verified = false;
  const adapter = {
    ready: true, checkoutOrigins: ['https://checkout.example.test'],
    async createCheckout(input) { return { providerLinkId: `link-${input.orderId}`, checkoutUrl: 'https://checkout.example.test/pay', expiresAt: input.expiresAt }; },
    async reconcile(input) { return verified ? { id: 'async-provider-event', transactionId: 'async-provider-tx', provider: 'morning', type: 'succeeded', amountAgorot: 119000, currency: 'ILS', ...input } : null; },
  };
  const original = new CommerceStore({ clock: () => NOW, mode: 'morning', adapter, orderSecret: SECRET, bookingTermsApproved: true });
  t.after(() => original.close());original.seedDrafts();
  const date = original.approveDate(original.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const store = asynchronous(original);
  const checkout = new HostedCheckout({ store, adapter, publicOrigin: 'https://academy.example.test' });
  const created = await store.createOrder(payload(date.id), 'async-hosted-order');
  const started = await checkout.start(created);
  assert.equal(started.checkoutState, 'ready');
  assert.equal((await checkout.start(created)).checkoutUrl, started.checkoutUrl);
  assert.equal((await checkout.refresh(created.orderId)).status, 'pending');
  verified = true;
  await checkout.refreshPending();
  assert.equal((await store.authorizedOrder(created.orderId, created.orderAccessToken)).status, 'paid');
  assert.equal((await store.all('registrations')).length, 1);
});

async function invoke(handler, { path = 'quote', parsed, bytes = Buffer.from('{}'), query, headers = {} } = {}) {
  let status;let output;
  const req = { url: `/api/academy?academyPath=${encodeURIComponent(path)}`, method: 'POST', headers, socket: { remoteAddress: '127.0.0.1' },
    ...(query === undefined ? {} : { query: { academyPath: query } }),
    ...(parsed === undefined ? {} : { body: parsed }),
    async *[Symbol.asyncIterator]() { for (const byte of bytes) yield Buffer.from([byte]); },
  };
  const res = { setHeader() {}, writeHead(code) { status = code; }, end(raw) { output = JSON.parse(raw); } };
  await handler(req, res);
  return { status, value: output };
}

test('handler accepts hosting JSON, rejects reconstructed webhook bytes, bounds bodies and rejects nonstring paths', async () => {
  let signedCalls = 0;
  const exact = JSON.stringify({ note: 'טקסט בעברית', status: 'pending' });
  const handler = createAcademyHandler({ store: { mode: 'simulation', async quote(data) { return { totalAgorot: 119000, couponId: 'private', note: data.note }; }, async processSignedEvent(raw) { signedCalls++;assert.equal(raw, exact);return { accepted: true }; } } });
  const parsed = await invoke(handler, { parsed: { note: 'hosting parsed object' } });
  assert.equal(parsed.value.note, 'hosting parsed object');
  assert.ok(!('couponId' in parsed.value));
  assert.equal((await invoke(handler, { path: 'simulation/webhook', parsed: { note: 'cannot be re-signed' } })).value.error.code, 'RAW_BODY_REQUIRED');
  assert.equal(signedCalls, 0);
  assert.equal((await invoke(handler, { path: 'simulation/webhook', bytes: Buffer.from(exact) })).value.accepted, true);
  assert.equal(signedCalls, 1);
  assert.equal((await invoke(handler, { bytes: Buffer.from('x'.repeat(16385)) })).status, 413);
  assert.equal((await invoke(handler, { parsed: { note: 'x'.repeat(16385) } })).status, 413);
  assert.equal((await invoke(handler, { bytes: Buffer.from('[]') })).value.error.code, 'INVALID_JSON');
  for (const query of [['catalog'], {}, 12]) assert.equal((await invoke(handler, { query })).value.error.code, 'INVALID_PATH');
});

test('HostedCheckout awaits failure persistence when remote creation is ambiguous', async t => {
  const adapter = { ready: true, checkoutOrigins: ['https://checkout.example.test'], async createCheckout() { throw new Error('remote timeout'); } };
  const original = new CommerceStore({ clock: () => NOW, mode: 'morning', adapter, orderSecret: SECRET, bookingTermsApproved: true });
  t.after(() => original.close());original.seedDrafts();
  const date = original.approveDate(original.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const store = asynchronous(original);
  const checkout = new HostedCheckout({ store, adapter, publicOrigin: 'https://academy.example.test' });
  const created = await store.createOrder(payload(date.id), 'async-failure-order');
  const failed = await checkout.start(created);
  assert.equal(failed.checkoutState, 'unknown');
  assert.equal(failed.checkoutUrl, null);
  assert.equal((await store.get('orders', created.orderId)).checkoutState, 'unknown');
});
