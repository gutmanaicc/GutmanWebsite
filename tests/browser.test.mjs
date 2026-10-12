import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CommerceStore } from '../server/commerce.mjs';
import { createAcademyServer } from '../server/http.mjs';
import { HostedCheckout } from '../server/hosted-checkout.mjs';

let browser, vite, server, store;
const base = 'http://127.0.0.1:5183';
const adminToken = randomBytes(32).toString('hex');
const results = [];
before(async () => {
  store = new CommerceStore({mode:'simulation', development:true, simulationSecret:randomBytes(32).toString('hex'), bookingTermsApproved:true});
  store.seedDrafts();
  server = createAcademyServer({store, adminToken, allowedOrigins:[base]});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5183','--strictPort'], {env:{...process.env,ACADEMY_API_ORIGIN:`http://127.0.0.1:${server.address().port}`},stdio:'ignore'});
  let started = false;
  for(let i=0;i<150;i++){try{const response=await fetch(base);if(response.ok){started=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(started,'Vite test server started');
  browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),args:['--no-sandbox']});
  mkdirSync('artifacts',{recursive:true});
});
after(async () => {
  if(browser) await browser.close();
  if(vite) vite.kill('SIGTERM');
  if(server) await new Promise(resolve=>server.close(resolve));
  if(store) store.close();
  writeFileSync('artifacts/browser-verification.json',JSON.stringify(results,null,2));
});

