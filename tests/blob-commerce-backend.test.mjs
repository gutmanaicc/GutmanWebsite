import test from 'node:test';
import assert from 'node:assert/strict';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { BlobCommerceBackend } from '../server/blob-commerce-backend.mjs';

const pathname = 'academy/preview/commerce-v1.json';
const encryptionSecret = 'private-encryption-test-secret-at-least-32-characters';
function storage() {
  let record = null;
  let revision = 0;
  const calls = [];
  const blobGet = async (path, options) => {
    calls.push({ operation: 'read', path, options });
    if (!record) return null;
    return { statusCode: 200, blob: { etag: record.etag }, stream: new ReadableStream({ start(controller) { controller.enqueue(Buffer.from(record.text)); controller.close(); } }) };
  };
  const blobPut = async (path, text, options) => {
    calls.push({ operation: 'write', path, options });
    if (record && (!options.allowOverwrite || options.ifMatch !== record.etag)) throw new BlobPreconditionFailedError();
    record = { text, etag: `etag-${++revision}` };
    return { etag: record.etag };
  };
  return { blobGet, blobPut, calls, get record() { return record; } };
}

test('private encrypted snapshots survive restart and stale CAS updates cannot overwrite customer state', async () => {
  const disk = storage();
  const backend = new BlobCommerceBackend({ pathname, encryptionSecret, ...disk });
  assert.equal(await backend.read(), null);
  const snapshot = { participant: 'private@example.test', nested: { seats: 12 } };
  await backend.write(snapshot, { etag: null });
  assert.ok(!disk.record.text.includes(snapshot.participant));
  const restart = new BlobCommerceBackend({ pathname, encryptionSecret, ...disk });
  const initial = await restart.read();
  assert.deepEqual(initial.snapshot, snapshot);
  await backend.write({ ...snapshot, nested: { seats: 11 } }, { etag: initial.etag });
  await assert.rejects(restart.write({ nested: { seats: 0 } }, { etag: initial.etag }), { code: 'PRECONDITION_FAILED' });
  await assert.rejects(restart.write(snapshot, { etag: null }), { code: 'PRECONDITION_FAILED' });
  assert.equal((await restart.read()).snapshot.nested.seats, 11);
  for (const call of disk.calls) {
    assert.equal(call.options.access, 'private');
    if (call.operation === 'read') assert.equal(call.options.useCache, false);
    else assert.equal(call.options.addRandomSuffix, false);
  }
});

test('authenticated encryption rejects a wrong key, modified ciphertext and a different storage namespace', () => {
  const backend = new BlobCommerceBackend({ pathname, encryptionSecret });
  const encoded = backend.encode({ customer: 'private@example.test' });
  const wrongKey = new BlobCommerceBackend({ pathname, encryptionSecret: encryptionSecret + 'different' });
  const wrongNamespace = new BlobCommerceBackend({ pathname: 'academy/production/commerce-v1.json', encryptionSecret });
  for (const other of [wrongKey, wrongNamespace]) assert.throws(() => other.decode(encoded), { code: 'STORAGE_DECRYPTION_FAILED' });
  const corrupted = JSON.parse(encoded);
  const bytes = Buffer.from(corrupted.body, 'base64'); bytes[0] ^= 1; corrupted.body = bytes.toString('base64');
  assert.throws(() => backend.decode(JSON.stringify(corrupted)), { code: 'STORAGE_DECRYPTION_FAILED' });
});
