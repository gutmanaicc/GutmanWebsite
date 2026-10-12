import { createHmac, timingSafeEqual } from 'node:crypto';

export class ProviderUnavailable extends Error {
  constructor() { super('Morning/Grow is not configured or verified. Live charges are disabled.'); this.code = 'PAYMENT_UNAVAILABLE'; }
}

/** Explicit boundary for the eventual official provider contract. Never guesses URLs or signatures. */
export class MorningGrowAdapter {
  get ready() { return false; }
  get checkoutOrigins() { return []; }
  async createCheckout() { throw new ProviderUnavailable(); }
  verifyWebhook() { throw new ProviderUnavailable(); }
  async refund() { throw new ProviderUnavailable(); }
  async reconcile() { throw new ProviderUnavailable(); }
}

export class SimulationAdapter {
  constructor({ secret, development }) {
    if (!development || typeof secret !== 'string' || secret.length < 32) throw new Error('Simulation requires development mode and a secret of at least 32 characters.');
    this.secret = secret;
  }
  sign(rawBody, timestamp) { return createHmac('sha256', this.secret).update(`${timestamp}.${rawBody}`).digest('hex'); }
  verifyWebhook(rawBody, headers, now) {
    const timestamp = String(headers['x-academy-timestamp'] ?? '');
    const signature = String(headers['x-academy-signature'] ?? '');
    if (!/^\d+$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300_000 || !/^[a-f0-9]{64}$/.test(signature)) return null;
    const expected = Buffer.from(this.sign(rawBody, timestamp), 'hex');
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
    try { return JSON.parse(rawBody); } catch { return null; }
  }
}
