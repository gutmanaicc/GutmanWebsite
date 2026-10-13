import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { CommerceError, seminarIds } from './commerce.mjs';

const fail = (code, message, status = 400) => { throw new CommerceError(code, message, status); };
const text = (value, max, required = false) => {
  if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) || (required && !value.trim())) fail('INVALID_LEAD', 'יש לבדוק את פרטי הפנייה.');
  return value.trim();
};
export function normalizeAcademyLead(input) {
  const fullName = text(input.fullName, 100, true).replace(/\s+/g, ' ');
  const email = text(input.email, 254, true).toLowerCase();
  const phone = text(input.phone, 25, true);
  if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+0-9 ()-]{8,25}$/.test(phone) || phone.replace(/\D/g, '').length < 8 || !seminarIds.includes(input.seminarId)) fail('INVALID_LEAD', 'יש לבדוק את השם, האימייל, הטלפון והסמינר.');
  if (input.website) fail('INVALID_LEAD', 'לא ניתן לשלוח את הפנייה.');
  if (input.marketingConsent !== undefined && typeof input.marketingConsent !== 'boolean') fail('INVALID_LEAD', 'יש לבדוק את אישור העדכונים.');
  const requestedDate = input.requestedDate === undefined ? '' : text(input.requestedDate, 10);
  if (requestedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || !Number.isFinite(Date.parse(requestedDate)) || new Date(requestedDate).toISOString().slice(0, 10) !== requestedDate)) fail('INVALID_LEAD', 'המועד המבוקש אינו תקין.');
  return { fullName, email, phone, seminarId: input.seminarId, requestedDate, note: input.note === undefined ? '' : text(input.note, 1000), marketingConsent: input.marketingConsent === true };
}

function contactProperties(lead, stage = 'new') {
  const [firstname, ...rest] = lead.fullName.split(' ');
  return { firstname, lastname: rest.join(' '), email: lead.email, phone: lead.phone, gutman_seminar: lead.seminarId, gutman_requested_date: lead.requestedDate, gutman_lead_stage: stage, gutman_lead_source: 'website', gutman_marketing_consent: lead.marketingConsent ? 'yes' : 'no', gutman_note: lead.note };
}

/** Server-only Make relay. Its responder runs after HubSpot saves the contact. */
export class HubSpotWebhookAdapter {
  constructor({ webhookUrl, portalId, stage = 'new', fetchImpl = globalThis.fetch, timeoutMs = 15000 } = {}) {
    const url = new URL(webhookUrl);
    if (url.protocol !== 'https:' || !/^hook\.(us[12]|eu[12])\.make\.com$/.test(url.hostname) || url.port || url.username || url.password || url.search || url.hash || !/^\/[a-z0-9]{16,128}$/.test(url.pathname)) throw new Error('A private Make HTTPS webhook is required.');
    if (!/^\d{1,15}$/.test(portalId || '') || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('A verified HubSpot portal and bounded timeout are required.');
    if (!['new', 'registered'].includes(stage)) throw new Error('An explicit server-controlled CRM stage is required.');
    this.url = url.href; this.portalId = portalId; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.stage = stage;
  }
  async submit(lead, createdAt, leadId) {
    if (!/^[0-9a-f-]{36}$/i.test(leadId || '')) throw new Error('A persistent enquiry reference is required.');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(this.url, { method: 'POST', redirect: 'error', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, submittedAt: createdAt, ...contactProperties(lead, this.stage) }) });
      if (response.redirected) throw new Error('Uncertain relay response');
      if (!response.ok) { const error = new Error('Relay rejected submission'); error.knownFailure = [400, 401, 403, 404, 413, 429].includes(response.status); throw error; }
      const result = await response.json();
      if (result?.received !== true || result.leadId !== leadId || String(result.portalId) !== this.portalId || !/^[1-9]\d{0,24}$/.test(String(result.contactId ?? ''))) throw new Error('Unconfirmed CRM save');
    } finally { clearTimeout(timer); }
  }
}

