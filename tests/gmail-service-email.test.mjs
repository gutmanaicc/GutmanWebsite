import test from 'node:test';
import assert from 'node:assert/strict';
import { CommerceStore } from '../server/commerce.mjs';
import { SelfHostedRepository } from '../server/self-hosted-runtime.mjs';
import { DurableOutboxWorker } from '../server/durable-outbox-worker.mjs';
import { GmailMakeDeliveryAdapter, buildGmailMime } from '../server/gmail-make-delivery-adapter.mjs';
import { buildMessage } from '../server/message-templates.mjs';
import { buildOrderLegalSnapshot } from '../server/legal-documents.mjs';
const NOW=Date.parse('2026-10-13T10:00:00Z');
const URL='https://hook.us2.make.com/abcdefghijklmnopqrstuvwx12345678';
const SENDER='sender@example.test';
const OPTIONS={webhookUrl:URL,sender:SENDER,enabled:true,senderVerified:true};
function fixture(t,fetchImpl){let now=NOW;const store=new CommerceStore({clock:()=>now,mode:'morning',adapter:{ready:true},orderSecret:'mock-only-order-secret-at-least-32-characters',bookingTermsApproved:true,publicOrigin:'https://academy.example.test'});t.after(()=>store.close());store.seedDrafts();const date=store.approveDate(store.dates(true)[0].id,{checksConfirmed:true,publish:true,openRegistration:true});const created=store.createOrder({dateId:date.id,termsAccepted:true,customer:{name:'Participant test',email:'buyer@example.test',phone:'0500000000'}},'gmail-service-order');store.processVerifiedEvent({id:'mock-proof',orderId:created.orderId,transactionId:'mock-receipt',provider:'morning',type:'succeeded',amountAgorot:119000,currency:'ILS'});const adapter=new GmailMakeDeliveryAdapter({...OPTIONS,fetchImpl});const repo=new SelfHostedRepository(store);const worker=new DurableOutboxWorker({repository:repo,adapter,clock:()=>now});return{store,date,created,worker,adapter,repo,advance:ms=>now+=ms,item:()=>store.all('outbox').find(x=>x.kind==='preparation')};}
const accepted=body=>new Response(JSON.stringify({accepted:true,deliveryKey:body.deliveryKey,to:body.to,sender:body.sender,messageId:'18f012345678abcd'}),{headers:{'content-type':'application/json'}});

test('service templates disclose original costs, date, venue and navigation; HTML escapes input and includes no tracking or promotion',()=>{
  for(const seminarId of ['social-media-ai','ai-video-content','ai-business-owners']){
    const date={id:'date',seminarId,date:'2026-10-20',startTime:'15:00',endTime:'20:00',venue:'הטרמינל לעיצוב, אהוד קינמון 32, בת ים',capacity:12,minimumParticipants:8};
    const order={id:'test-order',customer:{name:'<script>unsafe</script>',email:'buyer@example.test'},totalAgorot:119000,currency:'ILS',holdExpiresAt:new Date(NOW).toISOString()};
    order.legalSnapshot=buildOrderLegalSnapshot(order,date,{businessName:'Test',registrationNumber:'123456789',postalAddress:'Test 1',taxStatus:'exempt',email:'support@example.test',phone:'0500000000'},new Date(NOW).toISOString());
    order.legalSnapshot.commercial.text='ORIGINAL_DISCLOSED_COSTS';
    for(const kind of ['preparation','reminder']){
      const m=buildMessage(kind,order,date,{publicOrigin:'https://academy.example.test'});
      assert.ok(m.text.includes('ORIGINAL_DISCLOSED_COSTS'));assert.ok(m.text.includes('15:00-20:00'));assert.ok(m.text.includes('waze.com'));
      assert.ok(m.html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));assert.ok(!m.html.includes('<script>unsafe'));
      assert.ok(!/<img|facebook|google-analytics|tracking/i.test(m.html));assert.ok(!m.text.includes('מחר'));
      if(kind==='preparation')assert.ok(m.attachments[0].content.includes('מסמך פרטי העסקה'));else assert.equal(m.attachments,undefined);
    }
  }
});

