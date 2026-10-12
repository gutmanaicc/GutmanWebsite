import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { CommerceStore, config, jerusalemStart } from '../server/commerce.mjs';
import { createAcademyServer } from '../server/http.mjs';
import { MorningGrowAdapter } from '../server/payment-adapters.mjs';

const NOW = Date.parse('2026-10-12T09:00:00Z');
const SECRET='test-simulation-secret-at-least-32-characters';
const ADMIN='test-admin-secret-at-least-32-characters';
function setup(t,options={}) {
  let now=NOW;
  const store=new CommerceStore({clock:()=>now,mode:'simulation',development:true,simulationSecret:SECRET,bookingTermsApproved:true,...options});
  t.after(()=>store.close());store.seedDrafts();
  const draft=store.dates(true)[0];
  const date=store.approveDate(draft.id,{checksConfirmed:true,publish:true,openRegistration:true});
  return {store,date,advance:ms=>{now+=ms;},setTime:value=>{now=value;}};
}
const payload=(dateId,index=0,extra={})=>({dateId,customer:{name:`משתתף ${index}`,email:`person${index}@example.test`,phone:'0501234567'},termsAccepted:true,...extra});
const order=(store,date,index=0,extra={})=>store.createOrder(payload(date.id,index,extra),`checkout-key-${index}`);
function event(store,created,overrides={}) {
  const data={id:`event-${created.orderId}`,orderId:created.orderId,type:'succeeded',transactionId:`tx-${created.orderId}`,amountAgorot:created.totalAgorot,currency:'ILS',...overrides};
  const raw=JSON.stringify(data);const timestamp=String(store.clock());
  return {raw,headers:{'x-academy-timestamp':timestamp,'x-academy-signature':store.adapter.sign(raw,timestamp)}};
}
const consume=(store,signed)=>store.processSignedEvent(signed.raw,signed.headers);
const code=(expected,fn)=>assert.throws(fn,error=>error.code===expected);

test('central prices are final ILS consumer totals, no VAT added, live integration fails closed',t=>{
  const {store,date}=setup(t);
  assert.equal(config.launchPriceAgorot,119000);assert.equal(config.regularPriceAgorot,149000);assert.equal(config.tax.calculationMode,'none');
  assert.equal(store.quote({dateId:date.id}).totalAgorot,119000);config.activePrice='regular';try{assert.equal(store.quote({dateId:date.id}).totalAgorot,149000);}finally{config.activePrice='launch';}
  assert.equal(new MorningGrowAdapter().ready,false);assert.throws(()=>new MorningGrowAdapter().verifyWebhook(),/not configured/);
  assert.throws(()=>new CommerceStore({mode:'simulation',development:false,simulationSecret:SECRET}),/development/);
});

test('draft source dates remain private; approvals, future dates and Jerusalem DST hours are enforced',t=>{
  const {store,date,setTime}=setup(t);
  assert.equal(store.dates(true).length,10);assert.equal(store.dates().length,1);
  const draft=store.dates(true)[1];code('DATE_UNAVAILABLE',()=>order(store,draft,1));
  code('APPROVAL_CHECKS_REQUIRED',()=>store.approveDate(draft.id,{}));
  assert.equal(date.startTime,'15:00');assert.equal(date.endTime,'20:00');assert.equal(date.minimumParticipants,8);assert.equal(date.capacity,12);
  assert.equal(new Date(jerusalemStart('2026-10-22')).toISOString(),'2026-10-22T12:00:00.000Z');
  assert.equal(new Date(jerusalemStart('2026-10-29')).toISOString(),'2026-10-29T13:00:00.000Z');
  code('INVALID_DATE',()=>jerusalemStart('2026-02-31'));
  code('DATE_CONFLICT',()=>store.createDate({seminarId:'ai-video-content',date:date.date,venue:'מקום בדיקה'}));
  code('PAST_DATE',()=>store.createDate({seminarId:'ai-video-content',date:'2026-10-01',venue:'מקום בדיקה'}));
  store.updateDate(date.id,{status:'registration_closed'});code('DATE_UNAVAILABLE',()=>order(store,date));
  setTime(jerusalemStart(date.date)+1);assert.equal(store.dates().length,0);
});

