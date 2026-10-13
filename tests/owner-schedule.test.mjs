import test from 'node:test';
import assert from 'node:assert/strict';
import schedule from '../shared/academy-owner-schedule.json' with { type: 'json' };
import { CommerceStore } from '../server/commerce.mjs';
import { applyOwnerSchedule, approveOwnerSchedule } from '../server/owner-schedule.mjs';
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
test('explicit owner approval opens exactly six dates once and preserves unrelated drafts and disabled commerce',t=>{
 const store=setup(t);applyOwnerSchedule(store,schedule,{apply:true});const unrelated=store.all('dates').filter(d=>d.date.startsWith('2026-11'));
 assert.throws(()=>approveOwnerSchedule(store,schedule),/Explicit approval/);assert.equal(store.dates().length,0);
 assert.equal(approveOwnerSchedule(store,schedule,{ownerApproved:true}).dates.filter(d=>d.changed).length,6);assert.equal(store.dates().length,6);assert.ok(store.dates().every(d=>d.status==='open_for_registration'&&d.approvalStatus==='approved'&&d.capacity===12&&d.minimumParticipants===8));
 assert.equal(store.commerce.ready,false);assert.deepEqual(store.all('dates').filter(d=>d.date.startsWith('2026-11')),unrelated);const audit=store.all('audit_events');assert.equal(audit.filter(e=>e.action==='terms.owner-approved').length,1);
 assert.ok(approveOwnerSchedule(store,schedule,{ownerApproved:true}).dates.every(d=>!d.changed));assert.deepEqual(store.all('audit_events'),audit);
});
test('date approval rolls back the entire schedule and audit if one date differs from the owner-approved venue',t=>{
 const store=setup(t);applyOwnerSchedule(store,schedule,{apply:true});const last=store.all('dates').find(d=>d.date==='2026-10-29');last.venue='Different location';store.save('dates',last);const before=store.all('dates'),audit=store.all('audit_events');
 assert.throws(()=>approveOwnerSchedule(store,schedule,{ownerApproved:true}),/exact prepared/);assert.deepEqual(store.all('dates'),before);assert.deepEqual(store.all('audit_events'),audit);
});
