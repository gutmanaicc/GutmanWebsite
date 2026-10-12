import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { DurableCommerceRepository, validateSnapshot, MAX_SNAPSHOT_BYTES, MAX_SNAPSHOT_ROWS } from '../server/durable-commerce.mjs';

const NOW=Date.parse('2026-10-12T09:00:00Z');
const SECRET='durable-orders-signing-secret-at-least-32-characters';
const OPTIONS={mode:'morning',orderSecret:SECRET,bookingTermsApproved:true,adapter:{ready:true}};
class Backend {
  record=null; writes=0; reads=0; conflicts=0;
  async read() {this.reads++;await Promise.resolve();return this.record?structuredClone(this.record):null;}
  async write(snapshot,{etag}) {
    await new Promise(resolve=>setImmediate(resolve));
    if((etag===null&&this.record)||(etag!==null&&this.record?.etag!==etag)){
      this.conflicts++;const error=new Error('CAS conflict');error.code=etag===null?'ALREADY_EXISTS':'PRECONDITION_FAILED';throw error;
    }
    this.record={snapshot:structuredClone(snapshot),etag:`etag-${++this.writes}`};return {etag:this.record.etag};
  }
}
const repo=(backend,options={})=>new DurableCommerceRepository({backend,storeOptions:OPTIONS,clock:()=>NOW,...options});
const orderBody=(dateId,index=0,extra={})=>({dateId,customer:{name:`משתתף ${index}`,email:`private-buyer-${index}@example.test`,phone:'0501234567'},termsAccepted:true,...extra});
async function initialize(repository) {return repository.run(store=>{const date=store.dates(true)[0];return store.approveDate(date.id,{checksConfirmed:true,publish:true,openRegistration:true});});}
const event=order=>({id:`evt-${order.orderId}`,orderId:order.orderId,type:'succeeded',transactionId:`txn-${order.orderId}`,amountAgorot:order.totalAgorot,currency:'ILS',provider:'morning'});
const rejectsCode=(promise,code)=>assert.rejects(promise,error=>error.code===code);

test('missing state initializes once, restarts preserve private order state, unchanged reads avoid writes',async()=>{
  const backend=new Backend();const first=repo(backend);
  const transient=await first.read(store=>store.dates(true));assert.equal(transient.length,10);assert.equal(backend.writes,0);
  const date=await initialize(first);assert.equal(backend.writes,1);
  const created=await first.run(store=>store.createOrder(orderBody(date.id),'stable-key'));
  assert.equal(backend.writes,2);assert.equal(created.simulation,false);
  const restarted=repo(backend);const again=await restarted.run(store=>store.createOrder(orderBody(date.id),'stable-key'));
  assert.deepEqual(again,created);assert.equal(backend.writes,2);
  const publicResult=await restarted.read(store=>store.authorizedOrder(created.orderId,created.orderAccessToken));
  assert.equal(publicResult.status,'pending');assert.equal(backend.writes,2);
  const catalog=await restarted.read(store=>({dates:store.dates(),commerce:store.commerce}));
  const text=JSON.stringify(catalog);assert.ok(!text.includes('private-buyer'));assert.ok(!text.includes('stable-key'));assert.ok(!text.includes('access_hash'));assert.ok(!text.includes(SECRET));
  const returned=await restarted.read(store=>({date:store.dates()[0]}));returned.date.venue='client mutation';assert.notEqual((await restarted.read(store=>store.dates()[0])).venue,'client mutation');
});

test('persistent provider claims execute once across repositories and ambiguous outcomes preserve held seat',async()=>{
  const backend=new Backend();const first=repo(backend);const date=await initialize(first);
  const order=await first.run(store=>store.createOrder(orderBody(date.id),'claim-key'));
  const claims=await Promise.all(Array.from({length:12},()=>repo(backend).run(store=>store.claimCheckout(order.orderId))));
  assert.equal(claims.filter(value=>value.claimed).length,1);assert.ok(backend.conflicts>0);
  const restarted=repo(backend);await restarted.run(store=>store.checkoutFailed(order.orderId,{unknown:true}));
  assert.equal((await restarted.run(store=>store.claimCheckout(order.orderId))).claimed,false);
  assert.equal((await restarted.read(store=>store.dates()[0])).pendingCount,1);
  const ready=await restarted.run(store=>store.completeCheckout(order.orderId,{providerLinkId:'provider-link-private',checkoutUrl:'https://provider.example/hosted',expiresAt:new Date(NOW+600_000).toISOString()}));
  assert.equal(ready.checkoutUrl,'https://provider.example/hosted');assert.ok(!('providerLinkId' in ready));
  assert.equal((await repo(backend).read(store=>store.authorizedOrder(order.orderId,order.orderAccessToken))).checkoutUrl,ready.checkoutUrl);
});

