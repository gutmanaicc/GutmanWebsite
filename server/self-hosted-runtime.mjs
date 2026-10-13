import { dirname, isAbsolute, join } from 'node:path';
import { AcademyLeadIntake, HubSpotFormAdapter, HubSpotWebhookAdapter } from './hubspot-leads.mjs';
import { CommerceStore } from './commerce.mjs';
import { createAcademyHandler } from './http.mjs';
import { MorningClient } from './morning-client.mjs';
import { loadVerifiedMorningMerchant } from './morning-merchant-state.mjs';
import { MorningCheckoutAdapter } from './morning-checkout-adapter.mjs';
import { HostedCheckout } from './hosted-checkout.mjs';
import { createResendDeliveryAdapter } from './resend-delivery-adapter.mjs';
import { DurableOutboxWorker } from './durable-outbox-worker.mjs';

/** SQLite BEGIN IMMEDIATE commits claims before network calls. A VPS must run
 * one application container on this local volume; no shared/NFS database.
 */
export class SelfHostedRepository {
  constructor(store) { this.store = store; }
  invoke(operation) {
    if (typeof operation !== 'function' || ['[object AsyncFunction]', '[object AsyncGeneratorFunction]'].includes(Object.prototype.toString.call(operation))) throw new Error('Repository operations must be synchronous.');
    const result = operation(this.store);
    if (result && typeof result.then === 'function') { Promise.resolve(result).catch(() => {}); throw new Error('Repository operations must not return promises.'); }
    return structuredClone(result);
  }
  async read(operation) { return this.invoke(operation); }
  async run(operation) { return this.store.transaction(() => this.invoke(operation)); }
}

export function createSelfHostedRuntime(env = process.env, { fetchImpl = globalThis.fetch, clock = Date.now } = {}) {
  if (!['disabled', 'morning', undefined].includes(env.ACADEMY_PAYMENT_MODE)) throw new Error('Only disabled or Morning payment mode is available on the standalone website.');
  const path = env.ACADEMY_DB_PATH || '/data/academy.sqlite';
  if (!isAbsolute(path) || path === ':memory:') throw new Error('A persistent absolute SQLite filesystem path is required.');
  const publicOrigin = env.ACADEMY_PUBLIC_ORIGIN;
  const origins = String(env.ACADEMY_ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  if (publicOrigin && !origins.includes(publicOrigin)) origins.push(publicOrigin);
  if (origins.some(origin => { try { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin || !!url.username || !!url.password; } catch { return true; } })) throw new Error('Standalone origins must be exact HTTPS origins behind the reverse proxy.');
  const mode = env.ACADEMY_PAYMENT_MODE || 'disabled';
  const merchant = loadVerifiedMorningMerchant(join(dirname(path), 'morning-merchant.json'), { clientId: env.MORNING_API_ID, clock });
  const explicitOrigins = String(env.MORNING_CHECKOUT_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const client = new MorningClient({ clientId: env.MORNING_API_ID, clientSecret: env.MORNING_API_SECRET, webhookSecret: env.MORNING_WEBHOOK_SECRET, environment: env.MORNING_ENVIRONMENT || 'production', businessTaxId: env.MORNING_BUSINESS_TAX_ID || merchant?.businessTaxId, merchantVerified: env.MORNING_MERCHANT_VERIFIED === '1' || merchant?.verified === true, paymentPluginId: merchant?.paymentPluginId, checkoutOrigins: explicitOrigins.length ? explicitOrigins : merchant?.checkoutOrigins || [], fetchImpl, clock });
  let store;
  let leadIntake;
  const adapter = new MorningCheckoutAdapter({ client, getOrder: id => store.get('orders', id) });
  store = new CommerceStore({ path, clock, mode, adapter, orderSecret: env.ACADEMY_ORDER_SECRET, bookingTermsApproved: env.ACADEMY_BOOKING_TERMS_APPROVED === '1' });
  try {
    store.seedDrafts();
    if (env.HUBSPOT_LEADS_ENABLED === '1') {
      const leadAdapter = env.HUBSPOT_LEAD_TRANSPORT === 'make'
        ? new HubSpotWebhookAdapter({ portalId: env.HUBSPOT_PORTAL_ID, webhookUrl: env.HUBSPOT_MAKE_WEBHOOK_URL, fetchImpl })
        : new HubSpotFormAdapter({ portalId: env.HUBSPOT_PORTAL_ID, formId: env.HUBSPOT_FORM_ID, publicOrigin, fetchImpl });
      leadIntake = new AcademyLeadIntake({ path: env.ACADEMY_LEADS_DB_PATH || join(dirname(path), 'academy-leads.sqlite'), adapter: leadAdapter, clock });
    }
    const repository = new SelfHostedRepository(store);
    const checkout = new HostedCheckout({ store, adapter, publicOrigin });
    const deliveryAdapter = createResendDeliveryAdapter(env, { fetchImpl });
    const deliveryWorker = new DurableOutboxWorker({ repository, adapter: deliveryAdapter, clock });
    const handler = createAcademyHandler({ store, checkout, deliveryWorker, leadIntake, adminToken: env.ACADEMY_ADMIN_TOKEN, allowedOrigins: origins });
    return { store, client, checkout, repository, deliveryWorker, leadIntake, handler, allowedOrigins: origins, close: () => { leadIntake?.close(); store.close(); } };
  } catch (error) { leadIntake?.close(); store.close(); throw error; }
}