test('browser hosted checkout redirects and returns pending until authenticated provider lookup confirms it', async () => {
  let settled = false;
  let linkInput;
  const adapter = {
    ready: true, checkoutOrigins: ['https://checkout.example.test'],
    async createCheckout(input) {
      linkInput = input;
      return { providerLinkId: `test-${input.orderId}`, checkoutUrl: `https://checkout.example.test/pay/${input.orderId}`, expiresAt: input.expiresAt };
    },
    async reconcile({ orderId, providerLinkId }) {
      return settled ? { id: `proof-${orderId}`, orderId, providerLinkId, provider: 'morning', type: 'succeeded', transactionId: `test-tx-${orderId}`, amountAgorot: linkInput.amountAgorot, currency: 'ILS' } : null;
    },
  };
  const providerStore = new CommerceStore({ mode: 'morning', adapter, orderSecret: randomBytes(32).toString('hex'), bookingTermsApproved: true });
  providerStore.seedDrafts();
  const date = providerStore.approveDate(providerStore.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const checkout = new HostedCheckout({ store: providerStore, adapter, publicOrigin: 'https://academy.example.test' });
  const providerServer = createAcademyServer({ store: providerStore, checkout, allowedOrigins: [base] });
  await new Promise(resolve => providerServer.listen(0, '127.0.0.1', resolve));
  const apiOrigin = `http://127.0.0.1:${providerServer.address().port}`;
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.route('**/api/academy/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const response = await fetch(apiOrigin + path, { method: request.method(), headers: { ...request.headers(), host: new URL(apiOrigin).host }, ...(request.postData() ? { body: request.postData() } : {}) });
      await route.fulfill({ status: response.status, headers: { 'content-type': 'application/json' }, body: await response.text() });
    });
    await page.route('https://checkout.example.test/pay/**', async route => {
      const id = new URL(route.request().url()).pathname.split('/').at(-1);
      await route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<html lang="he" dir="rtl"><body><h1>ספק סליקה מדומה לבדיקת הממשק</h1><a href="${base}/orders/${id}">חזרה לאתר</a></body></html>` });
    });
    await page.goto(`${base}/register?date=${date.id}`);
    await page.getByLabel('שם מלא', { exact: true }).fill('משתתף ספק מדומה');
    await page.getByLabel('אימייל', { exact: true }).fill('hosted-browser@example.invalid');
    await page.getByLabel('טלפון', { exact: true }).fill('0500000000');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'המשך לתשלום מאובטח', exact: false }).click();
    await page.waitForURL('https://checkout.example.test/pay/**');
    assert.equal(providerStore.all('registrations').length, 0);
    await page.getByRole('link', { name: 'חזרה לאתר', exact: true }).click();
    await page.waitForURL(`${base}/orders/**`);
    await page.getByRole('heading', { level: 1, name: 'ההזמנה ממתינה לאישור', exact: true }).waitFor();
    await page.getByRole('link', { name: 'להמשך התשלום המאובטח' }).waitFor();
    assert.equal(providerStore.all('registrations').length, 0);
    settled = true;
    await page.getByRole('button', { name: 'רענון מצב ההזמנה' }).click();
    await page.getByRole('heading', { level: 1, name: 'ההרשמה אושרה', exact: true }).waitFor();
    const violations = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(violations.violations.length, 0);
    await page.reload();
    await page.getByRole('heading', { level: 1, name: 'ההרשמה אושרה', exact: true }).waitFor();
    assert.equal(providerStore.all('registrations').length, 1);
  } finally {
    await context.close();
    await new Promise(resolve => providerServer.close(resolve));
    providerStore.close();
  }
});

test('public pages render Hebrew RTL, no draft availability, responsive and accessible', async () => {
  const routes=['/','/courses','/courses/social-media-ai','/courses/ai-video-content','/courses/ai-business-owners','/about','/reviews','/register','/courses/ai-fashion','/thank-you','/admin/academy'];
  for(const width of [375,768,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',err=>errors.push(err.message));
    for(const route of routes){
      await page.goto(base+route);
      await page.locator('h1').first().waitFor();
      if(route==='/'){await page.locator('[data-academy-sections]').scrollIntoViewIfNeeded();await page.locator('#how-it-works').waitFor();await page.evaluate(()=>scrollTo(0,0));}
      assert.equal(await page.locator('h1').count(),1,`${route} single h1`);
      assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
      assert.equal(await page.locator('html').getAttribute('lang'),'he');
      assert.match(await page.locator('meta[name=robots]').getAttribute('content'),/noindex/);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${route} ${width} overflow`);
      if(route.startsWith('/courses/')&&!route.endsWith('ai-fashion')) await page.getByText('עדיין אין מועד מאושר להרשמה').waitFor();
      const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      results.push({route,width,violations:accessibility.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>node.target)}))});
      assert.equal(accessibility.violations.length,0,`${route} ${width} accessibility: ${JSON.stringify(accessibility.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})))}`);
      if(route==='/') await page.screenshot({path:`artifacts/academy-home-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[],`browser errors ${width}`);
    await context.close();
  }
});

test('mobile navigation supports keyboard, escape and route selection',async()=>{
  const page=await browser.newPage({viewport:{width:375,height:812}});
  await page.goto(base);await page.locator('h1').waitFor();
  await page.getByRole('button',{name:'פתיחת תפריט',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'סגירת תפריט',exact:true}).getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'פתיחת תפריט',exact:true}).waitFor();
  await page.getByRole('button',{name:'פתיחת תפריט',exact:true}).click();
  await page.locator('#academy-mobile-nav').getByRole('link',{name:'הסמינרים',exact:true}).click();
  await page.waitForURL(base+'/courses');await page.locator('h1').waitFor();
  await page.locator('#academy-mobile-nav').waitFor({state:'detached'});
  assert.equal(await page.locator('#academy-mobile-nav').count(),0);
  await page.close();
});

test('owner approves isolated test date; browser coupon checkout and signed payment update enrollment once',async()=>{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await page.goto(base+'/admin/academy');await page.locator('h1').waitFor();
  const loginFields=page.locator('input[type=password]');await loginFields.fill(adminToken);
  await page.getByRole('button',{name:/כניסה/}).click();
  await page.getByRole('button',{name:'יציאה',exact:true}).waitFor();
  const adminAxe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.equal(adminAxe.violations.length,0,JSON.stringify(adminAxe.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))));
  for(const width of [375,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'authenticated admin no overflow');}
  const testDate=store.dates(true).find(item=>item.seminarId==='social-media-ai');
  store.approveDate(testDate.id,{checksConfirmed:true,publish:true,openRegistration:true});
  store.createCoupon({code:'BROWSER_TEST_ONLY',type:'percentage',value:10,active:true,maxRedemptions:1,seminarIds:['social-media-ai']});
  await page.goto(base+'/courses/social-media-ai');
  await page.locator('input[type=radio]').first().check();
  await page.getByRole('link',{name:'הרשמה לסמינר',exact:false}).last().click();
  await page.waitForURL(/\/register\?/);
  await page.getByLabel('שם מלא',{exact:true}).fill('משתתף בדיקה');
  await page.getByLabel('אימייל',{exact:true}).fill('browser-test@example.invalid');
  await page.getByLabel('טלפון',{exact:true}).fill('0500000000');
  await page.getByText('יש לכם קוד קופון?',{exact:true}).click();
  await page.getByLabel('קוד קופון',{exact:true}).fill('INVALID_TEST_CODE');
  await page.getByRole('button',{name:'החלת קופון',exact:true}).click();
  await page.getByRole('alert').waitFor();
  await page.getByLabel('קוד קופון',{exact:true}).fill('BROWSER_TEST_ONLY');
  await page.getByRole('button',{name:'החלת קופון',exact:true}).click();
  await page.getByText('הקופון הוחל.',{exact:false}).waitFor();
  await page.getByLabel('הבנתי שזו בדיקה ללא חיוב וללא הרשמה אמיתית.').check();
  await page.getByRole('button',{name:'יצירת הזמנת בדיקה',exact:false}).click();
  await page.waitForURL(/\/orders\//);
  assert.equal(store.all('registrations').length,0,'redirect does not confirm booking');
  await page.getByRole('button',{name:'הדמיית תשלום מוצלח ללא חיוב',exact:true}).click();
  await page.getByRole('heading',{name:'בדיקת ההרשמה הושלמה'}).waitFor();
  assert.equal(store.all('registrations').length,1);
  assert.equal(store.all('orders')[0].totalAgorot,107100);
  await page.reload();await page.getByRole('heading',{name:'בדיקת ההרשמה הושלמה'}).waitFor();
  assert.equal(store.all('registrations').length,1,'refresh does not duplicate enrollment');
  results.push({story:'browser -> server coupon -> order hold -> signed simulation -> enrollment',passed:true,realCharge:false});
  await page.close();
});

test('homepage lazy sections retain working anchor navigation and real video controls',async()=>{
 const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base);await page.locator('h1').waitFor();
 await page.getByRole('link',{name:'איך זה עובד?',exact:true}).click();
 await page.locator('#how-it-works').waitFor();
 await page.waitForFunction(()=>{const node=document.getElementById('how-it-works');return node&&node.getBoundingClientRect().top<160&&node.getBoundingClientRect().top>=0;});
 await page.getByRole('button',{name:'פתיחת נגן: פרומו לקמפיין',exact:true}).click();
 const video=page.locator('video').first();await video.waitFor();
 assert.equal(await video.getAttribute('controls'),'');
 assert.equal(await video.locator('source').getAttribute('src'),'/videos/Movie_5.mp4');
 const media=await page.request.head(base+'/videos/Movie_5.mp4');
 assert.match(media.headers()['content-type'],/video\/mp4/);
 await page.goto(base+'/#seminars');await page.locator('#seminars').waitFor();
 await page.waitForFunction(()=>document.getElementById('seminars').getBoundingClientRect().top<160);
 results.push({story:'deferred content + native anchor + genuine local video',passed:true});
 await context.close();
});

test('client ribbon loops, pauses, supports dragging and remains usable with reduced motion',async()=>{
  for(const reducedMotion of ['no-preference','reduce']){
    const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion});
    const page=await context.newPage();
    await page.goto(base);await page.locator('[data-academy-sections]').scrollIntoViewIfNeeded();
    const ribbon=page.getByRole('region',{name:/לוגואים של לקוחות/});
    await ribbon.scrollIntoViewIfNeeded();
    const transform=()=>page.locator('.academy-client-belt').evaluate(node=>getComputedStyle(node).transform);
    await page.mouse.move(2,2);
    const initial=await transform();await page.waitForTimeout(180);
    if(reducedMotion==='no-preference'){
      assert.notEqual(await transform(),initial,'automatic ribbon movement');
      await page.getByRole('button',{name:'עצירת תנועת הלוגואים',exact:true}).click();
      const frozen=await transform();await page.waitForTimeout(180);assert.equal(await transform(),frozen,'explicit pause stops automatic movement');
    }else{
      assert.equal(await transform(),initial,'reduced motion has no automatic movement');
      assert.equal(await page.getByRole('button',{name:'עצירת תנועת הלוגואים',exact:true}).count(),0);
    }
    const before=await transform();
    const box=await ribbon.boundingBox();await page.mouse.move(box.x+180,box.y+40);await page.mouse.down();await page.mouse.move(box.x+65,box.y+40,{steps:8});await page.mouse.up();
    assert.notEqual(await transform(),before,'manual pointer dragging works');
    await ribbon.focus();const dragged=await transform();await page.keyboard.press('ArrowRight');assert.notEqual(await transform(),dragged,'manual keyboard control works');
    const names=await page.locator('.academy-client-logos:not([aria-hidden]) img').evaluateAll(images=>images.map(image=>image.alt));
    assert.equal(names.length,14);assert.equal(new Set(names).size,14);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.getByRole('link',{name:'לכל ההמלצות',exact:false}).click();await page.waitForURL(base+'/reviews');await page.locator('h1').waitFor();
    await context.close();
  }
});
