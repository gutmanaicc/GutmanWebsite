import { CommerceStore } from './commerce.mjs';

/** Async facade. External actions run outside repository callbacks, after their claims are committed. */
export class PersistentCommerceService {
  constructor({ repository, storeOptions, clock = Date.now } = {}) {
    this.repository = repository;
    this.mode = storeOptions.mode ?? 'disabled';
    this.adapter = storeOptions.adapter;
    this.clock = clock;
    this.commerce = { mode: this.mode, ready: this.mode === 'morning' && this.adapter?.ready === true && storeOptions.bookingTermsApproved === true, bookingTermsApproved: storeOptions.bookingTermsApproved === true };
  }
  orderResult(order, token) { return CommerceStore.prototype.orderResult.call(null, order, token); }
}
const reads = ['dates', 'coupons', 'get', 'all', 'summary', 'revenue', 'quote', 'authorizedOrder'];
const mutations = ['createOrder', 'claimCheckout', 'completeCheckout', 'checkoutFailed', 'processVerifiedEvent', 'createDate', 'updateDate', 'approveDate', 'rejectDate', 'createCoupon', 'updateCoupon', 'refundOrder', 'retryOutbox', 'expireHolds', 'simulationPay', 'processSignedEvent'];
for (const name of reads) PersistentCommerceService.prototype[name] = function (...args) { return this.repository.read(store => store[name](...args)); };
for (const name of mutations) PersistentCommerceService.prototype[name] = function (...args) { return this.repository.run(store => store[name](...args)); };
