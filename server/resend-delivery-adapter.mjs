// Official contracts: https://resend.com/docs/api-reference/emails/send-email
// https://resend.com/docs/dashboard/emails/idempotency-keys (24-hour retention).
export const SERVICE_EMAIL_KINDS = Object.freeze(['confirmation', 'preparation', 'reminder', 'followup']);
export const RESEND_REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const allowedKinds = new Set(SERVICE_EMAIL_KINDS);
const email = value => typeof value === 'string' && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
function validFrom(value) {
  if (typeof value !== 'string' || /[\r\n]/.test(value)) return false;
  const match = value.match(/^[^<>]+ <([^<>]+)>$/);
  return email(match ? match[1] : value);
}
export class EmailDeliveryError extends Error {
  constructor(code, { retryable = false, uncertain = false } = {}) {
    super('Transactional email delivery did not complete; provider diagnostics are withheld.');
    this.name = 'EmailDeliveryError'; this.code = code; this.retryable = retryable; this.uncertain = uncertain;
  }
}
const invalid = () => { throw new EmailDeliveryError('INVALID_EMAIL_REQUEST'); };

export class ResendDeliveryAdapter {
  #apiKey; #from; #fetch; #timeout; #enabled; #senderVerified; #kinds;
  constructor({ apiKey, from, enabled = false, senderVerified = false, approvedKinds = [], fetchImpl = globalThis.fetch, timeoutMs = 10_000 } = {}) {
    if (!Array.isArray(approvedKinds) || approvedKinds.some(kind => !allowedKinds.has(kind))) throw new Error('Only reviewed transactional service email kinds may be configured.');
    if (typeof fetchImpl !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error('A bounded email delivery timeout and fetch implementation are required.');
    this.#apiKey = apiKey; this.#from = from; this.#enabled = enabled === true; this.#senderVerified = senderVerified === true;
    this.#kinds = new Set(approvedKinds); this.#fetch = fetchImpl; this.#timeout = timeoutMs;
  }
  get ready() { return this.#enabled && this.#senderVerified && typeof this.#apiKey === 'string' && !!this.#apiKey.trim() && validFrom(this.#from) && this.#kinds.size > 0; }
  getReadiness() { return { provider: 'resend', enabled: this.#enabled, configured: typeof this.#apiKey === 'string' && !!this.#apiKey.trim() && validFrom(this.#from), senderVerified: this.#senderVerified, approvedKinds: [...this.#kinds], ready: this.ready }; }
  canDeliver(kind) { return this.ready && this.#kinds.has(kind); }
  prepare(payload, { kind } = {}) {
    if (!this.canDeliver(kind)) throw new EmailDeliveryError('EMAIL_DELIVERY_DISABLED');
    if (!payload || payload.simulation !== false || !email(payload.to) || typeof payload.subject !== 'string' || !payload.subject.trim() || /[\r\n]/.test(payload.subject) || typeof payload.text !== 'string' || !payload.text.trim()) invalid();
    return { from: this.#from, to: [payload.to], subject: payload.subject, text: payload.text };
  }
  async sendRequest(request, { idempotencyKey, kind } = {}) {
    if (!this.canDeliver(kind)) throw new EmailDeliveryError('EMAIL_DELIVERY_DISABLED');
    // Frozen requests keep both sender and content stable across provider retries.
    if (!request || request.from !== this.#from || !Array.isArray(request.to) || request.to.length !== 1 || !email(request.to[0]) || typeof request.subject !== 'string' || !request.subject.trim() || /[\r\n]/.test(request.subject) || typeof request.text !== 'string' || !request.text.trim() || Object.keys(request).sort().join(',') !== 'from,subject,text,to' || typeof idempotencyKey !== 'string' || idempotencyKey.length < 1 || idempotencyKey.length > 256 || /[^\x21-\x7e]/.test(idempotencyKey)) invalid();
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.#timeout);
    try {
      const response = await this.#fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: controller.signal, headers: { Authorization: `Bearer ${this.#apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(request) });
      if (response.redirected) throw new EmailDeliveryError('EMAIL_PROVIDER_REDIRECT', { retryable: true, uncertain: true });
      if (!response.ok) throw new EmailDeliveryError(response.status === 409 ? 'EMAIL_IDEMPOTENCY_CONFLICT' : 'EMAIL_PROVIDER_REJECTED', { retryable: response.status === 429 || response.status >= 500 });
      let result; try { result = await response.json(); } catch { throw new EmailDeliveryError('EMAIL_RESULT_UNKNOWN', { retryable: true, uncertain: true }); }
      if (typeof result?.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.id)) throw new EmailDeliveryError('EMAIL_RESULT_UNKNOWN', { retryable: true, uncertain: true });
      return { provider: 'resend', messageId: result.id, deliveryStatus: 'accepted' };
    } catch (error) {
      if (error instanceof EmailDeliveryError) throw error;
      throw new EmailDeliveryError(controller.signal.aborted ? 'EMAIL_TIMEOUT' : 'EMAIL_NETWORK_ERROR', { retryable: true, uncertain: true });
    } finally { clearTimeout(timer); }
  }
}

export function createResendDeliveryAdapter(env = process.env, dependencies = {}) {
  return new ResendDeliveryAdapter({ apiKey: env.RESEND_API_KEY, from: env.ACADEMY_EMAIL_FROM, enabled: env.ACADEMY_EMAIL_DELIVERY_ENABLED === '1', senderVerified: env.ACADEMY_EMAIL_SENDER_VERIFIED === '1', approvedKinds: String(env.ACADEMY_EMAIL_APPROVED_KINDS ?? '').split(',').map(kind => kind.trim()).filter(Boolean), ...dependencies });
}
