import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSelfHostedApis } from '../scripts/self-hosted-build-api.mjs';
import { createSelfHostedRuntime } from '../server/self-hosted-runtime.mjs';
import { createSelfHostedServer, loadSelfHostedApiHandlers } from '../server/self-hosted-http.mjs';

const NOW = Date.parse('2026-10-12T10:00:00Z');
const ADMIN = 'mock-standalone-admin-token-at-least-32-characters';
const RECORD_ID = '01234567-89ab-4cde-8fab-0123456789ab';
const baseEnv = { ACADEMY_PUBLIC_ORIGIN: 'https://preview.example.test', ACADEMY_ALLOWED_ORIGINS: 'https://preview.example.test', ACADEMY_ADMIN_TOKEN: ADMIN, ACADEMY_PAYMENT_MODE: 'disabled' };
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'academy-standalone-')); t.after(() => rm(root, { recursive: true, force: true }));
  const publicDirectory = join(root, 'public'); const apiDirectory = join(root, 'api');
  await mkdir(join(publicDirectory, 'assets'), { recursive: true });
  await writeFile(join(publicDirectory, 'index.html'), '<!doctype html><html lang="he" dir="rtl"><body>Academy built SPA</body></html>');
  await writeFile(join(publicDirectory, 'assets', 'example.js'), 'console.log("public bundle");');
  await writeFile(join(publicDirectory, 'movie.mp4'), '0123456789');
  await writeFile(join(root, 'private.env'), 'PRIVATE_SERVER_SECRET_MUST_NEVER_RENDER');
  await symlink(join(root, 'private.env'), join(publicDirectory, 'leak.txt'));
  await buildSelfHostedApis({ outputDirectory: apiDirectory });
  await writeFile(join(apiDirectory, 'package.json'), '{"type":"module"}');
  const apiHandlers = await loadSelfHostedApiHandlers(apiDirectory);
  return { root, publicDirectory, apiHandlers, databasePath: join(root, 'private-data', 'academy.sqlite') };
}
async function serve(t, fixture, env = {}, fetchImpl = () => { throw new Error('No supplier call is authorized in this test'); }) {
  const runtime = createSelfHostedRuntime({ ...baseEnv, ACADEMY_DB_PATH: fixture.databasePath, ...env }, { clock: () => NOW, fetchImpl });
  const server = await createSelfHostedServer({ runtime, staticDirectory: fixture.publicDirectory, apiHandlers: fixture.apiHandlers, preview: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let closed = false;
  const close = async () => { if (closed) return; closed = true; await new Promise(resolve => server.close(resolve)); runtime.close(); };
  t.after(close);
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, { method = 'GET', data, token, headers = {}, raw } = {}) => fetch(`${base}${path}`, { method, headers: { ...(data !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, ...(data !== undefined ? { body: JSON.stringify(data) } : raw !== undefined ? { body: raw } : {}) });
  return { runtime, request, close };
}

test('standalone server serves built SPA, ranged media and cached bundles; private/symlink files and unknown API paths never become SPA responses', async t => {
  const files = await fixture(t); const context = await serve(t, files);
  const homepage = await context.request('/'); assert.equal(homepage.status, 200); assert.match(await homepage.text(), /Academy built SPA/);
  assert.equal(homepage.headers.get('X-Robots-Tag'), 'noindex, nofollow'); assert.equal(homepage.headers.get('Cache-Control'), 'no-cache');
  assert.match(await (await context.request('/courses/social-media-ai')).text(), /Academy built SPA/);
  const bundle = await context.request('/assets/example.js'); assert.equal(bundle.status, 200); assert.equal(bundle.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  const range = await context.request('/movie.mp4', { headers: { range: 'bytes=2-5' } }); assert.equal(range.status, 206); assert.equal(range.headers.get('Content-Range'), 'bytes 2-5/10'); assert.equal(await range.text(), '2345');
  assert.equal((await context.request('/movie.mp4', { headers: { range: 'bytes=99-100' } })).status, 416);
  for (const path of ['/api/unknown', '/api/_monitoring', '/leak.txt', '/..%2Fprivate.env', '/.env', '/assets/missing.js']) {
    const response = await context.request(path); assert.equal(response.status, 404); assert.ok(!(await response.text()).includes('PRIVATE_SERVER_SECRET'));
  }
  assert.equal((await context.request('/courses/social-media-ai', { method: 'POST', data: {} })).status, 405);
  const catalog = await (await context.request('/api/academy/catalog')).json(); assert.equal(catalog.dates.length, 0); assert.equal(catalog.commerce.ready, false);
  assert.equal((await context.request('/api/academy/admin/dates')).status, 401);
  const drafts = await (await context.request('/api/academy/admin/dates', { token: ADMIN })).json(); assert.equal(drafts.dates.length, 10); assert.ok(drafts.dates.every(date => date.status === 'draft' && !date.published));
  assert.throws(() => createSelfHostedRuntime({ ...baseEnv, ACADEMY_DB_PATH: files.databasePath, ACADEMY_PAYMENT_MODE: 'simulation' }), /Only disabled or Morning/);
});

test('compiled existing lead handler runs on Node without TS hooks: query/status shims, JSON limits and actual Fireberry contract with mocked transport', async t => {
  const files = await fixture(t); const context = await serve(t, files);
  const before = { FIREBERRY_TOKEN: process.env.FIREBERRY_TOKEN, FIREBERRY_FIELD_MAP: process.env.FIREBERRY_FIELD_MAP, FIREBERRY_OBJECT_TYPE: process.env.FIREBERRY_OBJECT_TYPE, LEAD_DIAG_KEY: process.env.LEAD_DIAG_KEY };
  for (const [name, value] of Object.entries({ FIREBERRY_TOKEN: 'mock-only-fireberry-token', FIREBERRY_FIELD_MAP: '{}', FIREBERRY_OBJECT_TYPE: '1', LEAD_DIAG_KEY: 'mock-private-diagnostic-key' })) process.env[name] = value;
  t.after(() => { for (const [name, value] of Object.entries(before)) if (value === undefined) delete process.env[name]; else process.env[name] = value; });
  const originalFetch = globalThis.fetch; const calls = [];
  globalThis.fetch = async (url, options) => {
    const target = String(url);
    if (target.startsWith('http://127.0.0.1:')) return originalFetch(url, options);
    if (target === 'https://api.fireberry.com/metadata/records/1/fields') { calls.push(target); return new Response('{"fields":[]}', { headers: { 'content-type': 'application/json' } }); }
    if (target === 'https://api.fireberry.com/api/record/1') {
      calls.push(target); assert.equal(options.headers.tokenid, 'mock-only-fireberry-token'); assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body); assert.equal(body.accountname, 'Mock lead'); assert.equal(body.emailaddress1, 'lead@example.test'); assert.equal(body.telephone1, '0501234567');
      return new Response(JSON.stringify({ data: { accountid: RECORD_ID } }), { headers: { 'content-type': 'application/json' } });
    }
    assert.fail('Unexpected supplier call: tests must not reach any external service');
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const denied = await context.request('/api/lead'); assert.equal(denied.status, 405); assert.equal(denied.headers.get('Allow'), 'POST');
  const diagnostic = await context.request('/api/lead?meta=1&key=mock-private-diagnostic-key'); assert.equal(diagnostic.status, 200); assert.equal((await diagnostic.json()).objectType, '1');
  assert.equal((await context.request('/api/lead', { method: 'POST', data: {} })).status, 400);
  assert.equal((await context.request('/api/lead', { method: 'POST', raw: '{broken', headers: { 'content-type': 'application/json' } })).status, 400);
  assert.equal((await context.request('/api/lead', { method: 'POST', data: { text: 'x'.repeat(17000) } })).status, 413);
  assert.equal((await context.request('/api/lead', { method: 'POST', data: { fullName: 'Mock lead', email: 'lead@example.test', phone: '0501234567' }, headers: { origin: 'https://unapproved.example.test' } })).status, 403);
  const forwarded = await context.request('/api/lead', { method: 'POST', data: { fullName: 'Mock lead', email: 'lead@example.test', phone: '0501234567' } });
  assert.equal(forwarded.status, 200); const result = await forwarded.json(); assert.equal(result.forwarded, true); assert.equal(result.leadId, RECORD_ID);
  assert.equal(calls.filter(url => url.endsWith('/api/record/1')).length, 1);
});

test('standalone persistent SQLite and real Morning adapter preserve order across process-style restart; verified mocked receipt enrolls once', async t => {
  const files = await fixture(t); const forms = []; let paid = false;
  const env = { ACADEMY_PAYMENT_MODE: 'morning', ACADEMY_ORDER_SECRET: 'mock-standalone-order-secret-at-least-32-characters', ACADEMY_BOOKING_TERMS_APPROVED: '1', MORNING_API_ID: 'mock-oauth-id', MORNING_API_SECRET: 'mock-oauth-secret', MORNING_WEBHOOK_SECRET: 'mock-standalone-webhook-secret-at-least-32-characters', MORNING_BUSINESS_TAX_ID: 'mock-merchant', MORNING_MERCHANT_VERIFIED: '1', MORNING_CHECKOUT_ORIGINS: 'https://checkout.example.test' };
  const providerFetch = async (url, options) => {
    const response = value => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
    if (url.endsWith('/idp/v1/oauth/token')) return response({ accessToken: 'mock-access-token', tokenType: 'Bearer', expiresAt: Math.floor(NOW / 1000) + 3600 });
    if (url.endsWith('/payments/form')) { forms.push(JSON.parse(options.body)); return response({ success: true, errorCode: 0, url: 'https://checkout.example.test/one-link' }); }
    if (url.endsWith('/documents/search')) return response({ pages: paid ? 1 : 0, items: paid ? [{ id: RECORD_ID, description: forms[0].description }] : [] });
    if (url.endsWith(`/documents/${RECORD_ID}`)) return response({ id: RECORD_ID, description: forms[0].description, type: 400, status: 0, currency: 'ILS', amount: 1190, vat: 0, vatType: 1, business: { taxId: 'mock-merchant', exemption: true }, payment: [{ type: 3, currency: 'ILS', price: 1190 }] });
    assert.fail('No external supplier route is allowed outside the mock contract');
  };
  const first = await serve(t, files, env, providerFetch);
  const drafts = await (await first.request('/api/academy/admin/dates', { token: ADMIN })).json(); const dateId = drafts.dates[0].id;
  assert.equal((await first.request(`/api/academy/admin/dates/${dateId}/approve`, { method: 'POST', token: ADMIN, data: { checksConfirmed: true, publish: true, openRegistration: true } })).status, 200);
  const payload = { dateId, termsAccepted: true, customer: { name: 'Mock participant', email: 'buyer@example.test', phone: '0501234567' } };
  const created = await first.request('/api/academy/orders', { method: 'POST', data: payload, headers: { 'idempotency-key': 'self-hosted-order-key' } }); assert.equal(created.status, 201); const order = await created.json(); assert.equal(order.status, 'pending'); assert.equal(forms.length, 1);
  await first.close();
  const second = await serve(t, files, env, providerFetch);
  const existing = await (await second.request(`/api/academy/orders/${order.orderId}`, { token: order.orderAccessToken })).json(); assert.equal(existing.checkoutUrl, order.checkoutUrl); assert.equal(existing.status, 'pending');
  assert.equal((await second.request(`/api/academy/orders/${order.orderId}/reconcile`, { method: 'POST', data: { status: 'paid' }, token: order.orderAccessToken })).status, 200);
  assert.equal(second.runtime.store.all('registrations').length, 0);
  paid = true;
  for (let index = 0; index < 2; index++) { const settled = await second.request(`/api/academy/orders/${order.orderId}/reconcile`, { method: 'POST', data: {}, token: order.orderAccessToken }); assert.equal((await settled.json()).status, 'paid'); }
  assert.equal(second.runtime.store.all('registrations').length, 1); assert.equal(second.runtime.store.all('payment_events').length, 1); assert.equal(forms.length, 1);
  assert.equal((await second.request('/api/academy/admin/outbox/drain', { method: 'POST', token: ADMIN, data: {} })).status, 503);
});
