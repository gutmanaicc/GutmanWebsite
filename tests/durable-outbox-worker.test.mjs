import test from 'node:test';
import assert from 'node:assert/strict';
import { DurableCommerceRepository } from '../server/durable-commerce.mjs';
import { DurableOutboxWorker } from '../server/durable-outbox-worker.mjs';
import { ResendDeliveryAdapter, createResendDeliveryAdapter, RESEND_REPLAY_WINDOW_MS } from '../server/resend-delivery-adapter.mjs';

const NOW = Date.parse('2026-10-12T10:00:00Z');
const MESSAGE_ID = '01234567-89ab-4cde-8fab-0123456789ab';
const OPTIONS = { apiKey: 'mock-only-resend-secret', from: 'Gutman Academy <academy@example.test>', enabled: true, senderVerified: true, approvedKinds: ['confirmation'] };
class Backend {
  record = null; writes = 0; failNextWrite = false;
  async read() { await Promise.resolve(); return this.record && structuredClone(this.record); }
  async write(snapshot, { etag }) {
    await Promise.resolve();
    if (this.failNextWrite) { this.failNextWrite = false; throw new Error('Mock private storage failure'); }
    if ((etag === null && this.record) || (etag !== null && this.record?.etag !== etag)) { const error = new Error('CAS'); error.code = etag === null ? 'ALREADY_EXISTS' : 'PRECONDITION_FAILED'; throw error; }
    this.record = { snapshot: structuredClone(snapshot), etag: `etag-${++this.writes}` }; return { etag: this.record.etag };
  }
}
const success = () => new Response(JSON.stringify({ id: MESSAGE_ID }), { headers: { 'Content-Type': 'application/json' } });
async function setup(fetchImpl, adapterOptions = {}) {
  let now = NOW;
  const clock = () => now; const backend = new Backend();
  const repository = new DurableCommerceRepository({ backend, clock, storeOptions: { mode: 'morning', orderSecret: 'mock-order-secret-at-least-32-characters', bookingTermsApproved: true, adapter: { ready: true } } });
  const initial = await repository.run(store => {
    const date = store.approveDate(store.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
    const order = store.createOrder({ dateId: date.id, termsAccepted: true, customer: { name: 'Mock participant', email: 'participant@example.test', phone: '0501234567' } }, 'outbox-test-order');
    store.processVerifiedEvent({ id: 'mock-event', orderId: order.orderId, transactionId: 'mock-receipt', provider: 'morning', type: 'succeeded', amountAgorot: order.totalAgorot, currency: 'ILS' });
    return { orderId: order.orderId, dateId: date.id, item: store.all('outbox').find(item => item.kind === 'confirmation') };
  });
  const adapter = new ResendDeliveryAdapter({ ...OPTIONS, fetchImpl, ...adapterOptions });
  const worker = new DurableOutboxWorker({ repository, adapter, clock });
  return { backend, repository, adapter, worker, ...initial, clock, advance: ms => { now += ms; }, getItem: () => repository.read(store => store.get('outbox', initial.item.id)), mutateItem: fn => repository.run(store => { const item = store.get('outbox', initial.item.id); fn(item); store.save('outbox', item); return item; }) };
}

test('delivery requires explicit enabled sender and approved service kinds; Resend contract uses one exact frozen request and provider acceptance only', async () => {
  let calls = 0;
  const payload = { simulation: false, to: 'participant@example.test', subject: 'אישור הרשמה', text: 'תוכן שירות מאושר' };
  const disabled = createResendDeliveryAdapter({ RESEND_API_KEY: 'secret', ACADEMY_EMAIL_FROM: 'academy@example.test', ACADEMY_EMAIL_SENDER_VERIFIED: '1', ACADEMY_EMAIL_APPROVED_KINDS: 'confirmation' }, { fetchImpl: () => { calls++; throw Error('must not send'); } });
  assert.equal(disabled.ready, false); assert.equal(JSON.stringify(disabled.getReadiness()).includes('secret'), false);
  assert.throws(() => disabled.prepare(payload, { kind: 'confirmation' }), error => error.code === 'EMAIL_DELIVERY_DISABLED');
  assert.equal(calls, 0);
  const adapter = new ResendDeliveryAdapter({ ...OPTIONS, fetchImpl: async (url, options) => {
    calls++; assert.equal(url, 'https://api.resend.com/emails'); assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer mock-only-resend-secret'); assert.equal(options.headers['Idempotency-Key'], 'academy-outbox-test');
    assert.deepEqual(JSON.parse(options.body), { from: OPTIONS.from, to: [payload.to], subject: payload.subject, text: payload.text }); return success();
  } });
  assert.equal(adapter.canDeliver('crm_registration'), false); assert.equal(adapter.canDeliver('minimum_reached'), false);
  assert.throws(() => adapter.prepare({ ...payload, simulation: true }, { kind: 'confirmation' }), error => error.code === 'INVALID_EMAIL_REQUEST');
  const request = adapter.prepare(payload, { kind: 'confirmation' });
  assert.deepEqual(await adapter.sendRequest(request, { kind: 'confirmation', idempotencyKey: 'academy-outbox-test' }), { provider: 'resend', messageId: MESSAGE_ID, deliveryStatus: 'accepted' });
  assert.equal(calls, 1);
});

test('two durable workers race for one claim; provider sending occurs only after persisted claim and sent/CRM/unapproved items are never resent', async () => {
  let calls = 0; let context;
  const fetchImpl = async (_url, options) => {
    calls++;
    const persisted = JSON.parse(context.backend.record.snapshot.tables.outbox.find(row => row.id === context.item.id).data);
    assert.equal(persisted.status, 'processing'); assert.equal(persisted.attempts, 1);
    assert.deepEqual(persisted.deliveryRequest, JSON.parse(options.body));
    assert.equal(options.headers['Idempotency-Key'], `academy-outbox-${context.item.id}`);
    return success();
  };
  context = await setup(fetchImpl);
  const second = new DurableOutboxWorker({ repository: context.repository, adapter: context.adapter, clock: context.clock });
  const results = await Promise.all([context.worker.drain(), second.drain()]);
  assert.equal(calls, 1); assert.equal(results.reduce((sum, value) => sum + value.sent, 0), 1);
  const sent = await context.getItem(); assert.equal(sent.status, 'sent'); assert.equal(sent.deliveryMessageId, MESSAGE_ID); assert.equal(sent.deliveryStatus, 'accepted');
  assert.equal((await second.drain()).claimed, 0); assert.equal(calls, 1);
  const blocked = await context.repository.read(store => store.all('outbox').filter(item => ['crm_registration', 'preparation'].includes(item.kind)));
  assert.ok(blocked.length >= 2); assert.ok(blocked.every(item => item.status === 'pending' && item.attempts === 0));
});

test('unknown timeout retries inside provider window with frozen body/key; 409 never retries or exposes provider diagnostics', async () => {
  const calls = []; let behavior = 'timeout';
  const context = await setup(async (_url, options) => {
    calls.push({ body: options.body, key: options.headers['Idempotency-Key'] });
    if (behavior === 'timeout') throw new Error('participant@example.test private-provider-secret');
    if (behavior === 'conflict') return new Response(JSON.stringify({ message: 'private-provider-secret' }), { status: 409 });
    return success();
  });
  assert.equal((await context.worker.drain()).failed, 1);
  const failed = await context.getItem(); assert.equal(failed.status, 'failed'); assert.equal(failed.attempts, 1); assert.ok(failed.nextAttemptAt); assert.equal(failed.lastError, 'EMAIL_NETWORK_ERROR');
  await context.mutateItem(item => { item.payload.text = 'Owner changed later template; retry must keep original body'; });
  context.advance(2 * 60_000); behavior = 'conflict';
  assert.equal((await context.worker.drain()).failed, 1);
  assert.equal(calls.length, 2); assert.deepEqual(calls[0], calls[1]);
  const conflict = await context.getItem(); assert.equal(conflict.nextAttemptAt, null); assert.equal(conflict.lastError, 'EMAIL_IDEMPOTENCY_CONFLICT');
  context.advance(60 * 60_000); assert.equal((await context.worker.drain()).claimed, 0); assert.equal(calls.length, 2);
  assert.ok(!JSON.stringify(conflict).includes('private-provider-secret'));
});

test('crash after provider acceptance is recovered using the same key; expired idempotency window and exhausted attempts require review without sending', async () => {
  let context; let calls = 0; let actualDeliveries = 0; const providerKeys = new Map();
  context = await setup(async (_url, options) => {
    calls++; const key = options.headers['Idempotency-Key'];
    if (!providerKeys.has(key)) { providerKeys.set(key, options.body); actualDeliveries++; } else assert.equal(providerKeys.get(key), options.body);
    if (calls === 1) context.backend.failNextWrite = true; // Claim is persisted; finalization will fail.
    return success();
  });
  await assert.rejects(context.worker.drain(), /storage failure/);
  assert.equal((await context.getItem()).status, 'processing'); assert.equal(calls, 1);
  context.advance(5 * 60_000);
  const restarted = new DurableOutboxWorker({ repository: context.repository, adapter: context.adapter, clock: context.clock });
  assert.equal((await restarted.drain()).sent, 1); assert.equal(calls, 2); assert.equal(actualDeliveries, 1);
  assert.equal((await context.getItem()).attempts, 2);

  let expiredCalls = 0;
  const expired = await setup(async () => { expiredCalls++; return success(); });
  await expired.mutateItem(item => { item.status = 'processing'; item.attempts = 1; item.deliveryFirstAttemptAt = new Date(NOW - RESEND_REPLAY_WINDOW_MS).toISOString(); item.nextAttemptAt = new Date(NOW).toISOString(); });
  assert.equal((await expired.worker.drain()).reviewRequired, 1); assert.equal(expiredCalls, 0);
  assert.equal((await expired.getItem()).nextAttemptAt, null); assert.equal((await expired.getItem()).lastError, 'EMAIL_IDEMPOTENCY_WINDOW_EXPIRED');
  assert.equal((await expired.worker.drain()).claimed, 0);
  const legacy = await setup(async () => { assert.fail('An unknown prior delivery must require review'); });
  await legacy.mutateItem(item => { item.status = 'failed'; item.attempts = 1; });
  assert.equal((await legacy.worker.drain()).reviewRequired, 1);
  assert.equal((await legacy.getItem()).lastError, 'EMAIL_UNTRACKED_PRIOR_ATTEMPT');
  assert.equal((await legacy.getItem()).nextAttemptAt, null);

  let exhaustedCalls = 0;
  const exhausted = await setup(async () => { exhaustedCalls++; return new Response('{}', { status: 503 }); });
  await exhausted.worker.drain(); exhaustedCalls = 0;
  await exhausted.mutateItem(item => { item.status = 'failed'; item.attempts = 7; item.nextAttemptAt = new Date(NOW).toISOString(); });
  assert.equal((await exhausted.worker.drain()).failed, 1); assert.equal((await exhausted.getItem()).attempts, 8); assert.equal((await exhausted.getItem()).nextAttemptAt, null);
  exhausted.advance(7 * 86_400_000); assert.equal((await exhausted.worker.drain()).claimed, 0); assert.equal(exhaustedCalls, 1);
});

test('stale worker completion cannot overwrite a cancelled message; simulation and changed recipient fail closed', async () => {
  let resolveSend; const waiting = new Promise(resolve => { resolveSend = resolve; }); let calls = 0;
  const context = await setup(async () => { calls++; await waiting; return success(); });
  const started = context.worker.drain();
  while ((await context.getItem()).status !== 'processing') await new Promise(resolve => setImmediate(resolve));
  await context.mutateItem(item => { item.status = 'cancelled'; item.nextAttemptAt = null; });
  resolveSend(); const result = await started;
  assert.equal(result.sent, 0); assert.equal((await context.getItem()).status, 'cancelled');
  assert.equal((await context.worker.drain()).claimed, 0); assert.equal(calls, 1);
  for (const mutate of [item => { item.payload.simulation = true; }, item => { item.payload.to = 'different-recipient@example.test'; }]) {
    const ineligible = await setup(async () => { assert.fail('An ineligible message must not be sent'); });
    await ineligible.mutateItem(mutate);
    assert.equal((await ineligible.worker.drain()).claimed, 0);
    assert.equal((await ineligible.getItem()).status, 'cancelled');
  }
});

test('sender configuration changes stop replay without a new key; timeout/invalid response are uncertain and retries remain bounded', async () => {
  let calls = 0;
  const context = await setup(async () => { calls++; throw new Error('unknown provider outcome'); });
  await context.worker.drain(); context.advance(2 * 60_000);
  const changed = new ResendDeliveryAdapter({ ...OPTIONS, from: 'new-sender@example.test', fetchImpl: async () => { assert.fail('Do not change sender under the same key'); } });
  const changedWorker = new DurableOutboxWorker({ repository: context.repository, adapter: changed, clock: context.clock });
  assert.equal((await changedWorker.drain()).failed, 1); assert.equal((await context.getItem()).nextAttemptAt, null); assert.equal(calls, 1);
  const timeout = new ResendDeliveryAdapter({ ...OPTIONS, timeoutMs: 5, fetchImpl: async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('private timeout detail')), { once: true })) });
  const payload = { simulation: false, to: 'participant@example.test', subject: 'Service', text: 'Service content' };
  await assert.rejects(timeout.sendRequest(timeout.prepare(payload, { kind: 'confirmation' }), { kind: 'confirmation', idempotencyKey: 'timeout-test' }), error => error.code === 'EMAIL_TIMEOUT' && error.retryable === true && error.uncertain === true && !error.message.includes('private timeout'));
});
