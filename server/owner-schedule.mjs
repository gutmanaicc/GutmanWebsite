import { randomUUID } from 'node:crypto';

/** Publish only the exact owner-approved schedule, atomically and idempotently.
 * Unrelated drafts, orders and global commerce settings are not changed here.
 */
export function approveOwnerSchedule(store, schedule, { ownerApproved = false } = {}) {
  if (!ownerApproved || !schedule?.reference || !Array.isArray(schedule.dates) || schedule.dates.length !== 6 || new Set(schedule.dates.map(item => item.date)).size !== 6) throw new Error('Explicit approval of the six owner dates is required.');
  return store.transaction(() => {
    const result = [];
    for (const item of schedule.dates) {
      const matches = store.all('dates').filter(record => record.date === item.date && !['cancelled', 'completed'].includes(record.status));
      const before = matches[0];
      if (matches.length !== 1 || before.seminarId !== item.seminarId || before.venue !== schedule.venue || before.capacity !== 12 || before.ownerScheduleReference !== schedule.reference) throw new Error('Only the exact prepared owner schedule can be approved.');
      if (before.approvalStatus === 'approved' && before.published && before.status === 'open_for_registration') { result.push({ date: item.date, changed: false }); continue; }
      if (before.approvalStatus !== 'pending' || before.published || before.status !== 'draft') throw new Error('Unexpected date state requires individual review.');
      const approvedAt = new Date(store.clock()).toISOString();
      const record = store.validateDate({ approvalStatus: 'approved', approvedAt, published: true, status: 'open_for_registration', sourceNote: 'Owner explicitly approved the booking terms and opening purchases for this exact date and venue on 2026-10-13.' }, before);
      store.save('dates', record);
      store.audit('date.owner-approved', record.id, { reference: schedule.reference, date: item.date, seminarId: item.seminarId, published: true });
      result.push({ date: item.date, changed: true });
    }
    if (result.some(item => item.changed)) store.audit('terms.owner-approved', 'booking-terms-2026-10-13', { reference: schedule.reference, fullRefundBeforeHours: 48, statutoryRightsPreserved: true, collegeCancellationFullRefund: true, ownerConfirmation: 'מאשר את התנאים ופתיחת הרכישה' });
    return { approved: true, dates: result };
  });
}

/** Apply only owner-specified dates. Unrelated dates and customer data stay in place. */
export function applyOwnerSchedule(store, schedule, { apply = false } = {}) {
  if (!schedule || typeof schedule.reference !== 'string' || !schedule.reference.trim() || !Array.isArray(schedule.dates) || !schedule.dates.length || schedule.dates.length > 30 || new Set(schedule.dates.map(item => item.date)).size !== schedule.dates.length) throw new Error('An explicit, unique owner schedule is required.');
  if (!apply) return { applied: false, dates: schedule.dates.map(({ date, seminarId }) => ({ date, seminarId })) };
  return store.transaction(() => {
    const dates = [];
    for (const item of schedule.dates) {
      const matches = store.all('dates').filter(record => record.date === item.date && !['cancelled', 'completed'].includes(record.status));
      if (matches.length > 1) throw new Error('Multiple active dates require individual review.');
      const before = matches[0];
      if (before) {
        const exact = before.seminarId === item.seminarId && before.venue === schedule.venue && before.ownerScheduleReference === schedule.reference;
        if (exact) { dates.push({ date: item.date, seminarId: item.seminarId, changed: false }); continue; }
        const view = store.dateView(before);
        if (view.paidCount || view.pendingCount || before.approvalStatus === 'approved' || before.published) throw new Error('Published or reserved dates require individual review.');
      }
      const record = store.validateDate({
        id: before?.id ?? randomUUID(), seminarId: item.seminarId, date: item.date,
        venue: schedule.venue, capacity: 12, status: 'draft', approvalStatus: 'pending', published: false,
        ownerScheduleReference: schedule.reference,
        sourceNote: 'Dates and seminar assignments supplied by the owner. Venue supplied by the owner; no booking checks or payment approval inferred.',
      }, before ?? {});
      if (before) store.save('dates', record);
      else store.db.prepare('INSERT INTO dates(id,data) VALUES (?,?)').run(record.id, JSON.stringify(record));
      store.audit('date.owner-scheduled', record.id, { reference: schedule.reference, date: item.date, seminarId: item.seminarId });
      dates.push({ date: item.date, seminarId: item.seminarId, changed: true });
    }
    return { applied: true, dates };
  });
}
