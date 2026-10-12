import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CommerceStore } from '../server/commerce.mjs';

const NOW=Date.parse('2026-10-12T09:00:00Z');
const ORDER_SECRET='separate-order-signing-secret-at-least-32-characters';
function setup(t,options={}) {
  let now=NOW;
  const store=new CommerceStore({mode:'morning',orderSecret:ORDER_SECRET,adapter:{ready:true,credentials:{clientSecret:'must-never-be-returned'}},bookingTermsApproved:true,clock:()=>now,...options});
  t.after(()=>store.close());store.seedDrafts();
  const date=store.approveDate(store.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});
  return {store,date,advance:ms=>{now+=ms;}};
}
const body=(date,index=0,extra={})=>({dateId:date.id,customer:{name:`משתתף ${index}`,email:`buyer${index}@example.test`,phone:'0501234567'},termsAccepted:true,...extra});
const create=(store,date,index=0,extra={})=>store.createOrder(body(date,index,extra),`provider-order-${index}`);
const event=(order,extra={})=>({id:`provider-event-${order.orderId}`,orderId:order.orderId,type:'succeeded',transactionId:`provider-tx-${order.orderId}`,amountAgorot:order.totalAgorot,currency:'ILS',provider:'morning',...extra});
const errorCode=(expected,fn)=>assert.throws(fn,error=>error.code===expected);

test('Morning remains unavailable with default unverified adapter or missing legal approval; order secret is separate',t=>{
  const {store,date}=setup(t,{adapter:undefined});
  assert.equal(store.commerce.ready,false);errorCode('PAYMENT_UNAVAILABLE',()=>create(store,date));
  const legal=setup(t,{bookingTermsApproved:false});assert.equal(legal.store.commerce.ready,false);errorCode('PAYMENT_UNAVAILABLE',()=>create(legal.store,legal.date));
  assert.throws(()=>new CommerceStore({mode:'morning',adapter:{ready:true},orderSecret:'short'}),/separate orderSecret/);
});

test('provider orders are pending, non-simulated and scoped, with no credentials or private provider IDs in public responses',t=>{
  const {store,date}=setup(t);const order=create(store,date);
  assert.equal(order.simulation,false);assert.equal(order.provider,'morning');assert.equal(order.status,'pending');assert.equal(order.checkoutUrl,null);
  assert.equal(store.authorizedOrder(order.orderId,order.orderAccessToken).simulation,false);
  const serial=JSON.stringify(order);assert.ok(!serial.includes('must-never-be-returned'));assert.ok(!serial.includes(ORDER_SECRET));
  assert.deepEqual(create(store,date),order);assert.equal(store.dateView(date).pendingCount,1);
  errorCode('PAYMENT_UNAVAILABLE',()=>store.simulationPay(order.orderId,order.orderAccessToken));
  errorCode('PAYMENT_UNAVAILABLE',()=>store.processSignedEvent(JSON.stringify(event(order)),{}));
  errorCode('INVALID_PAYMENT',()=>store.processVerifiedEvent(event(order,{provider:'simulation'})));
  errorCode('PAYMENT_UNAVAILABLE',()=>store.refundOrder(order.orderId));
});

test('checkout is claimed only once, stores one HTTPS link and repeats idempotently without provider details',t=>{
  const {store,date}=setup(t);const order=create(store,date);
  assert.equal(store.claimCheckout(order.orderId).claimed,true);assert.equal(store.claimCheckout(order.orderId).claimed,false);
  const result=store.completeCheckout(order.orderId,{providerLinkId:'private-provider-link',checkoutUrl:'https://checkout.provider.example/approved-link',expiresAt:new Date(NOW+60*60_000).toISOString()});
  assert.equal(result.checkoutState,'ready');assert.equal(result.checkoutUrl,'https://checkout.provider.example/approved-link');assert.equal(result.checkoutExpiresAt,order.holdExpiresAt);
  assert.ok(!('providerLinkId' in result));assert.ok(!('checkoutLeaseExpiresAt' in result));
  assert.deepEqual(create(store,date),{...result,orderAccessToken:order.orderAccessToken});
  assert.equal(store.completeCheckout(order.orderId,{providerLinkId:'private-provider-link',checkoutUrl:result.checkoutUrl,expiresAt:result.checkoutExpiresAt}).checkoutUrl,result.checkoutUrl);
  errorCode('CHECKOUT_CONFLICT',()=>store.completeCheckout(order.orderId,{providerLinkId:'different-link',checkoutUrl:'https://checkout.provider.example/other',expiresAt:result.checkoutExpiresAt}));
  errorCode('INVALID_CHECKOUT_URL',()=>store.completeCheckout(order.orderId,{providerLinkId:'private-provider-link',checkoutUrl:'http://checkout.provider.example/insecure',expiresAt:result.checkoutExpiresAt}));
});

