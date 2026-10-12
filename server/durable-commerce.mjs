import { CommerceStore, config, seminarIds, statuses } from './commerce.mjs';

/** PRIVATE persistence format. Never return it through public APIs or put it in a public Blob.
 * No tables or SQL identifiers come from callers. Schema changes require a versioned migration.
 */
export const SNAPSHOT_VERSION = 1;
export const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024;
export const MAX_SNAPSHOT_ROWS = 10_000;
const TABLES = Object.freeze({
  dates: ['id', 'data'],
  coupons: ['id', 'code', 'data'],
  orders: ['id', 'idempotency_key', 'request_hash', 'access_hash', 'data'],
  payment_events: ['id', 'fingerprint', 'transaction_id', 'data'],
  registrations: ['id', 'order_id', 'data'],
  outbox: ['id', 'dedupe_key', 'data'],
  audit_events: ['id', 'data'],
});
const CAS_CONFLICTS = new Set(['PRECONDITION_FAILED', 'ALREADY_EXISTS']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finiteTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const amount = value => Number.isSafeInteger(value) && value >= 0;
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 512 && !/[\x00-\x1f]/.test(value);
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export class DurableCommerceError extends Error {
  constructor(code, message) { super(message); this.name = 'DurableCommerceError'; this.code = code; this.status = 503; }
}
const invalid = () => { throw new DurableCommerceError('INVALID_SNAPSHOT', 'Stored commerce state is invalid; it has not been overwritten.'); };
function snapshotBytes(snapshot) {
  let json;
  try { json = JSON.stringify(snapshot); } catch { invalid(); }
  if (typeof json !== 'string' || Buffer.byteLength(json) > MAX_SNAPSHOT_BYTES) invalid();
  return json;
}

/** Validate before opening/importing SQLite, including identifiers, money and references.
 * Error messages intentionally omit stored rows, keys, tokens and participant information.
 */
export function validateSnapshot(snapshot) {
  snapshotBytes(snapshot);
  if (!exactKeys(snapshot, ['version', 'tables']) || snapshot.version !== SNAPSHOT_VERSION || !exactKeys(snapshot.tables, Object.keys(TABLES))) invalid();
  let count = 0;
  const records = {};
  for (const [table, columns] of Object.entries(TABLES)) {
    const rows = snapshot.tables[table];
    if (!Array.isArray(rows) || (count += rows.length) > MAX_SNAPSHOT_ROWS) invalid();
    records[table] = new Map();
    for (const row of rows) {
      if (!exactKeys(row, columns) || !identifier(row.id) || records[table].has(row.id) || typeof row.data !== 'string') invalid();
      for (const column of columns) {
        if (column === 'data') continue;
        if (column === 'transaction_id' && row[column] === null) continue;
        if (!identifier(row[column])) invalid();
        if (['request_hash', 'access_hash', 'fingerprint'].includes(column) && !/^[a-f0-9]{64}$/.test(row[column])) invalid();
      }
      let data;
      try { data = JSON.parse(row.data); } catch { invalid(); }
      if (!object(data) || data.id !== row.id) invalid();
      records[table].set(row.id, { row, data });
    }
  }
  const exists = (table, id) => identifier(id) && records[table].has(id);
  for (const { data } of records.dates.values()) {
    if (!seminarIds.includes(data.seminarId) || typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !finiteTime(`${data.date}T12:00:00Z`) || new Date(`${data.date}T12:00:00Z`).toISOString().slice(0,10) !== data.date || !identifier(data.venue) || !Number.isInteger(data.capacity) || data.capacity < config.minimumParticipants || data.capacity > config.maximumParticipants || data.minimumParticipants !== config.minimumParticipants || data.startTime !== config.startTime || data.endTime !== config.endTime || data.timezone !== config.timezone || !statuses.includes(data.status) || !['pending','approved','rejected'].includes(data.approvalStatus) || typeof data.published !== 'boolean' || (data.published && data.approvalStatus !== 'approved')) invalid();
  }
  for (const { row, data } of records.coupons.values()) {
    if (row.code !== data.code || !/^[A-Z0-9_-]{3,40}$/.test(data.code) || !['percentage','fixed'].includes(data.type) || !Number.isSafeInteger(data.value) || data.value < 1 || (data.type === 'percentage' && data.value > 100) || !Number.isSafeInteger(data.maxRedemptions) || data.maxRedemptions < 1 || (data.perCustomerLimit !== null && (!Number.isSafeInteger(data.perCustomerLimit) || data.perCustomerLimit < 1)) || typeof data.active !== 'boolean' || !Array.isArray(data.seminarIds) || data.seminarIds.some(id => !seminarIds.includes(id)) || !Array.isArray(data.dateIds) || data.dateIds.some(id => !exists('dates', id)) || (data.startsAt !== null && !finiteTime(data.startsAt)) || (data.expiresAt !== null && !finiteTime(data.expiresAt))) invalid();
  }
  for (const { data } of records.orders.values()) {
    if (!exists('dates', data.dateId) || !['pending','paid','failed','expired','refund_required','refunded'].includes(data.status) || !object(data.customer) || !identifier(data.customer.name) || !identifier(data.customer.email) || !identifier(data.customer.phone) || ![data.subtotalAgorot,data.discountAgorot,data.totalAgorot].every(amount) || data.totalAgorot !== data.subtotalAgorot - data.discountAgorot || data.currency !== config.currency || !finiteTime(data.createdAt) || !finiteTime(data.holdExpiresAt) || (data.couponId !== null && !exists('coupons', data.couponId)) || typeof data.simulation !== 'boolean' || (data.provider !== undefined && !['simulation','morning'].includes(data.provider))) invalid();
  }
  for (const { row, data } of records.payment_events.values()) {
    if (!exists('orders', data.orderId) || !['succeeded','failed'].includes(data.type) || !identifier(data.transactionId) || (row.transaction_id !== null && row.transaction_id !== data.transactionId) || !amount(data.amountAgorot) || data.currency !== config.currency) invalid();
  }
  for (const { row, data } of records.registrations.values()) {
    if (row.order_id !== data.orderId || !exists('orders', data.orderId) || !exists('dates', data.dateId) || !seminarIds.includes(data.seminarId) || !['confirmed','cancelled'].includes(data.status) || !amount(data.totalAgorot)) invalid();
    const order = records.orders.get(data.orderId).data;
    if (order.dateId !== data.dateId || order.totalAgorot !== data.totalAgorot) invalid();
  }
  for (const { data } of records.outbox.values()) {
    if (!exists('orders', data.orderId) || !identifier(data.kind) || !['pending','processing','sent','failed','cancelled'].includes(data.status) || !Number.isSafeInteger(data.attempts) || data.attempts < 0 || !object(data.payload) || (data.nextAttemptAt !== null && !finiteTime(data.nextAttemptAt)) || !finiteTime(data.createdAt)) invalid();
  }
  for (const { data } of records.audit_events.values()) {
    if (!identifier(data.action) || !identifier(data.entityId) || !identifier(data.actor) || !object(data.detail) || !finiteTime(data.createdAt)) invalid();
  }
  return snapshot;
}

export function exportSnapshot(store) {
  const tables = {};
  for (const [table, columns] of Object.entries(TABLES)) {
    tables[table] = store.db.prepare(`SELECT ${columns.join(',')} FROM ${table} ORDER BY id`).all().map(row => ({ ...row }));
  }
  return validateSnapshot({ version: SNAPSHOT_VERSION, tables });
}

export function importSnapshot(store, snapshot) {
  validateSnapshot(snapshot);
  try {
    store.transaction(() => {
      // Each store is new and empty. Reject accidental imports into live local state.
      if (Object.keys(TABLES).some(table => store.db.prepare(`SELECT id FROM ${table} LIMIT 1`).get())) invalid();
      for (const [table, columns] of Object.entries(TABLES)) {
        const insert = store.db.prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`);
        for (const row of snapshot.tables[table]) insert.run(...columns.map(column => row[column]));
      }
    });
  } catch (error) {
    if (error instanceof DurableCommerceError) throw error;
    // Duplicate unique keys and SQLite constraint failures are malformed state, never a reset trigger.
    invalid();
  }
}

function invokeSync(fn, store) {
  if (typeof fn !== 'function' || ['[object AsyncFunction]','[object AsyncGeneratorFunction]'].includes(Object.prototype.toString.call(fn))) throw new DurableCommerceError('SYNC_OPERATION_REQUIRED', 'Commerce operations must be synchronous and contain no external side effects.');
  const result = fn(store);
  if (result && typeof result.then === 'function') {
    // Consume a rejected Promise to avoid an unhandled rejection; never await or persist it.
    Promise.resolve(result).catch(() => {});
    throw new DurableCommerceError('SYNC_OPERATION_REQUIRED', 'Commerce operations must not return Promises.');
  }
  try { return structuredClone(result); }
  catch { throw new DurableCommerceError('INVALID_OPERATION_RESULT', 'Commerce operations must return cloneable data, not store handles or functions.'); }
}

/** One PRIVATE snapshot, optimistic compare-and-swap, no in-process lock assumption.
 * backend.read MUST be a fresh private/useCache:false read, never a CDN cached read.
 * backend.write MUST atomically enforce exact ETag, or create-if-absent for etag:null.
 * A callback can execute up to maxAttempts times. Only synchronous state changes are safe.
 * NEVER create provider links, charge/refund, send messages, call a network API, or launch tasks in it.
 * Commit a claim with run first, perform the external action outside, then commit its result separately.
 * Public callers must return public projections such as store.orderResult; this private snapshot contains PII.
 */
export class DurableCommerceRepository {
  constructor({ backend, storeOptions = {}, clock = Date.now, maxAttempts = 20, seedDrafts = true } = {}) {
    if (!backend || typeof backend.read !== 'function' || typeof backend.write !== 'function') throw new Error('A fresh-read, atomic-CAS backend is required.');
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new Error('maxAttempts must be between 1 and 20.');
    if (typeof clock !== 'function') throw new Error('clock must be a function.');
    this.backend = backend;
    this.storeOptions = { ...storeOptions };
    this.clock = clock;
    this.maxAttempts = maxAttempts;
    this.seedDrafts = seedDrafts;
  }
  async loadStore() {
    const record = await this.backend.read();
    if (record !== null && (!exactKeys(record, ['snapshot','etag']) || !identifier(record.etag))) throw new DurableCommerceError('INVALID_BACKEND_RESPONSE', 'The persistence backend returned an invalid snapshot response.');
    if (record !== null) validateSnapshot(record.snapshot);
    const store = new CommerceStore({ ...this.storeOptions, path: ':memory:', clock: this.clock });
    try {
      if (record !== null) importSnapshot(store, record.snapshot);
      else if (this.seedDrafts) store.seedDrafts();
      return { store, record };
    } catch (error) { store.close(); throw error; }
  }
  async read(fn) {
    const { store } = await this.loadStore();
    try { return invokeSync(fn, store); }
    finally { store.close(); }
  }
  async run(fn) {
    // Reject declared async callbacks before reading or invoking them at all.
    if (typeof fn !== 'function' || ['[object AsyncFunction]','[object AsyncGeneratorFunction]'].includes(Object.prototype.toString.call(fn))) throw new DurableCommerceError('SYNC_OPERATION_REQUIRED', 'Commerce operations must be synchronous and contain no external side effects.');
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const { store, record } = await this.loadStore();
      try {
        const before = JSON.stringify(exportSnapshot(store));
        const result = invokeSync(fn, store);
        const snapshot = exportSnapshot(store);
        if (record !== null && before === JSON.stringify(snapshot)) return result;
        try { await this.backend.write(snapshot, { etag: record?.etag ?? null }); }
        catch (error) {
          if (CAS_CONFLICTS.has(error?.code)) continue;
          throw error;
        }
        return result;
      } finally { store.close(); }
    }
    throw new DurableCommerceError('CAS_RETRY_EXHAUSTED', 'Commerce is busy; no uncommitted result was returned. Retry with the same idempotency key.');
  }
}
