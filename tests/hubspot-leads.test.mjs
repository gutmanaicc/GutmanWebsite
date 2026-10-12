import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AcademyLeadIntake, HubSpotFormAdapter, normalizeAcademyLead } from '../server/hubspot-leads.mjs';
import { CommerceStore } from '../server/commerce.mjs';
import { createAcademyServer } from '../server/http.mjs';
const payload={fullName:'משתתף בדיקה',email:'lead-test@example.invalid',phone:'0500000000',seminarId:'social-media-ai',requestedDate:'2026-10-22',note:'מידע על התרגול',marketingConsent:false};
const key='test-key-1234567890';
function setup(t,adapter){const dir=mkdtempSync(join(tmpdir(),'academy-leads-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'leads.sqlite');const store=new AcademyLeadIntake({path,adapter});t.after(()=>store.close());return {path,store};}
test('HubSpot form contract maps all declared fields, sends no auth/tracking secrets and accepts only confirmed JSON',async()=>{
 let seen;
 const adapter=new HubSpotFormAdapter({portalId:'123456',formId:'12345678-1234-1234-1234-123456789012',publicOrigin:'https://academy.example.test',fetchImpl:async(url,options)=>{seen={url,options};return new Response(JSON.stringify({inlineMessage:'Accepted'}),{status:200});}});
 await adapter.submit(payload,'2026-10-12T12:00:00Z');
 assert.equal(seen.url,'https://api.hsforms.com/submissions/v3/integration/submit/123456/12345678-1234-1234-1234-123456789012');assert.equal(seen.options.redirect,'error');assert.equal(seen.options.headers.Authorization,undefined);
 const body=JSON.parse(seen.options.body);const fields=Object.fromEntries(body.fields.map(f=>[f.name,f.value]));assert.equal(fields.gutman_marketing_consent,'no');assert.equal(fields.gutman_lead_stage,'new');assert.equal(fields.gutman_seminar,payload.seminarId);assert.equal(fields.lastname,'בדיקה');assert.equal(body.context.hutk,undefined);assert.equal(body.context.ipAddress,undefined);
 for(const response of [new Response('html',{status:200}),new Response('{}',{status:200}),new Response('{}',{status:403})]){const failing=new HubSpotFormAdapter({portalId:'123456',formId:'12345678-1234-1234-1234-123456789012',publicOrigin:'https://academy.example.test',fetchImpl:async()=>response});await assert.rejects(failing.submit(payload,'2026-10-12T12:00:00Z'));}
});
test('concurrent lead retries forward once, retain private storage, and return the persisted acceptance after reopen',async t=>{
 let calls=0,release;const blocker=new Promise(resolve=>{release=resolve;});const {path,store}=setup(t,{submit:async()=>{calls++;await blocker;}});
 const first=store.submit(payload,key);await assert.rejects(store.submit(payload,key),e=>e.code==='LEAD_PENDING');release();const accepted=await first;assert.equal(calls,1);assert.equal(accepted.received,true);assert.equal((await store.submit(payload,key)).leadId,accepted.leadId);assert.equal(calls,1);assert.equal(statSync(path).mode&0o777,0o600);
 const reopened=new AcademyLeadIntake({path,adapter:{submit:async()=>{throw new Error('Must not replay');}}});try{assert.deepEqual(await reopened.submit(payload,key),accepted);}finally{reopened.close();}
});
test('timeout or known rejection never appears as success and never silently retries or exposes provider diagnostics',async t=>{
 let calls=0;const {store}=setup(t,{submit:async()=>{calls++;throw new Error('secret provider diagnostic');}});
 for(let i=0;i<2;i++) await assert.rejects(store.submit(payload,key),e=>e.status===503&&!e.message.includes('secret'));
 assert.equal(calls,1);assert.equal(store.db.prepare('SELECT state FROM leads').get().state,'unknown');
 await assert.rejects(store.submit({...payload,note:'changed'},key),e=>e.code==='LEAD_CONFLICT');
});
test('invalid leads, bot field, and invented dates cannot reach the provider or persist a record',async t=>{
 const {store}=setup(t,{submit:async()=>{throw new Error('Must not submit');}});
 for(const changes of [{email:'bad'},{phone:'abc'},{seminarId:'retired-course'},{marketingConsent:'true'},{requestedDate:'2026-02-31'},{website:'bot'}, {note:'x'.repeat(1001)}])await assert.rejects(store.submit({...payload,...changes},key),e=>e.code==='INVALID_LEAD');
 assert.equal(store.db.prepare('SELECT COUNT(*) AS n FROM leads').get().n,0);
});
test('lead HTTP route preserves origins, size limits and idempotency, and remains disabled without an adapter',async t=>{
 let calls=0;const {store:leads}=setup(t,{submit:async()=>{calls++;}});const commerce=new CommerceStore();t.after(()=>commerce.close());const origin='https://academy.example.test';const server=createAcademyServer({store:commerce,leadIntake:leads,allowedOrigins:[origin]});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(body,requestOrigin=origin)=>fetch(base+'/api/academy/leads',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});
 assert.equal((await request(payload,'https://foreign.example.test')).status,403);assert.equal((await request({...payload,note:'x'.repeat(17000)})).status,413);
 assert.equal((await (await fetch(base+'/api/academy/catalog')).json()).leads.ready,true);const response=await request(payload);assert.equal(response.status,200);assert.equal((await response.json()).received,true);assert.equal((await request(payload)).status,200);assert.equal(calls,1);
 assert.equal((await fetch(base+'/api/academy/leads')).status,404);
 const disabled=createAcademyServer({store:commerce,allowedOrigins:[origin]});await new Promise(resolve=>disabled.listen(0,'127.0.0.1',resolve));try{assert.equal((await fetch(`http://127.0.0.1:${disabled.address().port}/api/academy/leads`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).status,503);}finally{await new Promise(resolve=>disabled.close(resolve));}
});
