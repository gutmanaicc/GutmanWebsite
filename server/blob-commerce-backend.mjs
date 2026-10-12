import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { MAX_SNAPSHOT_BYTES, DurableCommerceError } from './durable-commerce.mjs';

/** Private, encrypted, strongly consistent snapshot; conditional writes protect ALL commerce state. */
export class BlobCommerceBackend {
  constructor({ pathname, encryptionSecret, blobGet = get, blobPut = put } = {}) {
    if (typeof pathname !== 'string' || !/^academy\/[a-z0-9_-]+\/commerce-v1\.json$/.test(pathname)) throw new Error('A separate canonical academy storage namespace is required.');
    if (typeof encryptionSecret !== 'string' || encryptionSecret.length < 32) throw new Error('A stable server-only storage encryption secret is required.');
    this.pathname = pathname;
    this.key = createHash('sha256').update(encryptionSecret).digest();
    this.blobGet = blobGet;
    this.blobPut = blobPut;
  }
  encode(snapshot) {
    const plain = Buffer.from(JSON.stringify(snapshot));
    if (plain.length > MAX_SNAPSHOT_BYTES) throw new DurableCommerceError('STATE_TOO_LARGE', 'Commerce storage capacity requires review.');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(this.pathname));
    const body = Buffer.concat([cipher.update(plain), cipher.final()]);
    return JSON.stringify({ version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), body: body.toString('base64') });
  }
  decode(text) {
    try {
      const value = JSON.parse(text);
      if (value.version !== 1 || !['iv', 'tag', 'body'].every(k => typeof value[k] === 'string') || Object.keys(value).length !== 4) throw new Error();
      const iv = Buffer.from(value.iv, 'base64');
      const tag = Buffer.from(value.tag, 'base64');
      if (iv.length !== 12 || tag.length !== 16) throw new Error();
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAAD(Buffer.from(this.pathname));
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(Buffer.from(value.body, 'base64')), decipher.final()]);
      if (plain.length > MAX_SNAPSHOT_BYTES) throw new Error();
      return JSON.parse(plain.toString('utf8'));
    } catch { throw new DurableCommerceError('STORAGE_DECRYPTION_FAILED', 'Stored commerce state cannot be authenticated; it has not been overwritten.'); }
  }
  async read() {
    const result = await this.blobGet(this.pathname, { access: 'private', useCache: false });
    if (result === null) return null;
    if (result.statusCode !== 200 || !result.stream || !result.blob?.etag) throw new DurableCommerceError('STORAGE_UNAVAILABLE', 'A fresh version of commerce state is required.');
    const reader = result.stream.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_SNAPSHOT_BYTES * 1.4 + 2048) { await reader.cancel(); throw new DurableCommerceError('STATE_TOO_LARGE', 'Commerce storage capacity requires review.'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    return { snapshot: this.decode(Buffer.concat(chunks).toString('utf8')), etag: result.blob.etag };
  }
  async write(snapshot, { etag }) {
    try {
      return await this.blobPut(this.pathname, this.encode(snapshot), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json',
        ...(etag === null ? { allowOverwrite: false } : { allowOverwrite: true, ifMatch: etag }),
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new DurableCommerceError('PRECONDITION_FAILED', 'Commerce state changed; recompute the operation.');
      // Some SDK/API versions report create-if-absent collisions as a generic Blob error.
      // Verify current existence without interpreting/logging provider diagnostic strings.
      if (etag === null) { const current = await this.read(); if (current !== null) throw new DurableCommerceError('ALREADY_EXISTS', 'Commerce state has already been initialized.'); }
      throw new DurableCommerceError('STORAGE_UNAVAILABLE', 'Commerce state could not be saved.');
    }
  }
}
