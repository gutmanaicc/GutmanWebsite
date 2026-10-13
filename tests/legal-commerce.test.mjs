import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, chmodSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { LegalNoticeInbox } from '../server/legal-notices.mjs';
import { loadMerchantDisclosure, publicLegalDisclosure, buildOrderLegalSnapshot, renderOrderDocument, accountingDocumentRemarks } from '../server/legal-documents.mjs';
import { CommerceStore } from '../server/commerce.mjs';
import { createAcademyServer } from '../server/http.mjs';
import { createSelfHostedRuntime } from '../server/self-hosted-runtime.mjs';

const SECRET = 'test-only-legal-secret-at-least-32-characters';
const NOW = Date.parse('2026-10-13T10:00:00Z');
const ORIGIN = 'https://academy.example.test';
const seller = { businessName: 'עסק בדיקה', registrationNumber: '123456789', postalAddress: 'כתובת בדיקה 1', taxStatus: 'exempt', email: 'legal@example.test', phone: '0500000000' };
function folder(t) { const dir = mkdtempSync(join(tmpdir(), 'academy-legal-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; }
function commerce(t, options = {}) {
  const disclosure = publicLegalDisclosure(seller);
  const store = new CommerceStore({ mode: 'simulation', development: true, simulationSecret: SECRET, clock: () => NOW, bookingTermsApproved: true, requiredDisclosureVersion: disclosure.version, legalDocumentFactory: (o, d, at) => buildOrderLegalSnapshot(o, d, seller, at), ...options });
  t.after(() => store.close()); store.seedDrafts();
  const date = store.approveDate(store.dates(true)[0].id, { checksConfirmed: true, publish: true, openRegistration: true });
  const payload = { dateId: date.id, termsAccepted: true, disclosureVersion: disclosure.version, customer: { name: '<script>test</script>', email: 'buyer@example.test', phone: '0500000000' } };
  return { store, date, payload, disclosure };
}

test('minimal notices receive a stable timestamp without login, order, identity or reason; restart retains encrypted records', t => {
  const dir = folder(t), path = join(dir, 'legal.sqlite');
  let inbox = new LegalNoticeInbox({ path, secret: SECRET, clock: () => NOW });
  const minimal = { type: 'cancellation', fullName: 'בדיקה' };
  const receipt = inbox.receive(minimal, 'test-legal-notice-one');
  assert.equal(receipt.receivedAt, new Date(NOW).toISOString()); assert.equal(receipt.refundExecuted, false);
  assert.deepEqual(inbox.receive(minimal, 'test-legal-notice-one'), receipt);
  assert.throws(() => inbox.receive({ ...minimal, message: 'changed' }, 'test-legal-notice-one'), e => e.code === 'NOTICE_CONFLICT');
  inbox.receive({ type: 'privacy_access', fullName: 'private-name-only', identityNumber: 'PRIVATE-ID-SENTINEL', message: 'private-message-only' }, 'test-legal-notice-two');
  const list = inbox.list(); assert.equal(list.length, 2); assert.equal(list.find(x => x.type === 'privacy_access').identityProvided, true); assert.ok(list.every(x => !('identityNumber' in x)));
  assert.equal(inbox.setStatus(receipt.noticeId, 'processing').refundExecuted, false);
  inbox.close();
  assert.ok(!readFileSync(path).includes(Buffer.from('PRIVATE-ID-SENTINEL')));
  assert.ok(!readFileSync(path).includes(Buffer.from('private-message-only')));
  assert.throws(() => new LegalNoticeInbox({ path, secret: 'another-test-secret-at-least-32-characters' }), /key changed/);
  inbox = new LegalNoticeInbox({ path, secret: SECRET, clock: () => NOW + 5000 });
  assert.deepEqual(inbox.receive(minimal, 'test-legal-notice-one'), receipt); assert.equal(inbox.list().length, 2);
  inbox.db.prepare('UPDATE notices SET received_at=? WHERE id=?').run('2000-01-01T00:00:00Z', receipt.noticeId);
  assert.throws(() => inbox.list(), /authentication failed/); inbox.close();
});

test('merchant disclosure is private-file bound to verified Morning identity and current exempt status', t => {
  const dir = folder(t), path = join(dir, 'seller.json');
  const profile = { ...seller, ownerConfirmed: true };
  const verified = { verified: true, businessTaxId: seller.registrationNumber };
  writeFileSync(path, JSON.stringify(profile), { mode: 0o600 });
  assert.ok(loadMerchantDisclosure(path, verified));
  assert.equal(loadMerchantDisclosure(path, { ...verified, businessTaxId: '987654321' }), null);
  assert.equal(loadMerchantDisclosure(path, { ...verified, verified: false }), null);
  chmodSync(path, 0o644); assert.equal(loadMerchantDisclosure(path, verified), null); chmodSync(path, 0o600);
  writeFileSync(path, JSON.stringify({ ...profile, taxStatus: 'authorized' })); assert.equal(loadMerchantDisclosure(path, verified), null);
  const link = join(dir, 'seller-link.json'); symlinkSync(path, link); assert.equal(loadMerchantDisclosure(link, verified), null);
});

test('missing or stale disclosure cannot create a hold; existing retry preserves original consent and snapshot', t => {
  const { store, payload } = commerce(t);
  for (const version of [undefined, 'stale-disclosure']) assert.throws(() => store.createOrder({ ...payload, disclosureVersion: version }, 'test-disclosure-order'), e => e.code === 'DISCLOSURE_CHANGED');
  assert.equal(store.all('orders').length, 0);
  const created = store.createOrder(payload, 'test-disclosure-order');
  const original = structuredClone(store.get('orders', created.orderId).legalSnapshot);
  assert.equal(original.siteTerms, null); assert.equal(original.marketing.email, false);
  store.requiredDisclosureVersion = 'new-version';
  assert.deepEqual(store.createOrder({ ...payload, disclosureVersion: 'stale-again' }, 'test-disclosure-order'), created);
  assert.deepEqual(store.get('orders', created.orderId).legalSnapshot, original);
  assert.equal(store.authorizedOrder(created.orderId, created.orderAccessToken).documentAvailable, true);
});

test('original document escapes customer input, carries seller and costs, and draft terms cannot activate themselves', t => {
  const { store, payload } = commerce(t);
  const created = store.createOrder(payload, 'test-document-render');
  const snapshot = store.get('orders', created.orderId).legalSnapshot;
  const html = renderOrderDocument(snapshot, { origin: ORIGIN });
  assert.ok(!html.includes('<script>test</script>')); assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
  assert.ok(html.includes('מספר עוסק')); assert.ok(html.includes('/cancel')); assert.ok(html.includes('מדיניות פרטיות')); assert.ok(!html.includes('סמכות השיפוט'));
  assert.throws(() => renderOrderDocument(snapshot, { origin: 'http://unsafe.example.test' }));
  assert.notEqual(publicLegalDisclosure(seller).version, publicLegalDisclosure(seller, { siteTermsApproved: true }).version);
  for (const seminarId of ['ai-video-content', 'social-media-ai', 'ai-business-owners']) {
    const s = buildOrderLegalSnapshot(store.get('orders', created.orderId), { ...store.get('dates', payload.dateId), seminarId }, seller, new Date(NOW).toISOString());
    const remarks = accountingDocumentRemarks(s, ORIGIN); assert.ok(remarks.length <= 2000); assert.ok(remarks.includes('מספר עוסק')); assert.ok(remarks.includes('ללא דמי ביטול')); assert.ok(remarks.includes('/cancel'));
  }
});

test('notice and transaction document HTTP endpoints enforce origin, limits and scoped access; a notice never changes payment', async t => {
  const { store, payload, disclosure } = commerce(t);
  const dir = folder(t), inbox = new LegalNoticeInbox({ path: join(dir, 'legal.sqlite'), secret: SECRET, clock: () => NOW }); t.after(() => inbox.close());
  const adminToken = 'test-admin-legal-token-at-least-32-characters';
  const server = createAcademyServer({ store, legalInbox: inbox, legalDisclosure: disclosure, publicOrigin: ORIGIN, adminToken, allowedOrigins: [ORIGIN] });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); t.after(() => new Promise(r => server.close(r)));
  const root = `http://127.0.0.1:${server.address().port}`;
  const post = (data, origin = ORIGIN) => fetch(root + '/api/academy/legal-notices', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(data) });
  assert.equal((await post({ type: 'cancellation', fullName: 'test' }, 'https://unapproved.example.test')).status, 403);
  assert.equal((await post({ type: 'cancellation', fullName: 'test', message: 'x'.repeat(17000) })).status, 413);
  const created = store.createOrder(payload, 'test-http-document');
  assert.equal((await post({ type: 'cancellation', fullName: 'test', orderId: created.orderId })).status, 200);
  assert.equal(store.get('orders', created.orderId).status, 'pending'); assert.equal(store.all('registrations').length, 0);
  assert.equal((await fetch(root + '/api/academy/admin/legal-notices')).status, 401);
  const documentPath = root + `/api/academy/orders/${created.orderId}/document`;
  assert.equal((await fetch(documentPath)).status, 401);
  const response = await fetch(documentPath, { headers: { authorization: `Bearer ${created.orderAccessToken}` } });
  assert.equal(response.status, 200); assert.match(response.headers.get('content-security-policy'), /default-src 'none'/); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.ok((await response.text()).includes('מסמך פרטי העסקה'));
  await new Promise(r => setImmediate(r)); assert.equal(store.get('orders', created.orderId).documentFirstServedAt, new Date(NOW).toISOString());
});

test('required disclosure fails closed on the standalone runtime before any provider call', t => {
  const dir = folder(t), clientId = 'test-only-client-id';
  writeFileSync(join(dir, 'morning-merchant.json'), JSON.stringify({ businessTaxId: seller.registrationNumber, exemption: true, verifiedAt: new Date(NOW).toISOString(), apiIdDigest: createHash('sha256').update(clientId).digest('hex'), checkoutOrigins: ['https://checkout.example.test'] }), { mode: 0o600 });
  const env = { ACADEMY_DB_PATH: join(dir, 'academy.sqlite'), ACADEMY_PUBLIC_ORIGIN: ORIGIN, ACADEMY_PAYMENT_MODE: 'morning', ACADEMY_ORDER_SECRET: SECRET, ACADEMY_BOOKING_TERMS_APPROVED: '1', ACADEMY_COMMERCIAL_DISCLOSURE_REQUIRED: '1', MORNING_API_ID: clientId, MORNING_API_SECRET: 'test-only-provider-secret' };
  const make = () => createSelfHostedRuntime(env, { clock: () => NOW, fetchImpl: () => assert.fail('No external call is allowed') });
  let runtime = make(); assert.equal(runtime.checkout.ready, false); runtime.close();
  writeFileSync(join(dir, 'merchant-legal-profile.json'), JSON.stringify({ ...seller, ownerConfirmed: true }), { mode: 0o600 });
  runtime = make(); assert.equal(runtime.checkout.ready, true); assert.equal(runtime.legalInbox.ready, true); runtime.close();
});