test('persistent claims survive reopening and do not auto-retry after lease expiry or unknown timeout',t=>{
  const dir=mkdtempSync(join(tmpdir(),'provider-checkout-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'commerce.sqlite');
  let now=NOW;
  const options={path,mode:'morning',orderSecret:ORDER_SECRET,adapter:{ready:true},bookingTermsApproved:true,clock:()=>now};
  const first=new CommerceStore(options);first.seedDrafts();const date=first.approveDate(first.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});const order=create(first,date);assert.equal(first.claimCheckout(order.orderId).claimed,true);first.close();
  now+=3*60_000;const reopened=new CommerceStore(options);t.after(()=>reopened.close());
  assert.equal(reopened.claimCheckout(order.orderId).claimed,false);
  assert.equal(reopened.checkoutFailed(order.orderId,{unknown:true,reasonCode:'REMOTE_TIMEOUT'}).checkoutState,'unknown');
  assert.equal(reopened.claimCheckout(order.orderId).claimed,false);assert.equal(reopened.dateView(date).pendingCount,1);
  assert.equal(reopened.processVerifiedEvent(event(order)).status,'paid');assert.equal(reopened.all('registrations').length,1);
});

test('known creation failure retains hold until expiry and late link completion cannot return a chargeable URL',t=>{
  const {store,date,advance}=setup(t);const failed=create(store,date);store.claimCheckout(failed.orderId);
  assert.equal(store.checkoutFailed(failed.orderId,{unknown:false,reasonCode:'CREATION_FAILED'}).checkoutState,'failed');
  assert.equal(store.dateView(date).pendingCount,1);assert.equal(store.claimCheckout(failed.orderId).claimed,false);
  const late=create(store,date,1);store.claimCheckout(late.orderId);advance(16*60_000);
  const completed=store.completeCheckout(late.orderId,{providerLinkId:'late-link',checkoutUrl:'https://checkout.provider.example/late',expiresAt:new Date(NOW+60*60_000).toISOString()});
  assert.equal(completed.checkoutUrl,null);assert.equal(completed.checkoutState,'unknown');assert.equal(store.dateView(date).pendingCount,0);
  assert.equal(store.processVerifiedEvent(event(late)).status,'refund_required');assert.equal(store.all('registrations').length,0);
  assert.ok(store.all('outbox').some(item=>item.kind==='checkout_review'));
});

test('verified provider event validates amount/currency, duplicate transaction and coupon revalidation',t=>{
  const {store,date}=setup(t);const coupon=store.createCoupon({code:'PRIVATEPROVIDER',type:'percentage',value:20,maxRedemptions:2,perCustomerLimit:1,active:true});
  const order=create(store,date,0,{couponCode:coupon.code});store.claimCheckout(order.orderId);
  errorCode('PAYMENT_AMOUNT_MISMATCH',()=>store.processVerifiedEvent(event(order,{amountAgorot:1})));
  errorCode('PAYMENT_AMOUNT_MISMATCH',()=>store.processVerifiedEvent(event(order,{currency:'USD'})));
  assert.equal(store.processVerifiedEvent(event(order)).status,'paid');assert.equal(store.processVerifiedEvent(event(order)).duplicate,true);
  assert.equal(store.processVerifiedEvent(event(order,{id:'other-event-same-transaction'})).duplicate,true);assert.equal(store.all('registrations').length,1);
  assert.equal(store.all('registrations')[0].simulation,false);
  const confirmation=store.all('outbox').find(item=>item.kind==='confirmation');assert.equal(confirmation.payload.simulation,false);assert.ok(!confirmation.payload.text.includes('הדגמה'));assert.ok(!confirmation.payload.text.includes('נשלחה'));
  const other=create(store,date,1,{couponCode:coupon.code});store.claimCheckout(other.orderId);store.updateCoupon(coupon.id,{active:false});assert.equal(store.processVerifiedEvent(event(other)).status,'refund_required');assert.equal(store.all('registrations').length,1);
});

test('verified provider enrollment never oversells12 and minimum8 counts actual verified payments',t=>{
  const {store,date}=setup(t);const orders=Array.from({length:12},(_,index)=>create(store,date,index));
  errorCode('FULLY_BOOKED',()=>create(store,date,13));assert.equal(store.dateView(date).minimumEnrollmentMet,false);
  for(const order of orders){store.claimCheckout(order.orderId);assert.equal(store.processVerifiedEvent(event(order)).status,'paid');}
  assert.equal(store.dateView(date).paidCount,12);assert.equal(store.dateView(date).remainingCapacity,0);assert.equal(store.dateView(date).minimumEnrollmentMet,true);assert.equal(store.all('outbox').filter(item=>item.kind==='minimum_reached').length,1);
  assert.equal(store.revenue().simulation,false);assert.equal(store.revenue().netAgorot,12*119000);
  errorCode('FULLY_BOOKED',()=>create(store,date,14));
});
