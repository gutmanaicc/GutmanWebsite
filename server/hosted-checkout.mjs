import { CommerceError } from './commerce.mjs';

const unavailable = () => { throw new CommerceError('PAYMENT_UNAVAILABLE', 'החיבור לסליקה עדיין אינו זמין.', 503); };

/** Provider operations happen outside SQLite transactions. Only an authenticated lookup can settle an order. */
export class HostedCheckout {
  constructor({ store, adapter, publicOrigin } = {}) {
    this.store = store;
    this.adapter = adapter;
    this.pendingLookups = new Map();
    this.cursor = 0;
    this.publicOrigin = null;
    if (publicOrigin) {
      const url = new URL(publicOrigin);
      if (url.protocol !== 'https:' || url.origin !== publicOrigin || url.username || url.password) throw new Error('Checkout return origin must be an exact HTTPS origin.');
      this.publicOrigin = url.origin;
    }
  }
  get ready() {
    return Boolean(this.store.mode === 'morning' && this.store.commerce.ready && this.adapter?.ready && this.publicOrigin && this.adapter.checkoutOrigins?.length);
  }
  async start(created) {
    if (!this.ready) unavailable();
    const { claimed, order } = this.store.claimCheckout(created.orderId);
    if (!claimed) return { ...created, ...this.store.orderResult(order) };
    if (order.totalAgorot <= 0) return { ...created, ...this.store.checkoutFailed(order.id, { unknown: false, reasonCode: 'ZERO_AMOUNT_UNSUPPORTED' }) };
    try {
      const result = await this.adapter.createCheckout({
        orderId: order.id, amountAgorot: order.totalAgorot, currency: order.currency,
        customer: order.customer, installments: order.installments,
        expiresAt: order.holdExpiresAt,
        returnUrl: `${this.publicOrigin}/orders/${encodeURIComponent(order.id)}`,
        notifyUrl: `${this.publicOrigin}/api/academy/payments/morning/notify/${encodeURIComponent(order.id)}`,
      });
      const url = new URL(result.checkoutUrl);
      // Origins belong to the reviewed provider adapter, never to user input or an API response.
      if (url.protocol !== 'https:' || url.username || url.password || !this.adapter.checkoutOrigins.includes(url.origin)) throw new Error('Invalid provider checkout destination.');
      if (typeof result.providerLinkId !== 'string' || !result.providerLinkId || result.providerLinkId.length > 200) throw new Error('Missing provider reference.');
      const expires = Date.parse(result.expiresAt);
      if (!Number.isFinite(expires) || expires <= this.store.clock() || expires > Date.parse(order.holdExpiresAt)) throw new Error('Provider checkout must expire within the reserved seat period.');
      return { ...created, ...this.store.completeCheckout(order.id, { ...result, checkoutUrl: url.href }) };
    } catch {
      // A timeout can occur after the provider has created the link. Do not create another link on retry.
      return { ...created, ...this.store.checkoutFailed(order.id, { unknown: true, reasonCode: 'PROVIDER_RESULT_UNKNOWN' }) };
    }
  }
  async refresh(orderId) {
    if (this.pendingLookups.has(orderId)) return this.pendingLookups.get(orderId);
    const operation = this.lookup(orderId);
    this.pendingLookups.set(orderId, operation);
    try { return await operation; } finally { this.pendingLookups.delete(orderId); }
  }
  async lookup(orderId) {
    if (!this.ready) unavailable();
    const order = this.store.get('orders', orderId);
    if (!order) throw new CommerceError('ORDER_NOT_FOUND', 'ההזמנה לא נמצאה.', 404);
    if (!order.providerLinkId || order.simulation || ['paid', 'refunded'].includes(order.status)) return this.store.orderResult(order);
    const event = await this.adapter.reconcile({ orderId, providerLinkId: order.providerLinkId });
    if (event === null) return this.store.orderResult(order);
    if (!event || event.orderId !== orderId || event.providerLinkId !== order.providerLinkId || event.provider !== 'morning') throw new CommerceError('INVALID_PROVIDER_RESULT', 'אימות פרטי התשלום לא הושלם.', 502);
    // Event comes from the server-authenticated provider response, never from callback/redirect fields.
    const { providerLinkId: _reference, ...normalized } = event;
    return this.store.processVerifiedEvent(normalized);
  }
  async refreshPending(limit = 20) {
    if (!this.ready) return;
    const cutoff = this.store.clock() - 86_400_000;
    const due = this.store.all('orders').filter(item => !item.simulation && item.providerLinkId && ['pending', 'expired'].includes(item.status) && Date.parse(item.holdExpiresAt) >= cutoff);
    if (!due.length) return;
    const start = this.cursor % due.length;
    const batch = [...due.slice(start), ...due.slice(0, start)].slice(0, limit);
    this.cursor = (start + batch.length) % due.length;
    for (const order of batch) {
      try { await this.refresh(order.id); } catch { /* Scoped status remains pending; no false enrollment or secret logging. */ }
    }
  }
}
