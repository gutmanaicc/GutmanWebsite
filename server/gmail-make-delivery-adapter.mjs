import { createHash } from 'node:crypto';
import { EmailDeliveryError } from './resend-delivery-adapter.mjs';

const kinds = new Set(['preparation', 'reminder']);
const email = value => typeof value === 'string' && value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(value) && !/[\r\n,;]/.test(value);
const encodeHeader = value => {
  const chunks = []; let part = '';
  for (const char of value) { if (Buffer.byteLength(part + char) > 39) { chunks.push(part); part = ''; } part += char; }
  if (part) chunks.push(part);
  return chunks.map(part => `=?UTF-8?B?${Buffer.from(part).toString('base64')}?=`).join('\r\n ');
};
const content64 = value => Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
const fail = code => { throw new EmailDeliveryError(code); };
export function buildGmailMime(request, key) {
  const to = Array.isArray(request?.to) && request.to.length === 1 ? request.to[0] : null;
  if (!email(request?.from) || !email(to) || typeof request.subject !== 'string' || !request.subject.trim() || /[\r\n]/.test(request.subject) || typeof request.text !== 'string' || !request.text.trim() || typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,200}$/.test(key)) fail('INVALID_EMAIL_REQUEST');
  const boundary = `gutman_${createHash('sha256').update(key).digest('hex').slice(0,32)}`;
  const alternative = boundary + '_alt';
  const headers = [`From: ${encodeHeader('מכללת גוטמן')} <${request.from}>`, `To: <${to}>`, `Reply-To: <gutmanaicc@gmail.com>`, `Subject: ${encodeHeader(request.subject)}`, `Message-ID: <${key}@gutmanai.com>`, `Date: ${new Date(request.preparedAt ?? Date.now()).toUTCString()}`, 'MIME-Version: 1.0'];
  const attachmentList = request.attachments ?? [];
  if (!Array.isArray(attachmentList) || attachmentList.length > 1 || attachmentList.some(a => a.filename !== 'gutman-order.html' || a.contentType !== 'text/html; charset=utf-8' || typeof a.content !== 'string' || Buffer.byteLength(a.content) > 100000)) fail('INVALID_EMAIL_REQUEST');
  const parts = [headers.join('\r\n'), `Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`, `Content-Type: multipart/alternative; boundary="${alternative}"`, '', `--${alternative}`, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', content64(request.text)];
  if (request.html) {
    if (typeof request.html !== 'string' || Buffer.byteLength(request.html) > 100000) fail('INVALID_EMAIL_REQUEST');
    parts.push(`--${alternative}`, 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64', '', content64(request.html));
  }
  parts.push(`--${alternative}--`);
  for (const a of attachmentList) parts.push(`--${boundary}`, `Content-Type: ${a.contentType}`, 'Content-Disposition: attachment; filename="gutman-order.html"', 'Content-Transfer-Encoding: base64', '', content64(a.content));
  parts.push(`--${boundary}--`, '');
  return Buffer.from(parts.join('\r\n')).toString('base64url');
}
/** Gmail has no provider idempotency contract. Persist one attempt, then
 * stop uncertain deliveries for review; never replay after timeout or crash.
 */
export class GmailMakeDeliveryAdapter {
  #url; #sender; #enabled; #verified; #fetch; #timeout;
  supportsIdempotentReplay = false;
  constructor({ webhookUrl, sender, enabled = false, senderVerified = false, fetchImpl = globalThis.fetch, timeoutMs = 30000 } = {}) {
    try { const u = new URL(webhookUrl); if (u.protocol === 'https:' && /^hook\.(?:eu\d|us\d)\.make\.com$/.test(u.hostname) && !u.username && !u.password && !u.search && !u.hash && !u.port && /^\/[A-Za-z0-9]{20,100}$/.test(u.pathname)) this.#url = u.href; } catch { /* fail closed */ }
    this.#sender = sender; this.#enabled = enabled === true; this.#verified = senderVerified === true; this.#fetch = fetchImpl; this.#timeout = timeoutMs;
  }
  get ready() { return Boolean(this.#url && email(this.#sender) && this.#enabled && this.#verified); }
  getReadiness() { return { provider: 'gmail-make', enabled: this.#enabled, configured: !!this.#url && email(this.#sender), senderVerified: this.#verified, approvedKinds: ['preparation','reminder'], idempotentReplay: false, ready: this.ready }; }
  canDeliver(kind) { return this.ready && kinds.has(kind); }
  prepare(payload, { kind } = {}) {
    if (!this.canDeliver(kind)) fail('EMAIL_DELIVERY_DISABLED');
    if (!payload || payload.simulation !== false || !email(payload.to) || typeof payload.subject !== 'string' || /[\r\n]/.test(payload.subject) || typeof payload.text !== 'string' || !payload.text.trim()) fail('INVALID_EMAIL_REQUEST');
    return { from: this.#sender, to: [payload.to], preparedAt: new Date().toISOString(), subject: payload.subject, text: payload.text, ...(payload.html ? { html: payload.html } : {}), ...(payload.attachments ? { attachments: structuredClone(payload.attachments) } : {}) };
  }
  async sendRequest(request, { idempotencyKey, kind } = {}) {
    if (!this.canDeliver(kind)) fail('EMAIL_DELIVERY_DISABLED');
    if (request?.from !== this.#sender) fail('EMAIL_SENDER_CHANGED');
    const rawMessage = buildGmailMime(request, idempotencyKey);
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.#timeout);
    try {
      const response = await this.#fetch(this.#url, { method: 'POST', redirect: 'error', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ protocol: 'gutman-service-v1', deliveryKey: idempotencyKey, kind, to: request.to[0], sender: this.#sender, rawMessage }) });
      if (!response.ok || response.redirected) fail('EMAIL_RELAY_REJECTED');
      let result; try { result = await response.json(); } catch { fail('EMAIL_RESULT_UNKNOWN'); }
      if (result?.accepted !== true || result.deliveryKey !== idempotencyKey || result.to !== request.to[0] || result.sender !== this.#sender || !/^[a-f0-9]{10,32}$/.test(result.messageId ?? '')) fail('EMAIL_RESULT_UNKNOWN');
      return { provider: 'gmail-make', messageId: result.messageId, deliveryStatus: 'accepted' };
    } catch (error) { if (error instanceof EmailDeliveryError) throw error; fail(controller.signal.aborted ? 'EMAIL_TIMEOUT' : 'EMAIL_NETWORK_ERROR'); }
    finally { clearTimeout(timer); }
  }
}
