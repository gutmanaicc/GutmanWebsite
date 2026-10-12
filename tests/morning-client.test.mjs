import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { MorningClient } from '../server/morning-client.mjs';

const NOW = Date.parse('2026-10-12T10:00:00Z');
const SECRET = 'test-only-webhook-secret-at-least-32-characters';
const ID = '01234567-89ab-4cde-8fab-0123456789ab';
const OTHER = '11234567-89ab-4cde-8fab-0123456789ab';
const OPTIONS = { clientId: 'test-client-id', clientSecret: 'test-client-secret', webhookSecret: SECRET, businessTaxId: 'test-merchant', checkoutOrigins: ['https://verified-checkout.example.test'], merchantVerified: true, clock: () => NOW };
const INPUT = { reference: 'ACADEMY-order-test-reference', amountAgorot: 119001, customer: { name: 'Test participant' }, successUrl: 'https://academy.example.test/success', failureUrl: 'https://academy.example.test/failure', notifyUrl: 'https://academy.example.test/notify' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const auth = (now = NOW) => json({ accessToken: 'test-bearer-token', tokenType: 'Bearer', expiresAt: Math.floor(now / 1000) + 120 });
const document = overrides => ({ id: ID, description: INPUT.reference, type: 400, status: 0, currency: 'ILS', amount: 1190.01, vat: 0, vatType: 1, payment: [{ type: 3, price: 1190.01, currency: 'ILS', ref: [] }], business: { taxId: 'test-merchant', exemption: true }, ...overrides });

test('official token endpoints, concurrent deduplication and 60-second expiry safety; exact receipt/VAT payload with no ad-hoc emails', async () => {
  let now = NOW; const calls = [];
  const client = new MorningClient({ ...OPTIONS, environment: 'sandbox', clock: () => now, fetchImpl: async (url, options) => {
    calls.push({ url, options, body: options.body && JSON.parse(options.body) });
    if (url.endsWith('/idp/v1/oauth/token')) { await Promise.resolve(); return auth(now); }
    return json({ success: true, errorCode: 0, url: 'https://verified-checkout.example.test/pay/test' }, 201);
  } });
  const results = await Promise.all([client.createPaymentForm(INPUT), client.createPaymentForm(INPUT)]);
  assert.deepEqual(results[0], { url: 'https://verified-checkout.example.test/pay/test' });
  assert.equal(calls.filter(call => call.url.endsWith('/idp/v1/oauth/token')).length, 1);
  assert.equal(calls[0].url, 'https://api.sandbox.morning.dev/idp/v1/oauth/token');
  assert.deepEqual(calls[0].body, { grant_type: 'client_credentials', client_id: 'test-client-id', client_secret: 'test-client-secret' });
  const form = calls.find(call => call.url.endsWith('/payments/form'));
  assert.equal(form.url, 'https://sandbox.d.greeninvoice.co.il/api/v1/payments/form');
  assert.equal(form.options.redirect, 'error'); assert.equal(form.options.headers.Authorization, 'Bearer test-bearer-token');
  assert.equal(form.body.type, 400); assert.equal(form.body.vatType, 1); assert.equal(form.body.income[0].vatType, 2);
  assert.equal(form.body.amount, 1190.01); assert.equal(form.body.income[0].price, 1190.01);
  assert.equal(form.body.currency, 'ILS'); assert.equal(form.body.group, 100); assert.equal(form.body.maxPayments, 1);
  assert.equal(form.body.client.emails, undefined); assert.equal(form.body.client.add, false); assert.equal(form.body.custom, INPUT.reference);
  assert.equal('id' in results[0], false); assert.equal('expiresAt' in results[0], false);
  now += 59_000; await client.createPaymentForm(INPUT); assert.equal(calls.filter(call => call.url.endsWith('/idp/v1/oauth/token')).length, 1);
  now += 2_000; await client.createPaymentForm(INPUT); assert.equal(calls.filter(call => call.url.endsWith('/idp/v1/oauth/token')).length, 2);
});

test('merchant readiness fails closed; consumer totals and canonical provider URLs are validated without invented checkout metadata', async () => {
  const unverified = new MorningClient({ ...OPTIONS, merchantVerified: false, fetchImpl: () => { throw Error('Must not call a supplier'); } });
  assert.equal(unverified.configured, true); assert.equal(unverified.ready, false);
  assert.equal(JSON.stringify(unverified.getReadiness()).includes('test-client-secret'), false);
  await assert.rejects(unverified.createPaymentForm(INPUT), { code: 'MERCHANT_NOT_VERIFIED' });
  assert.throws(() => new MorningClient({ ...OPTIONS, checkoutOrigins: ['https://verified-checkout.example.test/path'] }), { code: 'INVALID_CONFIGURATION' });
  let returnedUrl = 'https://unverified.example.test/payment';
  const client = new MorningClient({ ...OPTIONS, fetchImpl: async url => url.endsWith('/idp/v1/oauth/token') ? auth() : json({ success: true, errorCode: 0, url: returnedUrl }, 201) });
  await assert.rejects(client.createPaymentForm({ ...INPUT, amountAgorot: 1.1 }), { code: 'INVALID_AMOUNT' });
  await assert.rejects(client.createPaymentForm(INPUT), { code: 'UNVERIFIED_CHECKOUT_ORIGIN' });
  returnedUrl = 'https://test:password@verified-checkout.example.test/pay';
  await assert.rejects(client.createPaymentForm(INPUT), { code: 'INVALID_URL' });
  returnedUrl = 'https://verified-checkout.example.test/pay';
  assert.deepEqual(await client.createPaymentForm(INPUT), { url: returnedUrl });
});

test('payment POST is not retried on unauthorized failure and provider diagnostics are never returned', async () => {
  const calls = [];
  const client = new MorningClient({ ...OPTIONS, fetchImpl: async url => { calls.push(url); return url.endsWith('/idp/v1/oauth/token') ? auth() : json({ message: 'private-provider-diagnostics test-client-secret' }, 401); } });
  await assert.rejects(client.createPaymentForm({ ...INPUT, customer: { name: 'Participant', email: 'transaction@example.test', phone: '0501234567' } }), error => error.code === 'PROVIDER_HTTP_ERROR' && error.status === 401 && !error.message.includes('private-provider-diagnostics'));
  assert.equal(calls.filter(url => url.endsWith('/payments/form')).length, 1);
  assert.equal(calls.filter(url => url.endsWith('/idp/v1/oauth/token')).length, 1);
});

test('reconciliation searches exact reference and accepts only a matching receipt with verified merchant, exempt VAT and real positive payment total', async () => {
  let current = document(); const calls = [];
  const client = new MorningClient({ ...OPTIONS, fetchImpl: async (url, options) => {
    calls.push({ url, body: options.body && JSON.parse(options.body) });
    if (url.endsWith('/idp/v1/oauth/token')) return auth();
    if (url.endsWith('/documents/search')) return json({ items: [{ id: ID, description: INPUT.reference }, { id: OTHER, description: 'Another order' }], pages: 1 });
    assert.equal(url, `https://api.greeninvoice.co.il/api/v1/documents/${ID}`); return json(current);
  } });
  const input = { reference: INPUT.reference, amountAgorot: INPUT.amountAgorot, orderDate: '2026-10-10' };
  assert.equal((await client.reconcile(input)).id, ID);
  assert.deepEqual(calls.find(call => call.url.endsWith('/documents/search')).body, { page: 1, pageSize: 25, type: [400], description: INPUT.reference, fromDate: '2026-10-10', toDate: '2026-10-12', sort: 'date:desc' });
  for (const change of [
    { description: 'Prefix ACAEMY-order-test-reference suffix' }, { type: 300 }, { amount: 1190 }, { currency: 'USD' },
    { vat: 1 }, { vatType: 0 }, { business: { taxId: 'different-merchant', exemption: true } },
    { status: 2 }, { status: 3 }, { status: 4 }, { status: 1, payment: [] },
    { payment: [{ type: 3, price: -1190.01, currency: 'ILS' }] },
    { payment: [{ type: 0, price: 1190.01, currency: 'ILS' }] },
    { payment: [{ type: 99, price: 1190.01, currency: 'ILS' }] },
    { payment: [{ type: 3, price: 1190, currency: 'ILS' }] },
    { payment: [{ type: 3, price: 1190.01, currency: 'USD' }] },
  ]) { current = document(change); assert.equal(await client.reconcile(input), null); }
  current = document({ status: 1, payment: [{ type: 3, price: 600, currency: 'ILS' }, { type: 3, price: 590.01, currency: 'ILS' }] });
  assert.equal((await client.reconcile(input)).id, ID);
});

test('reconciliation traverses search pages and refuses ambiguous matching receipts', async () => {
  const client = new MorningClient({ ...OPTIONS, fetchImpl: async (url, options) => {
    if (url.endsWith('/idp/v1/oauth/token')) return auth();
    if (url.endsWith('/documents/search')) { const page = JSON.parse(options.body).page; return json({ items: [{ id: page === 1 ? ID : OTHER, description: INPUT.reference }], pages: 2 }); }
    return json(document({ id: url.endsWith(ID) ? ID : OTHER }));
  } });
  assert.equal(await client.reconcile({ reference: INPUT.reference, amountAgorot: INPUT.amountAgorot, orderDate: '2026-10-12' }), null);
});

test('timeout is bounded and HMAC validates only the signed raw JSON without guessing event shape', async () => {
  const client = new MorningClient({ ...OPTIONS, timeoutMs: 5, fetchImpl: async (_url, options) => new Promise((_resolve, reject) => { options.signal.addEventListener('abort', () => reject(new Error('provider secret diagnostic')), { once: true }); }) });
  await assert.rejects(client.createPaymentForm(INPUT), { code: 'PROVIDER_TIMEOUT' });
  const raw = JSON.stringify({ unusualEnvelope: { document: ID, arbitraryStatus: 'unknown' } });
  const signature = createHmac('sha256', SECRET).update(raw).digest('hex');
  assert.deepEqual(client.verifyWebhook(raw, { 'X-Webhook-Signature': signature }), JSON.parse(raw));
  assert.deepEqual(client.verifyWebhook(Buffer.from(raw), new Headers({ 'x-webhook-signature': signature })), JSON.parse(raw));
  assert.equal(client.verifyWebhook(`${raw} `, { 'x-webhook-signature': signature }), null);
  assert.equal(client.verifyWebhook(raw, { 'x-webhook-signature': 'z'.repeat(64) }), null);
  assert.equal(client.verifyWebhook(raw, { 'x-webhook-signature': signature.slice(1) }), null);
  const malformed = '{'; const malformedSignature = createHmac('sha256', SECRET).update(malformed).digest('hex');
  assert.equal(client.verifyWebhook(malformed, { 'x-webhook-signature': malformedSignature }), null);
  assert.equal(new MorningClient({ webhookSecret: 'short' }).verifyWebhook(raw, { 'x-webhook-signature': signature }), null);
});
