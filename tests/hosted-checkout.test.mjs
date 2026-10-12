import test from 'node:test';
import assert from 'node:assert/strict';
import { CommerceStore } from '../server/commerce.mjs';
import { HostedCheckout } from '../server/hosted-checkout.mjs';
import { createAcademyServer } from '../server/http.mjs';

const NOW = Date.parse('2026-10-12T09:00:00Z');
const secret = 'order-secret-test-only-at-least-32-characters';
function setup(t, overrides = {}) {
  const calls = { create: 0, lookup: 0 };
  let verified = null;
  const adapter = {
    ready: true, checkoutOrigins: ['https://checkout.example.test'],
    async createCheckout(input) {
      calls.create++;
      assert.equal(input.amountAgorot, 119000);
      assert.equal(input.currency, 'ILS');
      assert.ok(!JSON.stringify(input).includes(secret));
      return { providerLinkId: `link-${input.orderId}`, checkoutUrl: `https://checkout.example.test/pay/${input.orderId}`, expiresAt: input.expiresAt };
    },
    async reconcile(input) { calls.lookup++; return verified && { ...verified, orderId: input.orderId, providerLinkId: input.providerLinkId }; },
    ...overrides,
  };
  const store = new CommerceStore({ mode: 'morning', adapter, orderSecret: secret, bookingTermsApproved: true, clock: () => NOW });
  t.after(() => store.close());
  store.seedDrafts();
  const date = store.approveDate(store.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const payload = { dateId: date.id, customer: { name: 'משתתף בדיקה', email: 'checkout@example.invalid', phone: '0500000000' }, termsAccepted: true };
  const checkout = new HostedCheckout({ store, adapter, publicOrigin: 'https://academy.example.test' });
  return { store, checkout, calls, payload, adapter, proof: value => { verified = value; } };
}
const proof = (order, extra = {}) => ({ id: `verified-${order.orderId}`, transactionId: `tx-${order.orderId}`, amountAgorot: order.totalAgorot, currency: 'ILS', type: 'succeeded', provider: 'morning', ...extra });

test('hosted checkout creates one link per durable order even when concurrent retries arrive', async t => {
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  const { store, checkout, payload, calls, adapter } = setup(t);
  const create = adapter.createCheckout.bind(adapter);
  adapter.createCheckout = async input => { await wait; return create(input); };
  const order = store.createOrder(payload, 'hosted-retry');
  const first = checkout.start(order);
  assert.equal((await checkout.start(store.createOrder(payload, 'hosted-retry'))).checkoutState, 'creating');
  release();
  const result = await first;
  assert.equal(result.checkoutState, 'ready');
  assert.equal(result.orderAccessToken, order.orderAccessToken);
  assert.equal((await checkout.start(store.createOrder(payload, 'hosted-retry'))).checkoutUrl, result.checkoutUrl);
  assert.equal(calls.create, 1);
  assert.equal(store.all('registrations').length, 0);
});

test('unapproved destination, expiry or ambiguous transport never expose a link or retry creation', async t => {
  for (const bad of ['destination', 'expiry', 'timeout']) {
    let attempts = 0;
    const { store, checkout, payload } = setup(t, { async createCheckout(input) {
      attempts++;
      if (bad === 'timeout') throw new Error('private provider diagnostic must not escape');
      return { providerLinkId: 'created-link', checkoutUrl: bad === 'destination' ? 'https://attacker.example/pay' : 'https://checkout.example.test/pay', expiresAt: new Date(NOW + 3600000).toISOString() };
    } });
    const order = store.createOrder(payload, `bad-${bad}`);
    const result = await checkout.start(order);
    assert.equal(result.checkoutUrl, null);
    assert.equal(result.checkoutState, 'unknown');
    await checkout.start(store.createOrder(payload, `bad-${bad}`));
    assert.equal(attempts, 1);
    assert.equal(store.dateView(store.get('dates', payload.dateId)).pendingCount, 1);
    assert.ok(!JSON.stringify(store.summary()).includes('private provider diagnostic'));
  }
});

test('reconciliation rejects mismatched provider lookup and amount; only verified proof enrolls', async t => {
  const { store, checkout, payload, adapter, proof: setProof } = setup(t);
  const order = await checkout.start(store.createOrder(payload, 'reconcile-proof'));
  assert.equal((await checkout.refresh(order.orderId)).status, 'pending');
  setProof(proof(order, { amountAgorot: 1 }));
  await assert.rejects(checkout.refresh(order.orderId), error => error.code === 'PAYMENT_AMOUNT_MISMATCH');
  const original = adapter.reconcile.bind(adapter);
  adapter.reconcile = async input => ({ ...(await original(input)), providerLinkId: 'another-provider-link' });
  setProof(proof(order));
  await assert.rejects(checkout.refresh(order.orderId), error => error.code === 'INVALID_PROVIDER_RESULT');
  adapter.reconcile = original;
  assert.equal((await checkout.refresh(order.orderId)).status, 'paid');
  assert.equal((await checkout.refresh(order.orderId)).status, 'paid');
  assert.equal(store.all('registrations').length, 1);
});

test('HTTP callback is only a wakeup: forged success and browser return cannot confirm payment', async t => {
  const { store, checkout, payload, proof: setProof, calls } = setup(t);
  const server = createAcademyServer({ store, checkout });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/academy`;
  const response = await fetch(`${base}/orders`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'http-hosted' }, body: JSON.stringify(payload) });
  assert.equal(response.status, 201);
  const order = await response.json();
  const headers = { Authorization: `Bearer ${order.orderAccessToken}`, 'content-type': 'application/json' };
  assert.equal(calls.create, 1);
  assert.equal((await fetch(`${base}/orders/${order.orderId}/reconcile`, { method: 'POST', body: '{}' })).status, 401);
  await fetch(`${base}/payments/morning/notify/${order.orderId}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'status=paid&amount=1190&currency=ILS' });
  assert.equal(store.all('registrations').length, 0);
  assert.equal((await (await fetch(`${base}/orders/${order.orderId}`, { headers })).json()).status, 'pending');
  setProof(proof(order));
  const confirmed = await fetch(`${base}/orders/${order.orderId}/reconcile`, { method: 'POST', headers, body: '{"status":"paid","amount":1}' });
  assert.equal((await confirmed.json()).status, 'paid');
  await fetch(`${base}/payments/morning/notify/${order.orderId}`, { method: 'POST', body: 'duplicate' });
  assert.equal(store.all('registrations').length, 1);
  assert.equal((await fetch(`${base}/simulation/pay`, { method: 'POST', headers, body: JSON.stringify({ orderId: order.orderId }) })).status, 503);
});