test('minimum enrollment review requires an owner decision without cancelling dates',t=>{
  const {store,date,setTime}=setup(t);
  setTime(jerusalemStart(date.date)-47*3_600_000);
  assert.equal(store.dateView(date).requiresMinimumEnrollmentDecision,true);
  assert.equal(store.get('dates',date.id).status,'open_for_registration');
  assert.ok(store.all('audit_events').some(event=>event.action==='date.approved'));
});

test('date material edits reset approval and refuse modifications with customer obligations',t=>{
  const {store,date}=setup(t);
  let updated=store.updateDate(date.id,{venue:'מיקום אחר לבדיקה'});
  assert.equal(updated.approvalStatus,'pending');assert.equal(updated.published,false);
  store.approveDate(date.id,{checksConfirmed:true,publish:true,openRegistration:true});order(store,date);
  code('EXISTING_OBLIGATIONS',()=>store.updateDate(date.id,{date:'2026-12-01'}));
  code('EXISTING_OBLIGATIONS',()=>store.rejectDate(date.id,{}));
  code('INVALID_INPUT',()=>store.updateDate(date.id,{capacity:13}));
});

test('valid registration and scoped token; idempotent retries share one hold and changed requests conflict',t=>{
  const {store,date}=setup(t);
  const first=order(store,date);const second=order(store,date);
  assert.deepEqual(second,first);assert.equal(store.dateView(date).pendingCount,1);
  code('IDEMPOTENCY_CONFLICT',()=>store.createOrder(payload(date.id,99),'checkout-key-0'));
  assert.equal(store.authorizedOrder(first.orderId,first.orderAccessToken).customer.email,'person0@example.test');
  code('UNAUTHORIZED',()=>store.authorizedOrder(first.orderId,'invalid-token'));
  code('TERMS_REQUIRED',()=>order(store,date,2,{termsAccepted:false}));
  code('INVALID_INPUT',()=>store.createOrder({dateId:date.id,termsAccepted:true},'missing-customer'));
  code('INSTALLMENTS_UNAVAILABLE',()=>order(store,date,3,{installments:6}));
});

test('default-disabled and unapproved legal configuration block orders',t=>{
  const {store,date}=setup(t,{bookingTermsApproved:false});
  assert.equal(store.commerce.ready,false);code('PAYMENT_UNAVAILABLE',()=>order(store,date));
  const disabled=new CommerceStore({clock:()=>NOW});t.after(()=>disabled.close());
  assert.equal(disabled.commerce.mode,'disabled');code('PAYMENT_UNAVAILABLE',()=>disabled.createOrder({},'key'));
});

test('verified payment is required, repeated webhook yields one enrollment and one outbox set',t=>{
  const {store,date}=setup(t);const created=order(store,date);const signed=event(store,created);
  code('INVALID_SIGNATURE',()=>store.processSignedEvent(signed.raw,{'x-academy-signature':'0'.repeat(64),'x-academy-timestamp':String(NOW)}));
  code('INVALID_SIGNATURE',()=>store.processSignedEvent(signed.raw,{'x-academy-signature':signed.headers['x-academy-signature'],'x-academy-timestamp':String(NOW-400_000)}));
  assert.equal(store.all('registrations').length,0);
  assert.equal(consume(store,signed).status,'paid');assert.equal(consume(store,signed).duplicate,true);
  assert.equal(consume(store,event(store,created,{id:'another-callback-same-tx'})).duplicate,true);assert.equal(store.all('registrations').length,1);assert.equal(store.all('outbox').length,5);assert.equal(store.dateView(date).paidCount,1);assert.equal(store.dateView(date).pendingCount,0);
  const mismatch=event(store,created,{amountAgorot:1});code('EVENT_CONFLICT',()=>consume(store,mismatch));
  const other=order(store,date,1);code('TRANSACTION_CONFLICT',()=>consume(store,event(store,other,{transactionId:`tx-${created.orderId}`})));
  code('PAYMENT_AMOUNT_MISMATCH',()=>consume(store,event(store,other,{amountAgorot:1})));
  assert.equal(store.revenue().netAgorot,119000);
});

