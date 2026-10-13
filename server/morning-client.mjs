import { createHmac, timingSafeEqual } from 'node:crypto';

// Official source: https://developers.morning.co/docs/openapi.bundled.json
// Official PaymentGroup 0 is withholding tax, not money received. Unknown types fail closed.
const RECEIVED_PAYMENT_TYPES = new Set([1, 2, 3, 4, 5, 10, 11]);
const ENDPOINTS = Object.freeze({
  production: { auth: 'https://api.morning.co/idp/v1/oauth/token', api: 'https://api.greeninvoice.co.il/api/v1' },
  sandbox: { auth: 'https://api.sandbox.morning.dev/idp/v1/oauth/token', api: 'https://sandbox.d.greeninvoice.co.il/api/v1' },
});

export class MorningClientError extends Error {
  constructor(code, message, status) { super(message); this.name = 'MorningClientError'; this.code = code; if (status) this.status = status; }
}
const fail = (code, message) => { throw new MorningClientError(code, message); };
const string = value => typeof value === 'string' && value.trim().length > 0;
const amount = agorot => {
  if (!Number.isSafeInteger(agorot) || agorot <= 0 || Math.round((agorot / 100) * 100) !== agorot) fail('INVALID_AMOUNT', 'A positive exact amount in agorot is required.');
  return agorot / 100;
};
const httpsUrl = value => {
  try { const parsed = new URL(value); if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return parsed; } catch { /* Fail without logging URLs. */ }
  fail('INVALID_URL', 'An HTTPS URL without embedded credentials is required.');
};
function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('INVALID_DATE', 'An ISO calendar date is required.');
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail('INVALID_DATE', 'An ISO calendar date is required.');
  return value;
}
const toAgorot = value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
};
const header = (headers, name) => {
  if (typeof headers?.get === 'function') return headers.get(name);
  const key = Object.keys(headers ?? {}).find(key => key.toLowerCase() === name);
  return key ? headers[key] : null;
};

export class MorningClient {
  #clientId; #clientSecret; #webhookSecret; #fetch; #clock; #timeout; #token; #tokenPromise; #endpoints;
  #checkoutOrigins; #businessTaxId; #merchantVerified; #paymentPluginId;