test('CAS retries keep coupon caps and duplicate verified payment atomic across independent requests',async()=>{
  const backend=new Backend();const repository=repo(backend);const date=await initialize(repository);
  await repository.run(store=>store.createCoupon({code:'CASCOUPON',type:'percentage',value:20,maxRedemptions:2,active:true,perCustomerLimit:1}));
  const orders=await Promise.allSettled(Array.from({length:12},(_,index)=>repo(backend).run(store=>store.createOrder(orderBody(date.id,index,{couponCode:'CASCOUPON'}),`coupon-key-${index}`))));
  assert.equal(orders.filter(value=>value.status==='fulfilled').length,2);assert.equal(orders.filter(value=>value.status==='rejected'&&value.reason.code==='COUPON_LIMIT').length,10);
  const order=orders.find(value=>value.status==='fulfilled').value;
  const payments=await Promise.all(Array.from({length:12},()=>repo(backend).run(store=>store.processVerifiedEvent(event(order)))));
  assert.ok(payments.every(result=>result.status==='paid'));
  const state=await repo(backend).read(store=>({registrations:store.all('registrations'),outbox:store.all('outbox'),date:store.dates()[0]}));
  assert.equal(state.registrations.length,1);assert.equal(state.outbox.length,5);assert.equal(state.date.paidCount,1);
});

