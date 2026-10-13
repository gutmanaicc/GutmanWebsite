import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, chmodSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadVerifiedMorningMerchant } from '../server/morning-merchant-state.mjs';
import { createSelfHostedRuntime } from '../server/self-hosted-runtime.mjs';

const clientId = 'test-api-identity';
const now = Date.parse('2026-10-13T10:00:00Z');
const verified = { exemption: true, businessTaxId: '123456789', verifiedAt: new Date(now).toISOString(), apiIdDigest: createHash('sha256').update(clientId).digest('hex'), checkoutOrigins: ['https://verified-checkout.example.test'], preflight: { url: 'https://private-checkout.example.test/never-export' } };
function fixture(t) { const dir = mkdtempSync(join(tmpdir(), 'morning-identity-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return { dir, path: join(dir, 'morning-merchant.json') }; }

test('verified merchant state stays private and is bound to the actual API identity, permissions and freshness', t => {
  const { path } = fixture(t); const read = id => loadVerifiedMorningMerchant(path, { clientId: id ?? clientId, clock: () => now });
  assert.equal(read(), null);
  const write = change => writeFileSync(path, JSON.stringify({ ...verified, ...change }), { mode: 0o600 });
  write({}); assert.deepEqual(read(), { verified: true, businessTaxId: '123456789', checkoutOrigins: verified.checkoutOrigins });
  assert.equal(JSON.stringify(read()).includes('never-export'), false); assert.equal(read('another-api-id'), null);
  for (const change of [{ exemption: false }, { businessTaxId: 'missing' }, { paymentPluginId: 'unverified-plugin' }, { verifiedAt: new Date(now - 32 * 86400000).toISOString() }, { verifiedAt: new Date(now + 600000).toISOString() }, { checkoutOrigins: ['https://check.example.test/path'] }, { checkoutOrigins: ['http://check.example.test'] }, { checkoutOrigins: ['https://user:password@check.example.test'] }]) { write(change); assert.equal(read(), null); }
  write({}); chmodSync(path, 0o644); assert.equal(read(), null); chmodSync(path, 0o600);
  rmSync(path); const target = `${path}.target`; writeFileSync(target, JSON.stringify(verified), { mode: 0o600 }); symlinkSync(target, path); assert.equal(read(), null);
});

test('the standalone runtime loads the verified private identity without publishing it or needing an unused callback-signing key', t => {
  const { path, dir } = fixture(t); writeFileSync(path, JSON.stringify(verified), { mode: 0o600 });
  const env = { ACADEMY_DB_PATH: join(dir, 'academy.sqlite'), ACADEMY_PAYMENT_MODE: 'morning', ACADEMY_ORDER_SECRET: 'test-order-secret-at-least-thirty-two-characters', ACADEMY_PUBLIC_ORIGIN: 'https://academy.example.test', ACADEMY_BOOKING_TERMS_APPROVED: '1', MORNING_API_ID: clientId, MORNING_API_SECRET: 'test-only-provider-secret' };
  const runtime = createSelfHostedRuntime(env, { clock: () => now });
  try { assert.equal(runtime.client.ready, true); assert.equal(runtime.checkout.ready, true); assert.equal(runtime.client.getReadiness().webhookSecretConfigured, false); assert.equal(JSON.stringify(runtime.client.getReadiness()).includes('123456789'), false); } finally { runtime.close(); }
  const changed = createSelfHostedRuntime({ ...env, MORNING_API_ID: 'new-unverified-api' }, { clock: () => now });
  try { assert.equal(changed.checkout.ready, false); } finally { changed.close(); }
});
