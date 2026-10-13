/** Eligibility comes from the committed private order and registration, never request JSON. */
export function hasConfirmedEnrollment(store, order, registration) {
  if (!order || order.simulation || order.provider !== 'morning') return false;
  registration ??= store.all('registrations').find(row => row.orderId === order.id);
  if (!registration || registration.status !== 'confirmed' || registration.simulation || registration.orderId !== order.id || registration.dateId !== order.dateId || registration.totalAgorot !== order.totalAgorot || registration.customer?.email !== order.customer.email) return false;
  if (order.status === 'paid') return order.totalAgorot > 0 && Boolean(order.transactionId) && registration.transactionId === order.transactionId;
  return order.status === 'complimentary' && order.paymentKind === 'complimentary' && order.totalAgorot === 0 && order.subtotalAgorot > 0 && order.discountAgorot === order.subtotalAgorot && Boolean(store.get('coupons',order.couponId)) && registration.paymentKind === 'complimentary' && registration.couponId === order.couponId && Boolean(order.confirmedAt) && registration.confirmedAt === order.confirmedAt && order.transactionId === null && registration.transactionId === null && order.checkoutState === 'not_required';
}
