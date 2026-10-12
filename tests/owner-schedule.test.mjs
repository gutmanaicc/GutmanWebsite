import test from 'node:test';
import assert from 'node:assert/strict';
import schedule from '../shared/academy-owner-schedule.json' with { type: 'json' };
import { CommerceStore } from '../server/commerce.mjs';
import { applyOwnerSchedule } from '../server/owner-schedule.mjs';
const setup = t => { const store = new CommerceStore({clock:()=>Date.parse('2026-10-12T12:00:00Z')});t.after(()=>store.close());store.seedDrafts();return store; };
test('owner schedule applies atomically, preserves unrelated dates and stays unpublished',t=>{
 const store=setup(t);const unrelated=store.all('dates').filter(d=>d.date.startsWith('2026-11'));const initial=store.all('dates');
 assert.equal(applyOwnerSchedule(store,schedule).applied,false);assert.deepEqual(store.all('dates'),initial);
 const report=applyOwnerSchedule(store,schedule,{apply:true});assert.equal(report.dates.length,6);
 for(const expected of schedule.dates){const date=store.all('dates').find(d=>d.date===expected.date);assert.equal(date.seminarId,expected.seminarId);assert.equal(date.capacity,12);assert.equal(date.startTime,'15:00');assert.equal(date.endTime,'20:00');assert.equal(date.minimumParticipants,8);assert.equal(date.published,false);}
 assert.deepEqual(store.all('dates').filter(d=>d.date.startsWith('2026-11')),unrelated);assert.equal(store.dates().length,0);
 const auditCount=store.all('audit_events').length;assert.ok(applyOwnerSchedule(store,schedule,{apply:true}).dates.every(d=>!d.changed));assert.equal(store.all('audit_events').length,auditCount);
});
test('schedule rollback protects an approved date even when earlier updates could have succeeded',t=>{
 const store=setup(t);const final=store.all('dates').find(d=>d.date==='2026-10-29');store.approveDate(final.id,{checksConfirmed:true,publish:true});
 const before=store.all('dates');const audit=store.all('audit_events');assert.throws(()=>applyOwnerSchedule(store,schedule,{apply:true}),/individual review/);assert.deepEqual(store.all('dates'),before);assert.deepEqual(store.all('audit_events'),audit);
});