  constructor({ clientId, clientSecret, webhookSecret, environment = 'production', checkoutOrigins = [], businessTaxId, merchantVerified = false, paymentPluginId, fetchImpl = globalThis.fetch, clock = Date.now, timeoutMs = 10_000 } = {}) {
    if (!ENDPOINTS[environment]) fail('INVALID_ENVIRONMENT', 'Choose production or sandbox explicitly.');
    if (typeof fetchImpl !== 'function' || typeof clock !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) fail('INVALID_CONFIGURATION', 'A fetch implementation, clock and positive timeout are required.');
    if (!Array.isArray(checkoutOrigins)) fail('INVALID_CONFIGURATION', 'Configure verified checkout origins explicitly.');
    this.#checkoutOrigins = checkoutOrigins.map(origin => {
      const parsed = httpsUrl(origin);
      if (parsed.origin !== origin) fail('INVALID_CONFIGURATION', 'Checkout origins must be canonical HTTPS origins.');
      return parsed.origin;
    });
    this.#endpoints = ENDPOINTS[environment]; this.#clientId = clientId; this.#clientSecret = clientSecret;
    this.#webhookSecret = webhookSecret; this.#fetch = fetchImpl; this.#clock = clock; this.#timeout = timeoutMs;
    this.#businessTaxId = string(businessTaxId) ? businessTaxId.trim() : null; this.#merchantVerified = merchantVerified === true;
    if (paymentPluginId !== undefined && !string(paymentPluginId)) fail('INVALID_CONFIGURATION', 'A verified payment plugin must have a nonempty ID.');
    this.#paymentPluginId = paymentPluginId;
    this.environment = environment;
  }

  get configured() { return string(this.#clientId) && string(this.#clientSecret); }
  get checkoutOrigins() { return [...this.#checkoutOrigins]; }
  // The notify callback only wakes an authenticated document lookup. It never
  // trusts callback payment fields, so an optional HMAC secret is not a gate.
  get ready() { return this.configured && this.#merchantVerified && !!this.#businessTaxId && this.#checkoutOrigins.length > 0; }
  getReadiness() { return { environment: this.environment, configured: this.configured, merchantVerified: this.#merchantVerified, checkoutOriginsConfigured: this.#checkoutOrigins.length > 0, businessIdentityConfigured: !!this.#businessTaxId, paymentPluginConfigured: !!this.#paymentPluginId, webhookSecretConfigured: typeof this.#webhookSecret === 'string' && this.#webhookSecret.length >= 32, ready: this.ready }; }

  async #json(url, body, accessToken) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeout);
    try {
      const response = await this.#fetch(url, { method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: controller.signal, headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (response.redirected) fail('PROVIDER_REDIRECT', 'Provider redirects are not accepted.');
      if (!response.ok) throw new MorningClientError('PROVIDER_HTTP_ERROR', 'The provider request was not accepted.', response.status);
      let data;
      try { data = await response.json(); } catch { fail('INVALID_PROVIDER_RESPONSE', 'The provider returned an invalid JSON response.'); }
      if (!data || typeof data !== 'object') fail('INVALID_PROVIDER_RESPONSE', 'The provider returned an invalid response.');
      return data;
    } catch (error) {
      if (error instanceof MorningClientError) throw error;
      throw new MorningClientError(controller.signal.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR', controller.signal.aborted ? 'The provider request timed out.' : 'The provider request could not be completed.');
    } finally { clearTimeout(timer); }
  }

  async #accessToken() {
    if (!this.configured) fail('CREDENTIALS_MISSING', 'Server-side provider credentials are required.');
    if (this.#token && this.#token.expiresAt * 1000 - 60_000 > this.#clock()) return this.#token.accessToken;
    if (!this.#tokenPromise) {
      this.#tokenPromise = (async () => {
        const result = await this.#json(this.#endpoints.auth, { grant_type: 'client_credentials', client_id: this.#clientId, client_secret: this.#clientSecret });
        if (!string(result.accessToken) || result.tokenType !== 'Bearer' || !Number.isSafeInteger(result.expiresAt) || result.expiresAt * 1000 <= this.#clock()) fail('INVALID_AUTH_RESPONSE', 'The provider did not return a valid unexpired Bearer token.');
        this.#token = { accessToken: result.accessToken, expiresAt: result.expiresAt }; return result.accessToken;
      })();
    }
    try { return await this.#tokenPromise; } finally { this.#tokenPromise = undefined; }
  }

  async #api(path, body) { return this.#json(`${this.#endpoints.api}${path}`, body, await this.#accessToken()); }

  async createPaymentForm({ reference, incomeDescription, remarks, amountAgorot, customer, successUrl, failureUrl, notifyUrl, maxPayments = 1, custom, pluginId } = {}) {
    if (!this.ready) fail('MERCHANT_NOT_VERIFIED', 'Merchant verification and all required server-side settings must be completed before creating payment forms.');
    if (!string(reference) || !string(customer?.name)) fail('INVALID_PAYMENT_FORM', 'An exact order reference and customer name are required.');
    if (!Number.isSafeInteger(maxPayments) || maxPayments < 1 || maxPayments > 6) fail('INVALID_PAYMENT_FORM', 'Payment count must be between one and six, subject to verified merchant support.');
    const total = amount(amountAgorot);
    const client = { name: customer.name, country: 'IL', add: false };
    if (customer.email !== undefined) { if (!string(customer.email)) fail('INVALID_PAYMENT_FORM', 'A valid customer email value is required.'); client.emails = [customer.email]; }
    if (customer.phone !== undefined) { if (!string(customer.phone)) fail('INVALID_PAYMENT_FORM', 'A valid customer phone value is required.'); client.phone = customer.phone; client.mobile = customer.phone; }
    if (incomeDescription !== undefined && (!string(incomeDescription) || incomeDescription.length > 500)) fail('INVALID_PAYMENT_FORM', 'The seminar description is invalid.');
    if (remarks !== undefined && (typeof remarks !== 'string' || remarks.length > 2000)) fail('INVALID_PAYMENT_FORM', 'The seminar details are invalid.');
    const body = { description: reference, type: 400, amount: total, currency: 'ILS', vatType: 1, lang: 'he', client, maxPayments, group: 100, income: [{ description: incomeDescription ?? reference, quantity: 1, price: total, currency: 'ILS', vatType: 2 }], ...(remarks !== undefined ? { remarks } : {}) };
    for (const [key, value] of Object.entries({ successUrl, failureUrl, notifyUrl })) if (value !== undefined) body[key] = httpsUrl(value).href;
    if (custom !== undefined && typeof custom !== 'string') fail('INVALID_PAYMENT_FORM', 'Custom callback data must be a string.');
    body.custom = custom ?? reference;
    const selectedPluginId = pluginId ?? this.#paymentPluginId;
    if (selectedPluginId !== undefined) { if (!string(selectedPluginId)) fail('INVALID_PAYMENT_FORM', 'A configured plugin ID must be a string.'); body.pluginId = selectedPluginId; }
    const result = await this.#api('/payments/form', body);
    if (result.success !== true || result.errorCode !== 0 || !string(result.url)) fail('INVALID_PAYMENT_FORM_RESPONSE', 'The provider did not confirm creation of a payment form.');
    const checkout = httpsUrl(result.url);
    if (!this.#checkoutOrigins.includes(checkout.origin)) fail('UNVERIFIED_CHECKOUT_ORIGIN', 'The returned payment URL does not match a verified checkout origin.');
    return { url: checkout.href };
  }

  #matchesDocument(document, reference, totalAgorot) {
    if (!document || typeof document !== 'object' || !string(document.id) || document.description !== reference || document.type !== 400 || ![0, 1].includes(document.status) || document.currency !== 'ILS' || toAgorot(document.amount) !== totalAgorot || document.vat !== 0 || document.vatType !== 1 || document.business?.exemption !== true || String(document.business?.taxId ?? '') !== this.#businessTaxId || !Array.isArray(document.payment) || document.payment.length === 0) return false;
    let paid = 0;
    for (const row of document.payment) {
      const cents = toAgorot(row?.price);
      if (row?.currency !== 'ILS' || cents === null || cents <= 0 || !RECEIVED_PAYMENT_TYPES.has(row?.type)) return false;
      paid += cents;
    }
    return Number.isSafeInteger(paid) && paid === totalAgorot;
  }

  async reconcile({ reference, amountAgorot, orderDate, today } = {}) {
    if (!this.configured || !this.#businessTaxId) fail('RECONCILIATION_NOT_CONFIGURED', 'Provider credentials and known merchant identity are required for reconciliation.');
    if (!string(reference)) fail('INVALID_REFERENCE', 'An exact order reference is required.');
    amount(amountAgorot); const fromDate = isoDate(orderDate);
    const currentDate = today ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(this.#clock()));
    const toDate = isoDate(currentDate); if (toDate < fromDate) fail('INVALID_DATE', 'Search end date must not precede the order date.');
    const matches = [];
    let page = 1, pages = 1;
    do {
      const result = await this.#api('/documents/search', { page, pageSize: 25, type: [400], description: reference, fromDate, toDate, sort: 'date:desc' });
      if (!Array.isArray(result.items) || !Number.isSafeInteger(result.pages) || result.pages < 0) fail('INVALID_SEARCH_RESPONSE', 'The provider returned an invalid document search response.');
      pages = result.pages;
      // A bounded read fails closed instead of selecting a partial/ambiguous match.
      if (pages > 100) fail('AMBIGUOUS_SEARCH', 'The document search requires manual review.');
      for (const item of result.items) {
        if (item?.description !== reference || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item?.id ?? '')) continue;
        const document = await this.#api(`/documents/${item.id}`);
        if (document.id === item.id && this.#matchesDocument(document, reference, amountAgorot)) matches.push(document);
      }
      page++;
    } while (page <= pages);
    const unique = [...new Map(matches.map(document => [document.id, document])).values()];
    return unique.length === 1 ? unique[0] : null;
  }

  verifyWebhook(raw, headers) {
    if (typeof this.#webhookSecret !== 'string' || this.#webhookSecret.length < 32 || (typeof raw !== 'string' && !Buffer.isBuffer(raw))) return null;
    const signature = header(headers, 'x-webhook-signature');
    if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return null;
    const expected = createHmac('sha256', this.#webhookSecret).update(raw).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
    // The official signature authenticates the raw body. No envelope or payment status is guessed here.
    try { return JSON.parse(raw.toString()); } catch { return null; }
  }
}