test('24 separate workers compete against a shared fake CAS backend and exactly12 seats are held',async t=>{
  const backend=new Backend();const date=await initialize(repo(backend));
  const moduleUrl=new URL('../server/durable-commerce.mjs',import.meta.url).href;
  const source=`import {parentPort,workerData} from 'node:worker_threads';import {DurableCommerceRepository} from ${JSON.stringify(moduleUrl)};let nextId=0;const pending=new Map();parentPort.on('message',message=>{if(message.reply){const current=pending.get(message.reply);pending.delete(message.reply);if(message.error){const e=new Error(message.error.code);e.code=message.error.code;current.reject(e);}else current.resolve(message.value);}});const rpc=(method,payload)=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});parentPort.postMessage({rpc:id,method,payload});});const backend={read:()=>rpc('read'),write:(snapshot,options)=>rpc('write',{snapshot,options})};const repo=new DurableCommerceRepository({backend,storeOptions:workerData.options,clock:()=>workerData.now});parentPort.postMessage({ready:true});parentPort.once('message',async message=>{if(!message.start)return;try{const result=await repo.run(store=>store.createOrder(workerData.body,workerData.key));parentPort.postMessage({done:true,ok:true,result});}catch(error){parentPort.postMessage({done:true,ok:false,code:error.code});}});`;
  const workers=Array.from({length:24},(_,index)=>new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`),{workerData:{options:OPTIONS,now:NOW,body:orderBody(date.id,index),key:`worker-key-${index}`}}));
  t.after(()=>Promise.all(workers.map(worker=>worker.terminate())));
  const ready=[];const finished=[];
  for(const worker of workers){
    ready.push(new Promise((resolve,reject)=>{worker.on('message',message=>{if(message.ready)resolve();});worker.once('error',reject);}));
    finished.push(new Promise((resolve,reject)=>{worker.on('message',message=>{if(message.done)resolve(message);});worker.once('error',reject);}));
    worker.on('message',async message=>{
      if(!message.rpc)return;
      try {const value=message.method==='read'?await backend.read():await backend.write(message.payload.snapshot,message.payload.options);worker.postMessage({reply:message.rpc,value});}
      catch(error){worker.postMessage({reply:message.rpc,error:{code:error.code}});}
    });
  }
  await Promise.all(ready);workers.forEach(worker=>worker.postMessage({start:true}));const results=await Promise.all(finished);
  assert.equal(results.filter(value=>value.ok).length,12);assert.equal(results.filter(value=>value.code==='FULLY_BOOKED').length,12);
  const view=await repo(backend).read(store=>store.dates()[0]);assert.equal(view.pendingCount,12);assert.equal(view.remainingCapacity,0);assert.ok(backend.conflicts>0);
});

test('declared async callbacks, Promise results and uncloneable results never persist changes',async()=>{
  const backend=new Backend();const repository=repo(backend);let called=false;
  await rejectsCode(repository.run(async()=>{called=true;}),'SYNC_OPERATION_REQUIRED');assert.equal(called,false);assert.equal(backend.reads,0);
  await rejectsCode(repository.run(store=>{store.createDate({seminarId:'social-media-ai',date:'2026-12-01',venue:'בדיקה'});return Promise.resolve('not safe');}),'SYNC_OPERATION_REQUIRED');assert.equal(backend.writes,0);
  await rejectsCode(repository.run(()=>()=>{}),'INVALID_OPERATION_RESULT');assert.equal(backend.writes,0);
  await rejectsCode(repository.read(async()=>{}),'SYNC_OPERATION_REQUIRED');assert.equal(backend.writes,0);
});

test('malformed version/schema/JSON/unique constraints fail closed without resetting or overwriting',async()=>{
  const backend=new Backend();await initialize(repo(backend));const valid=structuredClone(backend.record);
  const modifications=[snapshot=>{snapshot.version=2;},snapshot=>{delete snapshot.tables.orders;},snapshot=>{snapshot.tables.evil=[];},snapshot=>{snapshot.tables.dates[0].data='{bad-json';},snapshot=>{snapshot.tables.dates[0].data=JSON.stringify({...JSON.parse(snapshot.tables.dates[0].data),capacity:999});},snapshot=>{snapshot.tables.dates.push(structuredClone(snapshot.tables.dates[0]));}];
  for(const mutate of modifications){backend.record=structuredClone(valid);mutate(backend.record.snapshot);const writes=backend.writes;await rejectsCode(repo(backend).run(store=>store.summary()),'INVALID_SNAPSHOT');assert.equal(backend.writes,writes);}
  backend.record=structuredClone(valid);const date=JSON.parse(backend.record.snapshot.tables.dates[0].data);
  const order=await repo(backend).run(store=>store.createOrder(orderBody(date.id),'unique-key'));
  const row=structuredClone(backend.record.snapshot.tables.orders[0]);row.id='another-order';row.data=JSON.stringify({...JSON.parse(row.data),id:row.id});backend.record.snapshot.tables.orders.push(row);
  await rejectsCode(repo(backend).run(store=>store.dates()),'INVALID_SNAPSHOT');assert.ok(order.orderId);
});

test('size and row bounds reject oversized snapshots and oversized mutations without writing',async()=>{
  const backend=new Backend();await initialize(repo(backend));const original=structuredClone(backend.record);const writes=backend.writes;
  await rejectsCode(repo(backend).run(store=>{const date=store.get('dates',store.dates(true)[0].id);date.sourceNote='x'.repeat(MAX_SNAPSHOT_BYTES);store.save('dates',date);return null;}),'INVALID_SNAPSHOT');assert.equal(backend.writes,writes);assert.deepEqual(backend.record,original);
  const large=structuredClone(original.snapshot);large.tables.audit_events=Array.from({length:MAX_SNAPSHOT_ROWS},(_,index)=>({id:`a-${index}`,data:JSON.stringify({id:`a-${index}`,action:'test',entityId:'date',actor:'system',detail:{},createdAt:new Date(NOW).toISOString()})}));assert.throws(()=>validateSnapshot(large),error=>error.code==='INVALID_SNAPSHOT');
});

test('CAS conflicts are bounded; other write errors propagate without exposing uncommitted results',async()=>{
  let calls=0;const backend={read:async()=>null,write:async()=>{calls++;const error=new Error('conflict');error.code='ALREADY_EXISTS';throw error;}};
  await rejectsCode(repo(backend,{maxAttempts:3}).run(store=>store.dates()),'CAS_RETRY_EXHAUSTED');assert.equal(calls,3);
  const broken={read:async()=>null,write:async()=>{const error=new Error('storage outage');error.code='STORAGE_UNAVAILABLE';throw error;}};
  await rejectsCode(repo(broken).run(store=>store.dates()),'STORAGE_UNAVAILABLE');
});
