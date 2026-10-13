import { MorningClient } from './morning-client.mjs';
import { seminarNames } from './message-templates.mjs';

const referenceFor = id => `Gutman Academy | ${id}`;

/** Morning returns a form URL, not a link ID or expiry. Our unique document reference correlates receipts. */
export class MorningCheckoutAdapter {
  constructor({ client = new MorningClient(), getOrder, getDate } = {}) { this.client = client; this.getOrder = getOrder; this.getDate = getDate; }
  get ready() { return this.client.ready && typeof this.getOrder === 'function'; }
  get checkoutOrigins() { return this.client.checkoutOrigins; }
  getReadiness() { return this.client.getReadiness(); }
  async createCheckout(input) {
    const reference = referenceFor(input.orderId);
    const order = await this.getOrder(input.orderId);
    const date = order && typeof this.getDate === 'function' ? await this.getDate(order.dateId) : null;
    const incomeDescription = date ? `${seminarNames[date.seminarId] ?? date.seminarId} | ${date.date}` : reference;
    const remarks = date ? `${incomeDescription} | ${date.startTime}-${date.endTime} | ${date.venue}. קיום הסמינר מותנה במינימום 8 משתתפים בתשלום.` : undefined;
    const { url } = await this.client.createPaymentForm({ reference, incomeDescription, remarks, amountAgorot: input.amountAgorot, customer: input.customer, successUrl: input.returnUrl, failureUrl: input.returnUrl, notifyUrl: input.notifyUrl, maxPayments: 1, custom: input.orderId });
    return { providerLinkId: reference, checkoutUrl: url, expiresAt: input.expiresAt,
      // This is OUR seat deadline. Morning has no documented form expiry; late payment requires review/refund.
      expiryEnforced: false };
  }
  async reconcile({ orderId, providerLinkId }) {
    const order = await this.getOrder(orderId);
    const reference = referenceFor(orderId);
    if (!order || providerLinkId !== reference) throw new Error('Provider order reference mismatch.');
    const orderDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(order.createdAt));
    const document = await this.client.reconcile({ reference, amountAgorot: order.totalAgorot, orderDate });
    if (!document) return null;
    return { id: `morning-receipt-${document.id}`, orderId, providerLinkId: reference, provider: 'morning', type: 'succeeded', transactionId: `morning-document-${document.id}`, amountAgorot: order.totalAgorot, currency: 'ILS' };
  }
  verifyWebhook(raw, headers) { return this.client.verifyWebhook(raw, headers); }
}
