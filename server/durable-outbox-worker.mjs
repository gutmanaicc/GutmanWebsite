import { randomUUID } from 'node:crypto';
import { RESEND_REPLAY_WINDOW_MS } from './resend-delivery-adapter.mjs';
import { jerusalemStart } from './commerce.mjs';

const MAX_ATTEMPTS = 8;
const LEASE_MS = 5 * 60_000;
// Provider key retention is 24h. A delayed/unknown attempt beyond that window
// requires review rather than risking a duplicate message with an expired key.
const SAFE_REPLAY_MS = RESEND_REPLAY_WINDOW_MS - 5 * 60_000;
const iso = value => new Date(value).toISOString();
const safeCode = error => /^[A-Z_]{1,80}$/.test(error?.code ?? '') ? error.code : 'EMAIL_RESULT_UNKNOWN';
const due = (item, now) => ['pending', 'failed', 'processing'].includes(item.status) && item.nextAttemptAt !== null && Number.isFinite(Date.parse(item.nextAttemptAt)) && Date.parse(item.nextAttemptAt) <= now;

/** One durable CAS claim before external sending. Repository callbacks never
 * call the provider; claims/finalizations can be replayed without side effects.
 * Needs an authenticated owner-controlled entry point; no automatic activation.
 */
export class DurableOutboxWorker {
  constructor({ repository, adapter, clock = Date.now } = {}) {
    if (!repository || typeof repository.read !== 'function' || typeof repository.run !== 'function' || typeof clock !== 'function') throw new Error('A durable repository and clock are required for email delivery.');
    if (!adapter || typeof adapter.canDeliver !== 'function' || typeof adapter.prepare !== 'function' || typeof adapter.sendRequest !== 'function') throw new Error('An explicit transactional delivery adapter is required.');
    this.repository = repository; this.adapter = adapter; this.clock = clock;
  }
  get ready() { return this.adapter.ready === true; }
  getReadiness() { return { ...this.adapter.getReadiness(), durableClaims: true, maxAttempts: MAX_ATTEMPTS, replayWindowHours: 24 }; }

  async claim(id) {
    const leaseId = randomUUID();
    return this.repository.run(store => {
      const now = this.clock(); const item = store.get('outbox', id);
      if (!item || !due(item, now) || !this.adapter.canDeliver(item.kind)) return null;
      const stop = reason => {
        item.status = 'failed'; item.nextAttemptAt = null; item.lastError = reason; delete item.deliveryLeaseId;
        store.save('outbox', item); return { stopped: true, reviewRequired: true };
      };
      if (item.attempts >= MAX_ATTEMPTS) return stop('EMAIL_ATTEMPTS_EXHAUSTED');
      if (item.deliveryFirstAttemptAt && (!Number.isFinite(Date.parse(item.deliveryFirstAttemptAt)) || now - Date.parse(item.deliveryFirstAttemptAt) >= SAFE_REPLAY_MS)) return stop('EMAIL_IDEMPOTENCY_WINDOW_EXPIRED');
      if (item.attempts > 0 && (!item.deliveryFirstAttemptAt || !item.deliveryRequest || item.deliveryIdempotencyKey !== `academy-outbox-${item.id}`)) return stop('EMAIL_UNTRACKED_PRIOR_ATTEMPT');
      const order = store.get('orders', item.orderId);
      const date = order && store.get('dates', order.dateId);
      // CRM and private review events are never selected by the adapter. Service
      // emails require a real paid order and its actual customer recipient.
      if (!order || order.simulation || order.provider !== 'morning' || order.status !== 'paid' || !date || date.approvalStatus !== 'approved' || date.status === 'cancelled' || item.payload?.simulation !== false || item.payload?.to !== order.customer.email || (item.kind !== 'followup' && jerusalemStart(date.date) + 5 * 3_600_000 <= now)) {
        item.status = 'cancelled'; item.nextAttemptAt = null; item.lastError = 'EMAIL_SERVICE_NO_LONGER_ELIGIBLE'; delete item.deliveryLeaseId;
        store.save('outbox', item); return { stopped: true, reviewRequired: false };
      }
      if (item.kind === 'followup' && now < jerusalemStart(date.date) + 5 * 3_600_000) return null;
      if (!item.deliveryRequest) {
        try { item.deliveryRequest = this.adapter.prepare(item.payload, { kind: item.kind }); }
        catch (error) { return stop(safeCode(error)); }
      }
      if (item.deliveryRequest.to?.length !== 1 || item.deliveryRequest.to[0] !== order.customer.email) return stop('EMAIL_RECIPIENT_CHANGED');
      item.deliveryFirstAttemptAt ??= iso(now);
      item.deliveryIdempotencyKey ??= `academy-outbox-${item.id}`;
      item.status = 'processing'; item.attempts++; item.deliveryLeaseId = leaseId;
      item.nextAttemptAt = iso(now + LEASE_MS); item.lastError = null;
      store.save('outbox', item);
      return { item, leaseId };
    });
  }

  async finalize(item, leaseId, result, error) {
    return this.repository.run(store => {
      const current = store.get('outbox', item.id);
      if (!current || current.status !== 'processing' || current.deliveryLeaseId !== leaseId) return 'stale';
      const now = this.clock(); delete current.deliveryLeaseId;
      if (result) {
        current.status = 'sent'; current.sentAt = iso(now); current.nextAttemptAt = null; current.lastError = null;
        current.deliveryProvider = result.provider; current.deliveryMessageId = result.messageId; current.deliveryStatus = 'accepted';
      } else {
        current.status = 'failed'; current.lastError = safeCode(error);
        const retryAt = now + Math.min(86_400_000, 60_000 * 2 ** current.attempts);
        const retrySafe = error?.retryable === true && current.attempts < MAX_ATTEMPTS && retryAt - Date.parse(current.deliveryFirstAttemptAt) < SAFE_REPLAY_MS;
        current.nextAttemptAt = retrySafe ? iso(retryAt) : null;
      }
      store.save('outbox', current);
      return current.status;
    });
  }

  async drain(limit = 20) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new Error('Worker batch limit must be between 1 and 50.');
    const report = { enabled: this.ready, claimed: 0, sent: 0, failed: 0, skipped: 0, reviewRequired: 0 };
    if (!this.ready) return report;
    const candidates = await this.repository.read(store => store.all('outbox').filter(item => this.adapter.canDeliver(item.kind) && due(item, this.clock())).sort((a, b) => Date.parse(a.nextAttemptAt) - Date.parse(b.nextAttemptAt)).slice(0, limit).map(item => item.id));
    for (const id of candidates) {
      const claim = await this.claim(id);
      if (!claim) { report.skipped++; continue; }
      if (claim.stopped) { report.skipped++; if (claim.reviewRequired) report.reviewRequired++; continue; }
      report.claimed++;
      let result; let error;
      try { result = await this.adapter.sendRequest(claim.item.deliveryRequest, { kind: claim.item.kind, idempotencyKey: claim.item.deliveryIdempotencyKey }); }
      catch (cause) { error = cause; }
      // Persist outside the transport catch: a failed persistence write must
      // leave its claim for safe recovery, never launch another external send.
      const state = await this.finalize(claim.item, claim.leaseId, result, error);
      if (state === 'sent') report.sent++; else if (state === 'failed') report.failed++; else report.skipped++;
    }
    return report;
  }
}
