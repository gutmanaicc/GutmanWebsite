/** Consumes only registrations committed after authenticated Morning proof.
 * CRM delivery uses persistent intake keys and never automatically replays an
 * uncertain send. No email, payment or enrollment is created here.
 */
export class HubSpotRegistrationWorker {
  constructor({ store, intake } = {}) { this.store = store; this.intake = intake; this.busy = false; }
  get ready() { return this.intake?.ready === true && this.store.mode === 'morning' && this.store.bookingTermsApproved === true; }
  async drain(limit = 20) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw new Error('A bounded CRM registration batch is required.');
    const report = { sent: 0, reviewRequired: 0, skipped: 0 };
    if (!this.ready || this.busy) return report;
    this.busy = true;
    try {
      const items = this.store.all('outbox').filter(row => row.kind === 'crm_registration' && ['pending', 'processing'].includes(row.status)).slice(0, limit);
      for (const candidate of items) {
        const claim = this.store.transaction(() => {
          const item = this.store.get('outbox', candidate.id); const order = item && this.store.get('orders', item.orderId);
          const registration = item?.payload?.registration && this.store.get('registrations', item.payload.registration.id);
          const date = order && this.store.get('dates', order.dateId);
          if (!item || !['pending', 'processing'].includes(item.status)) return null;
          if (!order || order.status !== 'paid' || order.simulation || order.provider !== 'morning' || !registration || registration.orderId !== order.id || registration.status !== 'confirmed' || registration.simulation || registration.totalAgorot !== order.totalAgorot || !date || item.payload?.simulation !== false) {
            item.status = 'cancelled'; item.nextAttemptAt = null; this.store.save('outbox', item); return null;
          }
          item.status = 'processing'; item.attempts++; this.store.save('outbox', item);
          return { item, order, date };
        });
        if (!claim) { report.skipped++; continue; }
        const { item, order, date } = claim;
        let accepted;
        try {
          accepted = await this.intake.submit({ fullName: order.customer.name, email: order.customer.email, phone: order.customer.phone, seminarId: date.seminarId, requestedDate: date.date, marketingConsent: order.marketingConsent === true, note: `התשלום אומת וההרשמה אושרה. סכום ששולם: ${order.totalAgorot / 100} ₪. מספר הזמנה: ${order.id}` }, `registration-${order.id}`);
        } catch {
          this.store.transaction(() => { const current = this.store.get('outbox', item.id); current.status = 'failed'; current.nextAttemptAt = null; current.lastError = 'CRM_REGISTRATION_REVIEW_REQUIRED'; this.store.save('outbox', current); }); report.reviewRequired++; continue;
        }
        // A failed finalization leaves the claim recoverable. The private intake
        // returns its saved acceptance on restart without another provider send.
        this.store.transaction(() => {
          const current = this.store.get('outbox', item.id);
          if (current.status !== 'processing') return;
          current.status = 'sent'; current.sentAt = new Date(this.store.clock()).toISOString(); current.nextAttemptAt = null; current.deliveryProvider = 'hubspot'; current.crmIntakeId = accepted.leadId; current.lastError = null; this.store.save('outbox', current);
        }); report.sent++;
      }
      return report;
    } finally { this.busy = false; }
  }
}
