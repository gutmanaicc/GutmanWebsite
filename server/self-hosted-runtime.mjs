import { dirname, isAbsolute, join } from 'node:path';
import { AcademyLeadIntake, HubSpotFormAdapter, HubSpotWebhookAdapter } from './hubspot-leads.mjs';
import { HubSpotRegistrationWorker } from './hubspot-registration-worker.mjs';
import { LegalNoticeInbox } from './legal-notices.mjs';
import { loadMerchantDisclosure, publicLegalDisclosure, buildOrderLegalSnapshot } from './legal-documents.mjs';
import { CommerceStore } from './commerce.mjs';
import { createAcademyHandler } from './http.mjs';
import { MorningClient } from './morning-client.mjs';
import { loadVerifiedMorningMerchant } from './morning-merchant-state.mjs';
import { MorningCheckoutAdapter } from './morning-checkout-adapter.mjs';
import { HostedCheckout } from './hosted-checkout.mjs';
import { GmailMakeDeliveryAdapter } from './gmail-make-delivery-adapter.mjs';
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
  const seller = loadMerchantDisclosure(join(dirname(path), 'merchant-legal-profile.json'), merchant);
  const siteTermsApproved = env.ACADEMY_SITE_TERMS_APPROVED === '1';
  const legalDisclosure = publicLegalDisclosure(seller, { siteTermsApproved });
  const disclosureRequired = env.ACADEMY_COMMERCIAL_DISCLOSURE_REQUIRED === '1';
  const explicitOrigins = String(env.MORNING_CHECKOUT_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const client = new MorningClient({ clientId: env.MORNING_API_ID, clientSecret: env.MORNING_API_SECRET, webhookSecret: env.MORNING_WEBHOOK_SECRET, environment: env.MORNING_ENVIRONMENT || 'production', businessTaxId: env.MORNING_BUSINESS_TAX_ID || merchant?.businessTaxId, merchantVerified: env.MORNING_MERCHANT_VERIFIED === '1' || merchant?.verified === true, paymentPluginId: merchant?.paymentPluginId, checkoutOrigins: explicitOrigins.length ? explicitOrigins : merchant?.checkoutOrigins || [], fetchImpl, clock });
  let store;
  let leadIntake;
  let registrationIntake;
  let legalInbox;
  const adapter = new MorningCheckoutAdapter({ client, getOrder: id => store.get('orders', id), getDate: id => store.get('dates', id) });
  store = new CommerceStore({ path, clock, mode, adapter, orderSecret: env.ACADEMY_ORDER_SECRET, publicOrigin, bookingTermsApproved: env.ACADEMY_BOOKING_TERMS_APPROVED === '1', legalDocumentFactory: (order,date,at) => buildOrderLegalSnapshot(order,date,seller,at,{siteTermsApproved}), requiredDisclosureVersion: disclosureRequired ? legalDisclosure.version : undefined, merchantDisclosureReady: !disclosureRequired || !!seller });
  try {
    store.seedDrafts();
    if (typeof env.ACADEMY_ORDER_SECRET === 'string' && env.ACADEMY_ORDER_SECRET.length >= 32) legalInbox = new LegalNoticeInbox({ path: join(dirname(path), 'academy-legal-notices.sqlite'), secret: env.ACADEMY_ORDER_SECRET, clock });
    if (env.HUBSPOT_LEADS_ENABLED === '1') {
      const leadAdapter = env.HUBSPOT_LEAD_TRANSPORT === 'make'
        ? new HubSpotWebhookAdapter({ portalId: env.HUBSPOT_PORTAL_ID, webhookUrl: env.HUBSPOT_MAKE_WEBHOOK_URL, fetchImpl })
        : new HubSpotFormAdapter({ portalId: env.HUBSPOT_PORTAL_ID, formId: env.HUBSPOT_FORM_ID, publicOrigin, fetchImpl });
      leadIntake = new AcademyLeadIntake({ path: env.ACADEMY_LEADS_DB_PATH || join(dirname(path), 'academy-leads.sqlite'), adapter: leadAdapter, clock });
      if (env.HUBSPOT_LEAD_TRANSPORT === 'make') registrationIntake = new AcademyLeadIntake({ path: join(dirname(path), 'academy-crm-registration.sqlite'), adapter: new HubSpotWebhookAdapter({ portalId: env.HUBSPOT_PORTAL_ID, webhookUrl: env.HUBSPOT_MAKE_WEBHOOK_URL, stage: 'registered', fetchImpl }), clock });
    }
    const repository = new SelfHostedRepository(store);
    const checkout = new HostedCheckout({ store, adapter, publicOrigin });
    const deliveryAdapter = env.ACADEMY_EMAIL_PROVIDER === 'gmail-make'
      ? new GmailMakeDeliveryAdapter({ webhookUrl: env.ACADEMY_EMAIL_MAKE_WEBHOOK_URL, sender: env.ACADEMY_EMAIL_SENDER, enabled: env.ACADEMY_EMAIL_DELIVERY_ENABLED === '1', senderVerified: env.ACADEMY_EMAIL_SENDER_VERIFIED === '1', fetchImpl })
      : createResendDeliveryAdapter(env, { fetchImpl });
    const deliveryWorker = new DurableOutboxWorker({ repository, adapter: deliveryAdapter, clock });
    const crmWorker = new HubSpotRegistrationWorker({ store, intake: registrationIntake });
    const handler = createAcademyHandler({ store, checkout, deliveryWorker, leadIntake, legalInbox, legalDisclosure, publicOrigin, adminToken: env.ACADEMY_ADMIN_TOKEN, allowedOrigins: origins });
    return { store, client, checkout, repository, deliveryWorker, leadIntake, legalInbox, crmWorker, handler, allowedOrigins: origins, close: () => { legalInbox?.close(); registrationIntake?.close(); leadIntake?.close(); store.close(); } };
  } catch (error) { legalInbox?.close(); registrationIntake?.close(); leadIntake?.close(); store.close(); throw error; }
}
