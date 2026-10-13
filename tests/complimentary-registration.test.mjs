import test from 'node:test';
import assert from 'node:assert/strict';
import { CommerceStore } from '../server/commerce.mjs';
import { HostedCheckout } from '../server/hosted-checkout.mjs';
import { createAcademyServer } from '../server/http.mjs';
import { HubSpotRegistrationWorker } from '../server/hubspot-registration-worker.mjs';
import { DurableCommerceRepository } from '../server/durable-commerce.mjs';
import { DurableOutboxWorker } from '../server/durable-outbox-worker.mjs';
const NOW = Date.parse('2026-10-13T09:00:00Z');
const OPTIONS = { mode:'morning', orderSecret:'mock-only-order-secret-at-least-32-characters', bookingTermsApproved:true, adapter:{ready:true}, clock:()=>NOW };
const body = (dateId, index=0, extra={}) => ({dateId,customer:{name:'בדיקת הרשמה',email:`mock${index}@example.test`,phone:'0501234567'},termsAccepted:true,couponCode:'testfree100',...extra});
function fixture(t, extra={}) {
  const store=new CommerceStore({...OPTIONS,...extra});t.after(()=>store.close());store.seedDrafts();
  const date=store.approveDate(store.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});
  const coupon=store.createCoupon({code:'TESTFREE100',type:'percentage',value:100,maxRedemptions:100,active:true});
  return {store,date,coupon};
}
test('zero-cost HTTP registration confirms once, bypasses Morning and truthfully records seat, CRM and service messages',async t=>{
  const {store,date,coupon}=fixture(t);let providerCalls=0;
  const checkout=new HostedCheckout({store,publicOrigin:'https://gutmanai.com',adapter:{ready:true,checkoutOrigins:['https://mock.example.test'],async createCheckout(){providerCalls++;throw Error('no free payment');}}});
  const server=createAcademyServer({store,checkout,allowedOrigins:['https://gutmanai.com']});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const request=()=>fetch(`http://127.0.0.1:${server.address().port}/api/academy/orders`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://gutmanai.com','Idempotency-Key':'free-http'},body:JSON.stringify(body(date.id,0,{status:'paid',totalAgorot:0}))});
  const responses=await Promise.all([request(),request()]);assert.ok(responses.every(r=>r.status===201));const [created,repeated]=await Promise.all(responses.map(r=>r.json()));assert.deepEqual(created,repeated);
  assert.equal(created.status,'complimentary');assert.equal(created.totalAgorot,0);assert.equal(created.checkoutUrl,null);assert.equal(created.transactionId,null);assert.equal(providerCalls,0);
  assert.equal(store.all('registrations').length,1);assert.equal(store.all('payment_events').length,0);assert.equal(store.coupons()[0].totalRedemptions,1);
  const view=store.dateView(date);assert.equal(view.remainingCapacity,11);assert.equal(view.paidCount,0);assert.equal(view.complimentaryCount,1);assert.equal(view.minimumEnrollmentMet,false);assert.equal(store.revenue().grossAgorot,0);
  const message=store.all('outbox').find(row=>row.kind==='confirmation').payload;assert.match(message.text,/ללא עלות/);assert.doesNotMatch(message.text,/התשלום אומת/);assert.match(message.html,/ללא חיוב/);assert.equal(store.all('outbox').length,5);
  store.updateCoupon(coupon.id,{active:false});assert.deepEqual(store.createOrder(body(date.id),'free-http'),created,'retry survives revocation; no additional redemption');
  const calls=[];const worker=new HubSpotRegistrationWorker({store,intake:{ready:true,async submit(payload,key){calls.push({payload,key});return{leadId:'mock-lead'};}}});
  assert.equal((await worker.drain()).sent,1);assert.equal((await worker.drain()).sent,0);assert.equal(calls.length,1);assert.match(calls[0].payload.note,/לא בוצע חיוב/);assert.doesNotMatch(calls[0].payload.note,/התשלום אומת/);
  assert.throws(()=>store.processVerifiedEvent({id:'fake-paid',orderId:created.orderId,transactionId:'fake',provider:'morning',amountAgorot:0,currency:'ILS',type:'succeeded'}),e=>e.code==='PAYMENT_NOT_REQUIRED');assert.equal(store.all('payment_events').length,0);
});
test('free coupons preserve terms, disclosure, customer and usage checks; browser-supplied zero cannot bypass a paid order',t=>{
  const {store,date,coupon}=fixture(t,{requiredDisclosureVersion:'test-legal-v1'});
  assert.throws(()=>store.createOrder(body(date.id),'stale'),e=>e.code==='DISCLOSURE_CHANGED');
  assert.throws(()=>store.createOrder(body(date.id,0,{termsAccepted:false,disclosureVersion:'test-legal-v1'}),'terms'),e=>e.code==='TERMS_REQUIRED');
  assert.throws(()=>store.createOrder(body(date.id,0,{customer:{name:'x',email:'bad',phone:'123'},disclosureVersion:'test-legal-v1'}),'customer'),e=>e.code==='INVALID_CUSTOMER');
  store.updateCoupon(coupon.id,{maxRedemptions:1});store.createOrder(body(date.id,0,{disclosureVersion:'test-legal-v1'}),'one');
  assert.throws(()=>store.createOrder(body(date.id,1,{disclosureVersion:'test-legal-v1'}),'two'),e=>e.code==='COUPON_LIMIT');
  const paid=store.createOrder(body(date.id,2,{couponCode:undefined,totalAgorot:0,status:'complimentary',paymentKind:'complimentary',disclosureVersion:'test-legal-v1'}),'paid');assert.equal(paid.totalAgorot,119000);assert.equal(paid.status,'pending');assert.equal(store.all('registrations').length,1);
  assert.throws(()=>store.updateDate(date.id,{venue:'changed'}),e=>e.code==='EXISTING_OBLIGATIONS');
});
class Backend {
  record=null;writes=0;
  async read(){await Promise.resolve();return this.record&&structuredClone(this.record);}
  async write(snapshot,{etag}){await new Promise(resolve=>setImmediate(resolve));if((etag===null&&this.record)||(etag!==null&&etag!==this.record?.etag)){const error=Error('CAS');error.code=etag===null?'ALREADY_EXISTS':'PRECONDITION_FAILED';throw error;}this.record={snapshot:structuredClone(snapshot),etag:`v${++this.writes}`};return{etag:this.record.etag};}
}
test('concurrent free registrations consume at most 12 places, survive restart and produce one durable email per registration',async()=>{
  const backend=new Backend();const repo=()=>new DurableCommerceRepository({backend,clock:()=>NOW,storeOptions:OPTIONS});
  const date=await repo().run(store=>{const date=store.approveDate(store.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});store.createCoupon({code:'TESTFREE100',type:'percentage',value:100,maxRedemptions:100,active:true});return date;});
  const results=await Promise.allSettled(Array.from({length:18},(_,i)=>repo().run(store=>store.createOrder(body(date.id,i),`parallel-${i}`))));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,12);assert.ok(results.filter(r=>r.status==='rejected').every(r=>r.reason.code==='FULLY_BOOKED'));
  const snapshot=await repo().read(store=>({date:store.dateView(store.get('dates',date.id)),registrations:store.all('registrations'),outbox:store.all('outbox'),coupons:store.coupons()}));
  assert.equal(snapshot.date.remainingCapacity,0);assert.equal(snapshot.date.paidCount,0);assert.equal(snapshot.date.minimumEnrollmentMet,false);assert.equal(snapshot.registrations.length,12);assert.equal(snapshot.coupons[0].totalRedemptions,12);
  let sends=0;const adapter={ready:true,canDeliver:kind=>kind==='confirmation',prepare:payload=>({to:[payload.to],text:payload.text}),async sendRequest(payload){sends++;assert.match(payload.text,/לא בוצע חיוב/);return{provider:'mock',messageId:`mock-${sends}`};},getReadiness:()=>({ready:true})};
  const worker=new DurableOutboxWorker({repository:repo(),adapter,clock:()=>NOW});assert.equal((await worker.drain()).sent,12);assert.equal((await worker.drain()).sent,0);assert.equal(sends,12);
  // A missing committed registration cannot be used as proof merely by assigning a free status.
  const id=results.find(r=>r.status==='fulfilled').value.orderId;
  await repo().run(store=>{const reg=store.all('registrations').find(r=>r.orderId===id);reg.status='cancelled';store.save('registrations',reg);const item=store.all('outbox').find(r=>r.orderId===id&&r.kind==='preparation');item.kind='confirmation';store.save('outbox',item);});
  assert.equal((await worker.drain()).sent,0);assert.equal(sends,12);
});