/** Public HubSpot form submission, not access to the CRM API or its OAuth token. */
export class HubSpotFormAdapter {
  constructor({ portalId, formId, publicOrigin, fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) {
    if (!/^\d{1,15}$/.test(portalId || '') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId || '')) throw new Error('Verified HubSpot portal and form IDs are required.');
    const origin = new URL(publicOrigin);
    if (origin.protocol !== 'https:' || origin.origin !== publicOrigin || origin.username || origin.password) throw new Error('An exact HTTPS website origin is required.');
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('A bounded provider timeout is required.');
    this.url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
    this.publicOrigin = publicOrigin; this.fetch = fetchImpl; this.timeoutMs = timeoutMs;
  }
  async submit(lead, createdAt) {
    const values = contactProperties(lead);
    const payload = { fields: Object.entries(values).map(([name, value]) => ({ objectTypeId: '0-1', name, value })), submittedAt: String(Date.parse(createdAt)), context: { pageUri: `${this.publicOrigin}/courses/${lead.seminarId}`, pageName: 'פנייה למכללת גוטמן' } };
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(this.url, { method: 'POST', redirect: 'error', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.redirected) throw new Error('Uncertain provider response');
      if (!response.ok) { const error = new Error('Provider rejected submission'); error.knownFailure = [400, 401, 403, 404, 413, 429].includes(response.status); throw error; }
      const result = await response.json();
      if (!result || (typeof result.inlineMessage !== 'string' && typeof result.redirectUri !== 'string')) throw new Error('Uncertain provider response');
    } finally { clearTimeout(timer); }
  }
}

export class AcademyLeadIntake {
  constructor({ path, adapter, clock = Date.now }) {
    if (!isAbsolute(path) || path === ':memory:') throw new Error('Lead storage must use an explicit persistent path.');
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path); chmodSync(path, 0o600); this.adapter = adapter; this.clock = clock;
    this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, state TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)');
    // A process may have stopped after the provider accepted the request. Do not replay it.
    this.db.prepare("UPDATE leads SET state='unknown' WHERE state IN ('sending','claimed')").run();
  }
  get ready() { return typeof this.adapter?.submit === 'function'; }
  close() { this.db.close(); }
  async submit(input, key) {
    if (!this.ready) fail('LEADS_UNAVAILABLE', 'קליטת הפניות אינה זמינה כרגע.', 503);
    if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) fail('INVALID_LEAD_KEY', 'יש לשלוח את הפנייה שוב מתוך הטופס.');
    const data = normalizeAcademyLead(input);
    const digest = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const now = new Date(this.clock()).toISOString(); let row;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      row = this.db.prepare('SELECT id, request_hash, state, data, created_at FROM leads WHERE request_key=?').get(key);
      if (row && row.request_hash !== digest) fail('LEAD_CONFLICT', 'פרטי הפנייה השתנו. יש לשלוח שוב מתוך הטופס.', 409);
      if (!row) { row = { id: randomUUID(), request_hash: digest, state: 'sending', data: JSON.stringify(data), created_at: now }; this.db.prepare('INSERT INTO leads VALUES(?,?,?,?,?,?,?)').run(row.id, key, digest, row.state, row.data, now, now); }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    if (row.state === 'accepted') return { ok: true, received: true, leadId: row.id };
    // Existing pending/unknown/failed rows never trigger another provider call.
    const claim = this.db.prepare("UPDATE leads SET state='claimed' WHERE id=? AND state='sending'").run(row.id);
    if (claim.changes !== 1) fail('LEAD_PENDING', 'לא הצלחנו לאשר שהפנייה נקלטה. אפשר ליצור קשר באימייל.', 503);
    try { await this.adapter.submit(data, row.created_at, row.id); }
    catch (error) { this.db.prepare('UPDATE leads SET state=?,updated_at=? WHERE id=?').run(error?.knownFailure ? 'failed' : 'unknown', new Date(this.clock()).toISOString(), row.id); fail('LEAD_UNCONFIRMED', 'לא הצלחנו לאשר שהפנייה נקלטה. אפשר ליצור קשר באימייל.', 503); }
    this.db.prepare("UPDATE leads SET state='accepted',updated_at=? WHERE id=?").run(new Date(this.clock()).toISOString(), row.id);
    return { ok: true, received: true, leadId: row.id };
  }
}
