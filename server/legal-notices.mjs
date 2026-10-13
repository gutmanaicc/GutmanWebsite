import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { CommerceError } from './commerce.mjs';

export const NOTICE_TYPES = Object.freeze(['cancellation', 'privacy_access', 'privacy_correction', 'privacy_erasure', 'marketing_withdrawal']);
const text = (value, max, required = false) => {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) || (required && !value.trim())) throw new CommerceError('INVALID_NOTICE', 'יש לבדוק את פרטי ההודעה.');
  return value.trim();
};
function normalize(input) {
  if (!input || typeof input !== 'object' || !NOTICE_TYPES.includes(input.type) || input.website) throw new CommerceError('INVALID_NOTICE', 'יש לבדוק את פרטי ההודעה.');
  const data = { type: input.type, fullName: text(input.fullName, 100, true), email: text(input.email, 254).toLowerCase(), phone: text(input.phone, 25), orderId: text(input.orderId, 100), identityNumber: text(input.identityNumber, 30), message: text(input.message, 2000) };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new CommerceError('INVALID_NOTICE', 'יש לבדוק את כתובת האימייל.');
  if (data.phone && !/^[+0-9 ()-]{5,25}$/.test(data.phone)) throw new CommerceError('INVALID_NOTICE', 'יש לבדוק את מספר הטלפון.');
  // Missing contact, order, identity or reason does not lose a notice's time.
  return data;
}

/** Encrypted private inbox. A receipt confirms delivery, never a refund,
 * sender verification, eligibility or an automatic change to a paid order.
 */
export class LegalNoticeInbox {
  #key;
  constructor({ path, secret, clock = Date.now } = {}) {
    if (!isAbsolute(path || '') || path === ':memory:' || typeof secret !== 'string' || secret.length < 32) throw Error('An explicit private legal inbox and server secret are required.');
    this.clock = clock; this.#key = scryptSync(secret, 'gutman-legal-inbox-v1', 32);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path); chmodSync(path, 0o600);
    this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS inbox_meta (id INTEGER PRIMARY KEY, key_digest TEXT NOT NULL); CREATE TABLE IF NOT EXISTS notices (id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, received_at TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL);');
    const digest = createHash('sha256').update(this.#key).digest('hex');
    const existing = this.db.prepare('SELECT key_digest FROM inbox_meta WHERE id=1').get();
    if (existing && existing.key_digest !== digest) { this.db.close(); throw Error('The legal inbox key changed; existing notices were not overwritten.'); }
    this.db.prepare('INSERT OR IGNORE INTO inbox_meta VALUES(1,?)').run(digest);
  }
  get ready() { return true; }
  close() { this.db.close(); }
  #encrypt(data, row) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.#key, iv);
    cipher.setAAD(Buffer.from(JSON.stringify([row.id, row.request_hash, row.received_at])));
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    return JSON.stringify({ iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), body: encrypted.toString('base64') });
  }
  #decrypt(value, row) {
    try {
      const data = JSON.parse(value), decipher = createDecipheriv('aes-256-gcm', this.#key, Buffer.from(data.iv, 'base64'));
      decipher.setAAD(Buffer.from(JSON.stringify([row.id, row.request_hash, row.received_at])));
      decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.body, 'base64')), decipher.final()]).toString('utf8'));
    } catch { throw Error('Stored legal notice authentication failed.'); }
  }
  receive(input, key = randomUUID()) {
    const data = normalize(input);
    if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) throw new CommerceError('INVALID_NOTICE_KEY', 'יש לשלוח את ההודעה שוב מתוך הטופס.');
    const hash = createHmac('sha256', this.#key).update(JSON.stringify(data)).digest('hex');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      let row = this.db.prepare('SELECT id,request_hash,received_at,payload FROM notices WHERE request_key=?').get(key);
      if (row && row.request_hash !== hash) throw new CommerceError('NOTICE_CONFLICT', 'פרטי ההודעה השתנו. אפשר לפתוח הודעה נוספת.', 409);
      if (row) this.#decrypt(row.payload, row);
      if (!row) {
        row = { id: randomUUID(), request_hash: hash, received_at: new Date(this.clock()).toISOString() };
        this.db.prepare('INSERT INTO notices VALUES(?,?,?,?,?,?)').run(row.id, key, hash, row.received_at, 'received', this.#encrypt(data, row));
      }
      this.db.exec('COMMIT');
      return { received: true, noticeId: row.id, receivedAt: row.received_at, type: data.type, refundExecuted: false };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  list() {
    return this.db.prepare('SELECT * FROM notices ORDER BY received_at DESC LIMIT 200').all().map(row => {
      const { identityNumber, ...data } = this.#decrypt(row.payload, row);
      return { id: row.id, receivedAt: row.received_at, status: row.status, ...data, identityProvided: !!identityNumber };
    });
  }
  setStatus(id, status) {
    if (!['received', 'processing', 'closed'].includes(status)) throw new CommerceError('INVALID_NOTICE_STATUS', 'מצב הפנייה אינו תקין.');
    const result = this.db.prepare('UPDATE notices SET status=? WHERE id=?').run(status, id);
    if (result.changes !== 1) throw new CommerceError('NOT_FOUND', 'הפנייה לא נמצאה.', 404);
    return { id, status, refundExecuted: false };
  }
}
