import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';

/** Legal identity stays on the owner's VPS, bound to the verified API ID. */
export function loadVerifiedMorningMerchant(path, { clientId, clock = Date.now } = {}) {
  if (!isAbsolute(path) || typeof clientId !== 'string' || !clientId) return null;
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || (stat.mode & 0o777) !== 0o600 || stat.size > 16384) return null;
    const record = JSON.parse(readFileSync(path, 'utf8'));
    const verifiedAt = Date.parse(record.verifiedAt);
    const age = clock() - verifiedAt;
    if (record.exemption !== true || !/^\d{9}$/.test(record.businessTaxId || '') || record.apiIdDigest !== createHash('sha256').update(clientId).digest('hex') || !Number.isFinite(age) || age < -300000 || age > 31 * 86400000) return null;
    const checkoutOrigins = Array.isArray(record.checkoutOrigins) ? record.checkoutOrigins : [];
    if (checkoutOrigins.length > 5 || checkoutOrigins.some(origin => { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || url.port; })) return null;
    if (record.paymentPluginId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.paymentPluginId)) return null;
    return { businessTaxId: record.businessTaxId, checkoutOrigins, ...(record.paymentPluginId ? { paymentPluginId: record.paymentPluginId } : {}), verified: true };
  } catch { return null; }
}
