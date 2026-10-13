import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AcademyLeadIntake } from '../server/hubspot-leads.mjs';
import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CommerceStore } from '../server/commerce.mjs';
import { createAcademyServer } from '../server/http.mjs';
import { HostedCheckout } from '../server/hosted-checkout.mjs';
import { LegalNoticeInbox } from '../server/legal-notices.mjs';

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

test('date availability refreshes on return and clears a selection when the seminar fills', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let remaining = 3;
  let calls = 0;
  await page.route('**/api/academy/catalog', route => {
    calls++;
    return route.fulfill({ json: {
      dates: [{ id: 'availability-review', seminarId: 'social-media-ai', date: '2026-10-22', startTime: '15:00', endTime: '20:00', venue: 'הטרמינל לעיצוב, אהוד קינמון 32, בת ים', remainingCapacity: remaining, status: remaining ? 'open_for_registration' : 'fully_booked' }],
      pricing: { launchPriceAgorot: 119000, regularPriceAgorot: 149000, currency: 'ILS' },
      commerce: { mode: 'morning', ready: true }, leads: { ready: false },
    } });
  });
  try {
    await page.goto(base + '/courses/social-media-ai', { waitUntil: 'domcontentloaded' });
    const choice = page.locator('.academy-dates input');
    await choice.check();
    remaining = 2;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByText('2 מקומות זמינים', { exact: false }).waitFor();
    assert.equal(await choice.isChecked(), true, 'available selected date is retained');
    remaining = 0;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('.academy-dates input')?.disabled);
    assert.equal(await choice.isChecked(), false, 'sold-out selection is cleared');
    assert.equal(await page.locator('.academy-booking').getByRole('link', { name: /^הרשמה לסמינר/ }).count(), 0);
    assert.ok(calls >= 3);
  } finally { await context.close(); }
});

