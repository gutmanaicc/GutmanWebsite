import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';

test('documented server CLI starts with private in-memory data and payments disabled',async t=>{
 const allocation=createServer();await new Promise(resolve=>allocation.listen(0,'127.0.0.1',resolve));const port=allocation.address().port;await new Promise(resolve=>allocation.close(resolve));
 const token=randomBytes(32).toString('hex');
 const child=spawn(process.execPath,['scripts/academy-server.mjs'],{env:{...process.env,ACADEMY_PORT:String(port),ACADEMY_HOST:'127.0.0.1',ACADEMY_DB_PATH:':memory:',ACADEMY_PAYMENT_MODE:'disabled',ACADEMY_ADMIN_TOKEN:token},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill('SIGTERM'));
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server CLI startup timeout')),5000);child.stdout.on('data',chunk=>{if(String(chunk).includes('Academy API')){clearTimeout(timeout);resolve();}});child.on('exit',code=>{if(code!==0){clearTimeout(timeout);reject(new Error(`Server CLI exited ${code}`));}});});
 const catalog=await (await fetch(`http://127.0.0.1:${port}/api/academy/catalog`)).json();
 assert.equal(catalog.commerce.mode,'disabled');assert.equal(catalog.commerce.ready,false);assert.deepEqual(catalog.dates,[]);
 const dates=await (await fetch(`http://127.0.0.1:${port}/api/academy/admin/dates`,{headers:{Authorization:`Bearer ${token}`}})).json();
 assert.ok(dates.dates.every(date=>date.approvalStatus==='pending'&&date.published===false));
});