test('Gmail MIME keeps one recipient, Hebrew headers, text/HTML and original contract; header injection and unapproved kinds fail closed',()=>{
  const adapter=new GmailMakeDeliveryAdapter(OPTIONS);
  const payload={simulation:false,to:'buyer@example.test',subject:'מכינים אתכם לסמינר עם רון גוטמן',text:'שלום',html:'<html lang="he"><body>שלום</body></html>',attachments:[{filename:'gutman-order.html',contentType:'text/html; charset=utf-8',content:'ORIGINAL_DOC'}]};
  const mime=Buffer.from(buildGmailMime(adapter.prepare(payload,{kind:'preparation'}),'academy-outbox-test-only'),'base64url').toString();
  assert.ok(mime.includes('To: <buyer@example.test>'));assert.ok(mime.includes('Reply-To: <gutmanaicc@gmail.com>'));assert.ok(mime.includes('multipart/alternative'));assert.ok(mime.includes('filename="gutman-order.html"'));assert.ok(mime.includes(Buffer.from('ORIGINAL_DOC').toString('base64')));
  assert.equal(adapter.canDeliver('confirmation'),false);assert.equal(adapter.canDeliver('crm_registration'),false);
  for(const to of ['buyer@example.test,bad@example.test','buyer@example.test\r\nBcc: bad@example.test'])assert.throws(()=>adapter.prepare({...payload,to},{kind:'preparation'}));
  assert.throws(()=>buildGmailMime({...adapter.prepare(payload,{kind:'preparation'}),subject:'bad\r\nBcc: bad@example.test'},'academy-outbox-test-only'));
  assert.equal(new GmailMakeDeliveryAdapter({...OPTIONS,webhookUrl:'https://evil.example.test/hook'}).ready,false);
});

test('concurrent workers submit one paid service message and only exact Gmail acceptance is persisted',async t=>{
  let calls=0,ctx;
  ctx=fixture(t,async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(ctx.item().status,'processing');assert.equal(body.to,'buyer@example.test');assert.equal(body.kind,'preparation');assert.equal(options.redirect,'error');return accepted(body);});
  const second=new DurableOutboxWorker({repository:ctx.repo,adapter:ctx.adapter,clock:()=>NOW});
  const results=await Promise.all([ctx.worker.drain(),second.drain()]);assert.equal(calls,1);assert.equal(results.reduce((sum,r)=>sum+r.sent,0),1);assert.equal(ctx.item().deliveryMessageId,'18f012345678abcd');
  assert.equal(ctx.store.all('outbox').find(x=>x.kind==='reminder').status,'pending');
  assert.equal(ctx.store.all('outbox').find(x=>x.kind==='confirmation').status,'pending');
});

test('uncertain Gmail sends and crashes never replay, including after admin retry or a restarted worker',async t=>{
  let calls=0;const ctx=fixture(t,async()=>{calls++;throw Error('private network diagnostics');});
  assert.equal((await ctx.worker.drain()).failed,1);assert.equal(ctx.item().nextAttemptAt,null);assert.equal(ctx.item().lastError,'EMAIL_NETWORK_ERROR');
  ctx.store.retryOutbox(ctx.item().id);ctx.advance(600000);
  const restarted=new DurableOutboxWorker({repository:ctx.repo,adapter:ctx.adapter,clock:()=>NOW+600000});
  assert.equal((await restarted.drain()).sent,0);assert.equal(calls,1);assert.equal(ctx.item().lastError,'EMAIL_NON_REPLAYABLE_DELIVERY');
  const other=fixture(t,async()=>{assert.fail('A persisted in-flight request must not be resubmitted');});
  await other.worker.claim(other.item().id);other.advance(600000);assert.equal((await other.worker.drain()).sent,0);assert.equal(other.item().lastError,'EMAIL_NON_REPLAYABLE_DELIVERY');
});

test('a plain webhook acknowledgment is not delivery proof; simulated, cancelled or unpaid orders never send',async t=>{
  const ctx=fixture(t,async()=>new Response('Accepted'));
  assert.equal((await ctx.worker.drain()).failed,1);assert.equal(ctx.item().lastError,'EMAIL_RESULT_UNKNOWN');
  for(const change of [{status:'pending'},{status:'refunded'},{simulation:true}]){
    const noSend=fixture(t,async()=>assert.fail('Ineligible recipients must not send'));
    const order=noSend.store.get('orders',noSend.created.orderId);noSend.store.save('orders',{...order,...change});
    assert.equal((await noSend.worker.drain()).sent,0);assert.equal(noSend.item().status,'cancelled');
  }
});