test('public cancellation receives a durable receipt without an account or mandatory reason; privacy route resets the request type', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'legal-browser-'));
  const inbox = new LegalNoticeInbox({ path: join(dir, 'legal.sqlite'), secret: randomBytes(32).toString('hex') });
  const legalServer = createAcademyServer({ store, legalInbox: inbox, allowedOrigins: [base] });
  await new Promise(resolve => legalServer.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${legalServer.address().port}`;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.route('**/api/academy/legal-notices', async route => {
      const req = route.request();
      const response = await fetch(origin + '/api/academy/legal-notices', { method: req.method(), headers: req.headers(), body: req.postData() });
      await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
    });
    const before = store.all('orders').length;
    await page.goto(base + '/cancel');
    await page.getByLabel('שם מלא', { exact: true }).fill('בדיקת ביטול בדפדפן');
    await page.getByRole('button', { name: 'מסירת הודעת ביטול', exact: true }).click();
    await page.getByRole('heading', { name: 'ההודעה התקבלה.', exact: true }).waitFor();
    assert.equal(inbox.list().length, 1); assert.equal(inbox.list()[0].type, 'cancellation');
    assert.equal(store.all('orders').length, before);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'שמירת אישור קבלת ההודעה' }).click();
    assert.match((await downloadPromise).suggestedFilename(), /^gutman-notice-/);
    await page.getByRole('link', { name: 'פניות פרטיות', exact: true }).click();
    await page.getByLabel('נושא הפנייה').waitFor();
    assert.equal(await page.getByLabel('נושא הפנייה').inputValue(), 'privacy_access');
    await page.getByLabel('נושא הפנייה').selectOption('marketing_withdrawal');
    await page.getByLabel('שם מלא', { exact: true }).fill('בדיקת הסרה');
    await page.getByRole('button', { name: 'שליחת פנייה', exact: true }).click();
    await page.getByRole('heading', { name: 'ההודעה התקבלה.', exact: true }).waitFor();
    assert.equal(inbox.list().filter(x => x.type === 'marketing_withdrawal').length, 1);
  } finally { await context.close(); await new Promise(resolve => legalServer.close(resolve)); inbox.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('tracking requires explicit v2 consent and safe paths; preview never sends optional analytics even with consent', async () => {
  const context = await browser.newContext(); const page = await context.newPage(); const tracking = [];
  page.on('request', req => { if (/facebook|google-analytics|googletagmanager|clarity\.ms/.test(req.url())) tracking.push(req.url()); });
  try {
    await page.goto(base + '/privacy');
    const choices = await page.evaluate(async () => {
      const consent = await import('/src/consent.ts');
      localStorage.clear(); localStorage.setItem('cookie-consent-v1', 'accepted');
      const legacy = consent.hasAnalyticsConsent();
      localStorage.setItem(consent.CONSENT_KEY, JSON.stringify({ version: 2, choice: 'declined' }));
      const declined = consent.canUseAnalytics();
      localStorage.setItem(consent.CONSENT_KEY, JSON.stringify({ version: 2, choice: 'accepted' }));
      return { legacy, declined, sensitive: consent.canUseAnalytics(), safePath: consent.analyticsPathAllowed('/courses'), protectedPaths: ['/register', '/orders/test', '/cancel', '/privacy-requests', '/admin/academy'].map(path => consent.analyticsPathAllowed(path)) };
    });
    assert.equal(choices.legacy, false); assert.equal(choices.declined, false); assert.equal(choices.sensitive, false); assert.equal(choices.safePath, true); assert.ok(choices.protectedPaths.every(x => !x));
    await page.getByRole('button', { name: 'העדפות עוגיות', exact: true }).click();
    await page.getByRole('button', { name: 'ללא מדידה אופציונלית', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent-v2')).choice), 'declined');
    await page.goto(base + '/courses'); await page.locator('h1').waitFor(); assert.deepEqual(tracking, []);
  } finally { await context.close(); }
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
  const routes=['/','/courses','/courses/social-media-ai','/courses/ai-video-content','/courses/ai-business-owners','/about','/reviews','/privacy','/booking-terms','/terms','/cancel','/privacy-requests','/register','/courses/ai-fashion','/thank-you','/admin/academy'];
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

test('booking terms remain a visible draft until explicit approval and checkout links to the separate cancellation policy', async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } }); const page = await context.newPage();
  let approved = false;
  try {
    await page.route('**/api/academy/catalog', async route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ dates: [], commerce: { mode: 'disabled', ready: false, bookingTermsApproved: approved }, pricing: { launchPriceAgorot: 119000, regularPriceAgorot: 149000, currency: 'ILS' } }) }));
    await page.goto(base + '/booking-terms');
    await page.getByText('טיוטה לאישור בעל המכללה', { exact: true }).waitFor();
    assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/);
    assert.ok((await page.locator('main').innerText()).includes('48 שעות'));
    assert.ok((await page.locator('main').innerText()).includes('החזר מלא'));
    approved = true; await page.reload();
    await page.getByText('עודכן באוקטובר 2026', { exact: true }).waitFor();
    assert.equal(await page.getByText('טיוטה לאישור בעל המכללה', { exact: true }).count(), 0);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.equal(accessibility.violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  } finally { await context.close(); }
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

test('client ribbon moves automatically through hover, pauses by keyboard, supports dragging and reduced motion',async()=>{
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
      await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
      const embedded = await transform(); await page.waitForTimeout(180);
      assert.notEqual(await transform(), embedded, 'native loop keeps moving when an embedded WebView reports hidden');
      const hoverBox=await ribbon.boundingBox();await page.mouse.move(hoverBox.x+100,hoverBox.y+40);const hovered=await transform();await page.waitForTimeout(180);assert.notEqual(await transform(),hovered,'hover does not stop automatic movement');
      await ribbon.focus();await page.keyboard.press('Space');
      const frozen=await transform();await page.waitForTimeout(180);assert.equal(await transform(),frozen,'explicit pause stops automatic movement');
    }else{
      assert.equal(await transform(),initial,'reduced motion has no automatic movement');
      assert.equal(await page.getByRole('button',{name:'עצירת תנועת הלוגואים',exact:true}).count(),0);
    }
    const before=await transform();
    const box=await ribbon.boundingBox();await page.mouse.move(box.x+180,box.y+40);await page.mouse.down();await page.mouse.move(box.x+65,box.y+40,{steps:8});await page.mouse.up();
    assert.notEqual(await transform(),before,'manual pointer dragging works');
    await ribbon.focus();const dragged=await transform();await page.keyboard.press('ArrowRight');await page.waitForFunction(previous=>getComputedStyle(document.querySelector('.academy-client-belt')).transform!==previous,dragged);assert.notEqual(await transform(),dragged,'manual keyboard control works');
    const names=await page.locator('.academy-client-logos:not([aria-hidden]) img').evaluateAll(images=>images.map(image=>image.alt));
    assert.equal(names.length,14);assert.equal(new Set(names).size,14);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.getByRole('link',{name:'לכל ההמלצות',exact:false}).click();await page.waitForURL(base+'/reviews');await page.locator('h1').waitFor();
    await context.close();
  }
});

test('mobile and desktop sections fade on scroll, keep brand text centered, and show the actual seminar venue without overflow', async () => {
  for (const width of [320, 360, 375, 390, 393, 412, 430, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600 });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('[data-academy-sections]').scrollIntoViewIfNeeded();
    const banner = page.locator('.academy-client-banner');
    await banner.waitFor();
    await page.waitForFunction(() => document.querySelector('.academy-client-banner')?.classList.contains('academy-scroll-fade'));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.academy-client-banner')).opacity === '0');
    await banner.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.academy-client-banner')).opacity === '1');
    assert.equal(await page.locator('.academy-client-heading .academy-eyebrow').evaluate(node => getComputedStyle(node).justifyContent), 'center');
    assert.equal(await banner.locator('button').count(), 0);
    assert.equal(await page.getByText('גררו כדי לגלות עוד', { exact: true }).count(), 0);
    const line = await page.locator('.academy-client-heading>p:last-child').evaluate(node => ({ scroll: node.scrollWidth, width: node.clientWidth, height: node.clientHeight, line: parseFloat(getComputedStyle(node).lineHeight) }));
    assert.ok(line.scroll <= line.width + 1 && line.height <= line.line + 1, `brand sentence fits one line at ${width}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `home width ${width}`);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `artifacts/brand-ribbon-${width}.png` });
    for (const slug of ['social-media-ai', 'ai-video-content', 'ai-business-owners']) {
      await page.goto(`${base}/courses/${slug}`);
      await page.locator('.academy-product-location').waitFor();
      assert.match(await page.locator('.academy-product-location').innerText(), /הטרמינל לעיצוב, בת ים/);
      assert.match(await page.locator('.academy-product-location').innerText(), /אהוד קינמון 32/);
      await page.locator('#agenda').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#agenda')).opacity === '1');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slug} width ${width}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
});