test('failed payment releases hold; expired successful payment requires refund and grants no seat',t=>{
  const {store,date,advance}=setup(t);
  const failed=order(store,date);assert.equal(store.simulationPay(failed.orderId,failed.orderAccessToken,'failed').status,'failed');assert.equal(store.dateView(date).pendingCount,0);
  const expired=order(store,date,1);advance(16*60_000);assert.equal(store.expireHolds(),1);assert.equal(store.get('orders',expired.orderId).status,'expired');assert.equal(order(store,date,1).status,'expired');
  assert.equal(consume(store,event(store,expired)).status,'refund_required');assert.equal(store.all('registrations').length,0);assert.equal(store.dateView(date).paidCount,0);
  assert.equal(store.all('outbox')[0].kind,'payment_review');
  assert.equal(store.refundOrder(expired.orderId).status,'refunded');
});

test('capacity and minimum depend on verified paid registrations, refunds release seat',t=>{
  const {store,date,setTime}=setup(t);
  for(let index=0;index<12;index++){const created=order(store,date,index);consume(store,event(store,created));}
  assert.equal(store.dateView(date).minimumEnrollmentMet,true);assert.equal(store.all('outbox').filter(item=>item.kind==='minimum_reached').length,1);assert.equal(store.dateView(date).remainingCapacity,0);assert.equal(store.dateView(date).status,'fully_booked');
  code('FULLY_BOOKED',()=>order(store,date,13));
  const first=store.all('orders')[0];store.refundOrder(first.id);store.refundOrder(first.id);
  assert.equal(store.dateView(date).remainingCapacity,1);assert.equal(store.all('registrations').filter(record=>record.status==='cancelled').length,1);
  assert.equal(store.revenue().grossAgorot,12*119000);assert.equal(store.revenue().refundedAgorot,119000);assert.equal(store.revenue().netAgorot,11*119000);
  assert.equal(store.all('outbox').filter(item=>item.orderId===first.id&&item.status==='cancelled').length,5);code('SEMINAR_NOT_ENDED',()=>store.updateDate(date.id,{status:'completed'}));setTime(jerusalemStart(date.date)+5*3_600_000+1);assert.equal(store.updateDate(date.id,{status:'completed'}).status,'completed');assert.equal(store.all('registrations').filter(item=>item.status==='confirmed').length,11);
});

