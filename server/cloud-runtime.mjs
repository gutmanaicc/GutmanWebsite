import { CommerceStore } from './commerce.mjs';
import { createAcademyHandler } from './http.mjs';
import { HostedCheckout } from './hosted-checkout.mjs';
import { MorningClient } from './morning-client.mjs';
import { MorningCheckoutAdapter } from './morning-checkout-adapter.mjs';
import { DurableCommerceRepository } from './durable-commerce.mjs';
import { BlobCommerceBackend } from './blob-commerce-backend.mjs';
import { PersistentCommerceService } from './persistent-commerce-service.mjs';
import { createResendDeliveryAdapter } from './resend-delivery-adapter.mjs';
import { DurableOutboxWorker } from './durable-outbox-worker.mjs';

/** Lazy runtime: missing credentials/storage cannot open purchases or persist orders on temporary disk. */
export function createCloudRuntime(env = process.env, { backend, fetchImpl = globalThis.fetch, clock = Date.now } = {}) {
  if (env.ACADEMY_PAYMENT_MODE === 'simulation') throw new Error('Payment simulation is unavailable on the deployed website.');
  const mode = env.ACADEMY_PAYMENT_MODE === 'morning' ? 'morning' : 'disabled';
  const origins = String(env.ACADEMY_ALLOWED_ORIGINS ?? '').split(',').map(v => v.trim()).filter(Boolean);
  const publicOrigin = env.ACADEMY_PUBLIC_ORIGIN || (env.VERCEL_BRANCH_URL ? `https://${env.VERCEL_BRANCH_URL}` : env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined);
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
    const origin = host ? `https://${host}` : undefined;
    if (origin && !origins.includes(origin)) origins.push(origin);
  }
  if (publicOrigin && !origins.includes(publicOrigin)) origins.push(publicOrigin);
  if (origins.some(origin => { try { const u = new URL(origin); return u.protocol !== 'https:' || u.origin !== origin || !!u.username || !!u.password; } catch { return true; } })) throw new Error('Cloud origins must be canonical HTTPS origins.');
  const client = new MorningClient({ clientId: env.MORNING_API_ID, clientSecret: env.MORNING_API_SECRET, webhookSecret: env.MORNING_WEBHOOK_SECRET, environment: env.MORNING_ENVIRONMENT || 'production', businessTaxId: env.MORNING_BUSINESS_TAX_ID, merchantVerified: env.MORNING_MERCHANT_VERIFIED === '1', checkoutOrigins: String(env.MORNING_CHECKOUT_ORIGINS ?? '').split(',').map(v => v.trim()).filter(Boolean), fetchImpl, clock });
  let store;
  const adapter = new MorningCheckoutAdapter({ client, getOrder: id => store.get('orders', id) });
  const storeOptions = { mode, adapter, orderSecret: env.ACADEMY_ORDER_SECRET, bookingTermsApproved: env.ACADEMY_BOOKING_TERMS_APPROVED === '1' };
  const storageConfigured = Boolean(backend || (env.ACADEMY_STORAGE_ENABLED === '1' && (env.BLOB_STORE_ID || env.BLOB_READ_WRITE_TOKEN) && env.ACADEMY_STORAGE_SECRET && env.ACADEMY_BLOB_PATH));
  if (storageConfigured) {
    const persistence = backend || new BlobCommerceBackend({ pathname: env.ACADEMY_BLOB_PATH, encryptionSecret: env.ACADEMY_STORAGE_SECRET });
    const repository = new DurableCommerceRepository({ backend: persistence, storeOptions, clock });
    store = new PersistentCommerceService({ repository, storeOptions, clock });
  } else {
    // An honest read-only catalog can render before infrastructure is provisioned. No ephemeral admin/order writes.
    store = new CommerceStore({ mode: 'disabled', clock });
  }
  const checkout = new HostedCheckout({ store, adapter, publicOrigin });
  const deliveryAdapter = createResendDeliveryAdapter(env, { fetchImpl });
  const deliveryWorker = storageConfigured ? new DurableOutboxWorker({ repository: store.repository, adapter: deliveryAdapter, clock }) : null;
  const handler = createAcademyHandler({ store, checkout, deliveryWorker, adminToken: storageConfigured ? env.ACADEMY_ADMIN_TOKEN : undefined, allowedOrigins: origins });
  return { handler, store, checkout, client, storageConfigured, deliveryWorker };
}
