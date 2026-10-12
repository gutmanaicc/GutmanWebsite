import { randomUUID } from 'node:crypto';

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
        const exact = before.seminarId === item.seminarId && before.ownerScheduleReference === schedule.reference;
        if (exact) { dates.push({ date: item.date, seminarId: item.seminarId, changed: false }); continue; }
        const view = store.dateView(before);
        if (view.paidCount || view.pendingCount || before.approvalStatus === 'approved' || before.published) throw new Error('Published or reserved dates require individual review.');
      }
      const record = store.validateDate({
        id: before?.id ?? randomUUID(), seminarId: item.seminarId, date: item.date,
        venue: schedule.venue, capacity: 12, status: 'draft', approvalStatus: 'pending', published: false,
        ownerScheduleReference: schedule.reference,
        sourceNote: 'Dates and seminar assignments supplied by the owner. Venue details are pending; no booking or payment approval inferred.',
      }, before ?? {});
      if (before) store.save('dates', record);
      else store.db.prepare('INSERT INTO dates(id,data) VALUES (?,?)').run(record.id, JSON.stringify(record));
      store.audit('date.owner-scheduled', record.id, { reference: schedule.reference, date: item.date, seminarId: item.seminarId });
      dates.push({ date: item.date, seminarId: item.seminarId, changed: true });
    }
    return { applied: true, dates };
  });
}