test('private coupons enforce types, dates, usage reservations and per-customer caps',t=>{
  const {store,date,advance}=setup(t);
  const percentage=store.createCoupon({code:'PRIVATE20',type:'percentage',value:20,maxRedemptions:2,perCustomerLimit:1,active:true});
  assert.equal(store.quote({dateId:date.id,couponCode:'private20',email:'person0@example.test'}).totalAgorot,95200);
  const created=order(store,date,0,{couponCode:'PRIVATE20'});
  code('COUPON_CUSTOMER_LIMIT',()=>order(store,date,1,{couponCode:'PRIVATE20',customer:payload(date.id).customer}));
  order(store,date,2,{couponCode:'PRIVATE20'});code('COUPON_LIMIT',()=>order(store,date,3,{couponCode:'PRIVATE20'}));
  consume(store,event(store,created));store.refundOrder(created.orderId);
  assert.equal(store.coupons().find(value=>value.id===percentage.id).totalRedemptions,1);
  advance(16*60_000);assert.equal(store.quote({dateId:date.id,couponCode:'PRIVATE20',email:'person4@example.test'}).totalAgorot,95200);code('COUPON_CUSTOMER_LIMIT',()=>store.quote({dateId:date.id,couponCode:'PRIVATE20',email:'person0@example.test'}));
  const fixed=store.createCoupon({code:'FIXED',type:'fixed',value:999999,maxRedemptions:1,active:true});
  assert.equal(store.quote({dateId:date.id,couponCode:fixed.code}).totalAgorot,0);
  code('COUPON_INVALID',()=>store.quote({dateId:date.id,couponCode:'FAKE'}));
  store.createCoupon({code:'EXPIRED',type:'fixed',value:1000,maxRedemptions:1,active:true,expiresAt:'2026-10-01T00:00:00Z'});
  code('COUPON_INVALID',()=>store.quote({dateId:date.id,couponCode:'EXPIRED'}));
  store.createCoupon({code:'FUTURE',type:'fixed',value:1000,active:true,startsAt:'2026-12-01T00:00:00Z'});code('COUPON_INVALID',()=>store.quote({dateId:date.id,couponCode:'FUTURE'}));store.createCoupon({code:'DATEONLY',type:'fixed',value:1000,active:true,dateIds:[store.dates(true)[1].id]});code('COUPON_INVALID',()=>store.quote({dateId:date.id,couponCode:'DATEONLY'}));
  store.createCoupon({code:'OTHER',type:'fixed',value:1000,active:true,seminarIds:['ai-video-content']});code('COUPON_INVALID',()=>store.quote({dateId:date.id,couponCode:'OTHER'}));
  code('INVALID_INPUT',()=>store.createCoupon({code:'OVER100',type:'percentage',value:101}));
});

test('coupon changes are revalidated at verified payment and never enroll at a changed amount',t=>{
  const {store,date}=setup(t);
  const coupon=store.createCoupon({code:'CHECKAGAIN',type:'fixed',value:1000,maxRedemptions:1,active:true});
  const created=order(store,date,0,{couponCode:coupon.code});store.updateCoupon(coupon.id,{active:false});
  assert.equal(consume(store,event(store,created)).status,'refund_required');assert.equal(store.all('registrations').length,0);
});

test('outbox retries failed adapters, recovers a lost worker lease and never sends by default',async t=>{
  const {store,date,advance}=setup(t);const created=order(store,date);consume(store,event(store,created));
  assert.ok(store.all('outbox').every(item=>item.status==='pending'));
  await store.drainOutbox(async()=>{throw new Error('sensitive provider failure');});
  assert.equal(store.all('outbox').filter(item=>item.status==='failed').length,3);
  assert.ok(store.all('outbox').every(item=>!String(item.lastError).includes('sensitive')));
  advance(121_000);let delivered=0;await store.drainOutbox(async(_payload,meta)=>{assert.ok(meta.idempotencyKey);delivered++;});assert.equal(delivered,3);
  const reminder=store.all('outbox').find(item=>item.kind==='reminder');reminder.status='processing';reminder.nextAttemptAt=new Date(store.clock()-1).toISOString();store.save('outbox',reminder);
  await store.drainOutbox(async()=>{delivered++;});assert.equal(store.get('outbox',reminder.id).status,'sent');
  code('MESSAGE_NOT_RETRYABLE',()=>store.retryOutbox(reminder.id));
});

