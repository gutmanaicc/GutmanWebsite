import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSelfHostedRuntime } from '../server/self-hosted-runtime.mjs';
import { createAcademyServer } from '../server/http.mjs';

const NOW = Date.parse('2026-10-13T10:00:00Z');
const DOC = '01234567-89ab-4cde-8fab-0123456789ab';
const relay = 'https://hook.us2.make.com/abcdefghijklmnopqrstuvwx12345678';
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'academy-paid-crm-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const env = { ACADEMY_DB_PATH: join(dir, 'academy.sqlite'), ACADEMY_PAYMENT_MODE: 'morning', ACADEMY_ORDER_SECRET: 'test-only-order-secret-at-least-32-characters', ACADEMY_BOOKING_TERMS_APPROVED: '1', ACADEMY_PUBLIC_ORIGIN: 'https://academy.example.test', MORNING_API_ID: 'test-id', MORNING_API_SECRET: 'test-secret', MORNING_BUSINESS_TAX_ID: 'test-merchant', MORNING_MERCHANT_VERIFIED: '1', MORNING_CHECKOUT_ORIGINS: 'https://checkout.example.test', HUBSPOT_LEADS_ENABLED: '1', HUBSPOT_LEAD_TRANSPORT: 'make', HUBSPOT_PORTAL_ID: '149533496', HUBSPOT_MAKE_WEBHOOK_URL: relay };
  const calls = { forms: [], crm: [], paid: false, rejectCRM: false };
  const provider = async (url, options) => {
    const body = JSON.parse(options.body || '{}');
    if (url === relay) {
      calls.crm.push(body); if (calls.rejectCRM) throw Error('Private diagnostic');
      return Response.json({ received: true, leadId: body.leadId, portalId: env.HUBSPOT_PORTAL_ID, contactId: '12345' });
    }
    if (url.endsWith('/idp/v1/oauth/token')) return Response.json({ accessToken: 'test-token', tokenType: 'Bearer', expiresAt: Math.floor(NOW / 1000) + 3600 });
    if (url.endsWith('/payments/form')) { calls.forms.push(body); return Response.json({ success: true, errorCode: 0, url: 'https://checkout.example.test/test' }); }
    if (url.endsWith('/documents/search')) return Response.json({ pages: calls.paid ? 1 : 0, items: calls.paid ? [{ id: DOC, description: calls.forms[0].description }] : [] });
    if (url.endsWith(`/documents/${DOC}`)) return Response.json({ id: DOC, description: calls.forms[0].description, type: 400, status: 0, currency: 'ILS', amount: 1190, vat: 0, vatType: 1, business: { taxId: 'test-merchant', exemption: true }, payment: [{ type: 3, price: 1190, currency: 'ILS' }] });
    assert.fail('Unexpected provider call');
  };
  const runtime = createSelfHostedRuntime(env, { fetchImpl: provider, clock: () => NOW });
  t.after(() => runtime.close());
  const date = runtime.store.approveDate(runtime.store.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const payload = { dateId: date.id, termsAccepted: true, customer: { name: 'משתתף בדיקה', email: 'test@example.invalid', phone: '0501234567' } };
  return { runtime, env, provider, calls, date, payload };
}
async function paidOrder(context) {
  const { runtime, payload, calls } = context;
  const order = await runtime.checkout.start(runtime.store.createOrder(payload, 'paid-crm-test-key'));
  calls.paid = true; assert.equal((await runtime.checkout.refresh(order.orderId)).status, 'paid'); return order;
}
test('checkout captures contact once, preserves payment availability on CRM failure and never trusts client-paid stage', async t => {
  const { runtime, calls, payload, date } = fixture(t);
  const server = createAcademyServer({ store: runtime.store, checkout: runtime.checkout, leadIntake: runtime.leadIntake });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const request = body => fetch(`http://127.0.0.1:${server.address().port}/api/academy/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'checkout-crm-http-key' }, body: JSON.stringify(body) });
  assert.equal((await request({ ...payload, termsAccepted: false })).status, 400); assert.equal(calls.crm.length, 0);
  calls.rejectCRM = true;
  const result = await request({ ...payload, gutman_lead_stage: 'registered' }); assert.equal(result.status, 201);
  const created = await result.json(); assert.equal(created.checkoutState, 'ready'); assert.equal(created.status, 'pending');
  assert.equal((await request(payload)).status, 201); assert.equal(calls.forms.length, 1); assert.equal(calls.crm.length, 1);
  assert.equal(calls.crm[0].gutman_lead_stage, 'new'); assert.equal(calls.crm[0].gutman_marketing_consent, 'no');
  assert.equal(calls.forms[0].description, `Gutman Academy | ${created.orderId}`);
  assert.match(calls.forms[0].income[0].description, new RegExp(date.date)); assert.ok(calls.forms[0].remarks.includes(date.venue)); assert.ok(calls.forms[0].remarks.includes('מינימום 8'));
  assert.equal((await runtime.crmWorker.drain()).sent, 0); assert.equal(runtime.store.all('registrations').length, 0);
});
test('only authenticated matching receipt creates a registered CRM update; persistent acceptance prevents replay after finalization failure', async t => {
  const context = fixture(t); const { runtime, calls, env, provider } = context;
  await paidOrder(context);
  const save = runtime.store.save.bind(runtime.store); let fail = true;
  runtime.store.save = (table, row) => { if (table === 'outbox' && row.kind === 'crm_registration' && row.status === 'sent' && fail) { fail = false; throw Error('Persistence interruption'); } return save(table, row); };
  await assert.rejects(runtime.crmWorker.drain(), /Persistence interruption/); assert.equal(calls.crm.length, 1); assert.equal(calls.crm[0].gutman_lead_stage, 'registered');
  assert.equal(calls.crm[0].gutman_marketing_consent, 'no'); assert.match(calls.crm[0].gutman_note, /1190/);
  assert.equal((await runtime.crmWorker.drain()).sent, 1); assert.equal(calls.crm.length, 1);
  assert.equal((await runtime.crmWorker.drain()).sent, 0); assert.ok(runtime.store.all('outbox').filter(row => row.kind !== 'crm_registration').every(row => row.status === 'pending'));
  // The second runtime reuses the persisted intake acknowledgment; no network call.
  const reopened = createSelfHostedRuntime(env, { fetchImpl: provider, clock: () => NOW });
  try { assert.equal((await reopened.crmWorker.drain()).sent, 0); assert.equal(calls.crm.length, 1); } finally { reopened.close(); }
});
test('uncertain paid CRM sends stop for review rather than replaying, including after restart', async t => {
  const context = fixture(t); const { runtime, calls, env, provider } = context; await paidOrder(context); calls.rejectCRM = true;
  assert.equal((await runtime.crmWorker.drain()).reviewRequired, 1); assert.equal((await runtime.crmWorker.drain()).sent, 0); assert.equal(calls.crm.length, 1);
  const row = runtime.store.all('outbox').find(row => row.kind === 'crm_registration'); assert.equal(row.nextAttemptAt, null); assert.equal(row.lastError, 'CRM_REGISTRATION_REVIEW_REQUIRED');
  const reopened = createSelfHostedRuntime(env, { fetchImpl: provider, clock: () => NOW });
  try { assert.equal((await reopened.crmWorker.drain()).sent, 0); assert.equal(calls.crm.length, 1); } finally { reopened.close(); }
});
test('simulated or invalid enrollment cannot be forwarded as registered, and legal gate also blocks CRM worker', async t => {
  const context = fixture(t); const { runtime, calls } = context; await paidOrder(context);
  runtime.store.bookingTermsApproved = false; assert.equal((await runtime.crmWorker.drain()).sent, 0); assert.equal(calls.crm.length, 0);
  runtime.store.bookingTermsApproved = true;
  const registration = runtime.store.all('registrations')[0]; registration.simulation = true; runtime.store.save('registrations', registration);
  assert.equal((await runtime.crmWorker.drain()).skipped, 1); assert.equal(calls.crm.length, 0); assert.equal(runtime.store.all('outbox').find(row => row.kind === 'crm_registration').status, 'cancelled');
});
