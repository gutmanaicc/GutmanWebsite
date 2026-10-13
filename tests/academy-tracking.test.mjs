import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const local = 'http://127.0.0.1:5186';
const origin = 'https://academy.example.test';
let browser, vite;
before(async () => {
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5186','--strictPort'], { env: { ...process.env, VITE_ACADEMY_MEASUREMENT_ENABLED: '1', VITE_ACADEMY_MEASUREMENT_ORIGIN: origin }, stdio: 'ignore' });
  let ready = false;
  for (let i=0;i<150;i++) { try { if ((await fetch(local)).ok) { ready=true; break; } } catch {} await new Promise(r=>setTimeout(r,100)); }
  assert.ok(ready);
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); vite?.kill('SIGTERM'); });

test('existing tags load only after consent on the approved host; SPA views and confirmed leads emit once without form data', async () => {
  const context = await browser.newContext(); const page = await context.newPage(); const vendors=[]; let accepted=false;
  await context.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (/facebook|google-analytics|googletagmanager|clarity\.ms/.test(u.hostname)) { vendors.push(u.href); await route.fulfill({contentType:'application/javascript',body:''}); return; }
    if (u.origin !== origin && u.origin !== local) { await route.abort(); return; }
    if (u.pathname === '/api/academy/catalog') { await route.fulfill({json:{dates:[],commerce:{mode:'disabled',ready:false},pricing:{launchPriceAgorot:119000,regularPriceAgorot:149000},leads:{ready:true}}}); return; }
    if (u.pathname === '/api/academy/leads') { await route.fulfill({status:accepted?200:503,json:accepted?{ok:true,received:true}:{error:{message:'בדיקת כשל ספק'}}}); return; }
    await route.fulfill({response:await route.fetch({url:local+u.pathname+u.search})});
  });
  const calls = () => page.evaluate(() => ({meta:window.fbq?.queue??[],ga:(window.dataLayer??[]).map(row=>Array.from(row))}));
  try {
    await page.goto(origin+'/courses/social-media-ai?utm_source=instagram&utm_medium=paid-social'); await page.locator('.academy-interest-form').waitFor();
    await page.getByRole('dialog',{name:'העדפות עוגיות ומדידה'}).waitFor(); assert.deepEqual(vendors,[]);
    await page.getByRole('button',{name:'ללא מדידה אופציונלית',exact:true}).click(); assert.deepEqual(vendors,[]);
    await page.getByRole('button',{name:'העדפות עוגיות',exact:true}).click();
    await page.getByRole('button',{name:'מאשרים מדידה ופרסום',exact:true}).click();
    await page.waitForFunction(()=>window.fbq&&window.gtag&&window.clarity);
    await page.waitForFunction(()=>window.fbq.queue.some(row=>row[1]==='ViewContent'));
    let state=await calls();
    assert.equal(state.meta.filter(row=>row[1]==='PageView').length,1);
    assert.equal(state.meta.filter(row=>row[1]==='ViewContent').length,1);
    assert.equal(state.ga.filter(row=>row[0]==='event'&&row[1]==='view_item').length,1);
    assert.ok(state.meta.some(row=>row[0]==='init'&&row[1]==='1392343815914070'));
    assert.ok(state.ga.some(row=>row[0]==='config'&&row[1]==='G-HDBJY296MJ'));
    const gaConfig=state.ga.find(row=>row[0]==='config')[2];
    assert.equal(gaConfig.page_location,origin+'/courses/social-media-ai');
    assert.equal(gaConfig.campaign_source,'instagram'); assert.equal(gaConfig.campaign_medium,'paid-social');
    assert.ok(vendors.some(url=>url.includes('/tag/y8w96aifrd')));
    await page.getByLabel('שם מלא',{exact:true}).fill('בדיקת מדידה פרטית');
    await page.getByLabel('אימייל',{exact:true}).fill('tracking-person@example.invalid');
    await page.getByLabel('טלפון',{exact:true}).fill('0500000000');
    await page.getByLabel(/מה תרצו לדעת/).fill('טקסט פרטי שאינו מיועד למדידה');
    await page.getByRole('button',{name:'חזרו אליי עם פרטים',exact:true}).click();
    await page.getByRole('alert').waitFor(); state=await calls(); assert.equal(state.meta.filter(row=>row[1]==='Lead').length,0);
    accepted=true; await page.getByRole('button',{name:'חזרו אליי עם פרטים',exact:true}).click();
    await page.getByRole('heading',{name:'הפנייה שלכם נקלטה.',exact:true}).waitFor(); state=await calls();
    assert.equal(state.meta.filter(row=>row[1]==='Lead').length,1); assert.equal(state.ga.filter(row=>row[1]==='generate_lead').length,1);
    const serialized=JSON.stringify(state); for(const privateValue of ['בדיקת מדידה פרטית','tracking-person@example.invalid','0500000000','טקסט פרטי']) assert.ok(!serialized.includes(privateValue));
    await page.locator('.academy-desktop-nav').getByRole('link',{name:'הסמינרים',exact:true}).click();
    await page.waitForURL(origin+'/courses'); await page.waitForFunction(()=>window.fbq.queue.filter(row=>row[1]==='PageView').length===2);
    const safe=await page.evaluate(async()=>{const {trackAcademy}=await import('/src/lib/academy.ts');trackAcademy('lead_received',{seminar_id:'social-media-ai',email:'not-allowed',coupon:'SECRET',value:Infinity});return window.fbq.queue.at(-1);});
    assert.ok(!JSON.stringify(safe).includes('not-allowed'));assert.ok(!JSON.stringify(safe).includes('SECRET'));
    vendors.length=0; await page.goto(origin+'/register?email=private@example.invalid'); await page.locator('h1').waitFor();
    assert.deepEqual(vendors,[]); assert.equal(await page.evaluate(()=>Boolean(window.fbq||window.gtag||window.clarity)),false);
    await page.goto(local+'/courses'); await page.locator('h1').waitFor();assert.deepEqual(vendors,[]);
  } finally { await context.close(); }
});