test('SQLite holds survive reopen and concurrent writers cannot oversell 12 seats',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'academy-commerce-'));const path=join(dir,'db.sqlite');t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const store=new CommerceStore({path,clock:()=>NOW,mode:'simulation',development:true,simulationSecret:SECRET,bookingTermsApproved:true});store.seedDrafts();const date=store.approveDate(store.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});store.close();
  const moduleUrl=new URL('../server/commerce.mjs',import.meta.url).href;
  const source=`import {parentPort,workerData} from 'node:worker_threads';import {CommerceStore} from ${JSON.stringify(moduleUrl)};const store=new CommerceStore({...workerData.options,clock:()=>workerData.now});parentPort.postMessage('ready');parentPort.once('message',()=>{try{const order=store.createOrder(workerData.body,workerData.key);parentPort.postMessage({ok:true,order});}catch(error){parentPort.postMessage({ok:false,code:error.code});}finally{store.close();}});`;
  const workers=Array.from({length:24},(_,index)=>new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`),{workerData:{options:{path,mode:'simulation',development:true,simulationSecret:SECRET,bookingTermsApproved:true},now:NOW,body:payload(date.id,index),key:`parallel-${index}`}}));
  t.after(()=>Promise.all(workers.map(worker=>worker.terminate())));
  await Promise.all(workers.map(worker=>new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);})));
  const results=workers.map(worker=>new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);}));workers.forEach(worker=>worker.postMessage('start'));
  const settled=await Promise.all(results);assert.equal(settled.filter(item=>item.ok).length,12);assert.equal(settled.filter(item=>item.code==='FULLY_BOOKED').length,12);
  const reopened=new CommerceStore({path,clock:()=>NOW,mode:'simulation',development:true,simulationSecret:SECRET,bookingTermsApproved:true});t.after(()=>reopened.close());
  assert.equal(reopened.dateView(reopened.get('dates',date.id)).pendingCount,12);assert.equal(reopened.dateView(reopened.get('dates',date.id)).remainingCapacity,0);
  const next=reopened.approveDate(reopened.dates(true)[1].id,{checksConfirmed:true,publish:true,openRegistration:true});const coupon=reopened.createCoupon({code:'RACECAP',type:'percentage',value:20,maxRedemptions:2,active:true});
  const couponWorkers=Array.from({length:12},(_,index)=>new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`),{workerData:{options:{path,mode:'simulation',development:true,simulationSecret:SECRET,bookingTermsApproved:true},now:NOW,body:payload(next.id,index,{couponCode:coupon.code}),key:`coupon-parallel-${index}`}}));
  t.after(()=>Promise.all(couponWorkers.map(worker=>worker.terminate())));await Promise.all(couponWorkers.map(worker=>new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);})));const couponResults=couponWorkers.map(worker=>new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);}));couponWorkers.forEach(worker=>worker.postMessage('start'));const discounts=await Promise.all(couponResults);assert.equal(discounts.filter(item=>item.ok).length,2);assert.equal(discounts.filter(item=>item.code==='COUPON_LIMIT').length,10);
});

test('HTTP APIs hide drafts and private data, authenticate admin/scoped simulation, reject foreign origins',async t=>{
  const {store,date}=setup(t);const server=createAcademyServer({store,adminToken:ADMIN});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}/api/academy`;
  let response=await fetch(`${base}/catalog`);let data=await response.json();assert.equal(data.dates.length,1);assert.equal(data.commerce.mode,'simulation');assert.ok(!JSON.stringify(data).includes('person0'));assert.ok(!JSON.stringify(data.dates).includes('drive.google'));assert.ok(!('source' in data.dates[0]));
  assert.equal((await fetch(`${base}/admin/summary`)).status,401);assert.equal((await fetch(`${base}/admin/summary`,{headers:{authorization:`Bearer ${'é'.repeat(ADMIN.length)}`}})).status,401);
  assert.equal((await fetch(`${base}/admin/summary`,{headers:{authorization:`Bearer ${ADMIN}`}})).status,200);
  assert.equal((await fetch(`${base}/admin/dates`,{method:'POST',headers:{authorization:`Bearer ${ADMIN}`,origin:'https://foreign.example','content-type':'application/json'},body:'{}'})).status,403);
  response=await fetch(`${base}/orders`,{method:'POST',headers:{'content-type':'application/json','idempotency-key':'http-order'},body:JSON.stringify(payload(date.id))});assert.equal(response.status,201);data=await response.json();
  assert.equal((await fetch(`${base}/orders/${data.orderId}`)).status,401);
  assert.equal((await fetch(`${base}/simulation/pay`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({orderId:data.orderId})})).status,401);
  response=await fetch(`${base}/simulation/pay`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${data.orderAccessToken}`},body:JSON.stringify({orderId:data.orderId})});assert.equal((await response.json()).status,'paid');
  assert.equal((await fetch(`${base}/private-coupons`)).status,404);
});