test('seminar enquiry uses durable lead API, keeps marketing optional and reports provider failure truthfully',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'academy-lead-browser-'));let calls=0;
 const intake=new AcademyLeadIntake({path:join(directory,'leads.sqlite'),adapter:{submit:async()=>{calls++;if(calls===1)throw new Error('Uncertain test provider transport');}}});
 const localStore=new CommerceStore();const apiServer=createAcademyServer({store:localStore,leadIntake:intake,allowedOrigins:[base]});await new Promise(resolve=>apiServer.listen(0,'127.0.0.1',resolve));const apiOrigin=`http://127.0.0.1:${apiServer.address().port}`;
 const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});const page=await context.newPage();
 try{
  await page.route('**/api/academy/**',async route=>{const request=route.request();const response=await fetch(apiOrigin+new URL(request.url()).pathname,{method:request.method(),headers:{...request.headers(),host:new URL(apiOrigin).host},...(request.postData()?{body:request.postData()}: {})});await route.fulfill({status:response.status,headers:{'content-type':'application/json'},body:await response.text()});});
  await page.goto(base+'/courses/social-media-ai');await page.locator('.academy-interest-form').waitFor();
  await page.getByLabel('שם מלא',{exact:true}).fill('פניית בדיקה');await page.getByLabel('אימייל',{exact:true}).fill('lead-browser@example.invalid');await page.getByLabel('טלפון',{exact:true}).fill('0500000000');
  assert.equal(await page.getByRole('checkbox').isChecked(),false);const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  await page.getByRole('button',{name:'חזרו אליי עם פרטים',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByText('הפנייה שלכם נקלטה.',{exact:true}).count(),0);
  await page.getByRole('button',{name:'חזרו אליי עם פרטים',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(calls,1,'uncertain provider call is not repeated');
  await page.getByLabel('מה תרצו לדעת?',{exact:false}).fill('מידע על הסמינר');await page.getByRole('button',{name:'חזרו אליי עם פרטים',exact:true}).click();await page.getByText('הפנייה שלכם נקלטה.',{exact:true}).waitFor();
  const rows=intake.db.prepare("SELECT data FROM leads WHERE state='accepted'").all();assert.equal(rows.length,1);assert.equal(JSON.parse(rows[0].data).marketingConsent,false);assert.equal(localStore.all('orders').length,0);assert.equal(localStore.all('registrations').length,0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }finally{await context.close();await new Promise(resolve=>apiServer.close(resolve));localStore.close();intake.close();rmSync(directory,{recursive:true,force:true});}
});
