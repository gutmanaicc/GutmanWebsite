import { execFileSync } from 'node:child_process';

const candidates = ['morning-api', 'greeninvoice-api', 'Morning', 'GreenInvoice', 'morning', 'מורנינג'];
const valid = value => typeof value === 'string' && value.length > 0 && value.length <= 4096 && !/[\x00-\x1f]/.test(value);

/** Read only the explicitly requested Morning items; never enumerate or dump the keychain. */
export function loadMorningCredentials({ env = process.env, platform = process.platform, execute = execFileSync, service, idService, secretService, account } = {}) {
  const id = env.MORNING_API_ID;
  const secret = env.MORNING_API_SECRET;
  if (id || secret) {
    if (!valid(id) || !valid(secret)) throw new Error('Both MORNING_API_ID and MORNING_API_SECRET must be configured on the server.');
    return { id, secret, source: 'environment' };
  }
  if (platform !== 'darwin') throw new Error('macOS Keychain is accessible only from a local Mac execution environment. No credential was read.');
  if (service && (idService || secretService)) throw new Error('Use either one JSON credential item or two separate items.');
  if (Boolean(idService) !== Boolean(secretService)) throw new Error('Both Keychain item names are required for separate credentials.');
  for (const label of [service, idService, secretService, account].filter(value => value !== undefined)) {
    if (!valid(label)) throw new Error('Invalid Keychain item name.');
  }
  function read(label) {
    const args = ['find-generic-password', '-s', label, ...(account ? ['-a', account] : []), '-w'];
    try {
      // stdout is captured in memory, never inherited by the terminal or included in errors.
      return execute('/usr/bin/security', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16384 }).replace(/\r?\n$/, '');
    } catch { return null; }
  }
  if (idService) {
    const pair = { id: read(idService), secret: read(secretService), source: 'keychain' };
    if (!valid(pair.id) || !valid(pair.secret)) throw new Error('The two specified Morning items could not be read. Check their service names and macOS access prompt.');
    return pair;
  }
  const found = [];
  for (const label of service ? [service] : candidates) {
    const raw = read(label);
    if (raw === null) continue;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new Error('The Morning item is not JSON. Specify separate API ID and secret item names instead.'); }
    const pair = { id: parsed?.id ?? parsed?.client_id, secret: parsed?.secret ?? parsed?.client_secret, source: 'keychain' };
    if (!valid(pair.id) || !valid(pair.secret)) throw new Error('The Morning item must contain id/secret or client_id/client_secret. No value was printed.');
    found.push(pair);
  }
  if (found.length !== 1) throw new Error(found.length ? 'Multiple Morning credential items found. Specify the intended service name.' : 'No Morning credential item found. Specify its exact Keychain service name.');
  return found[0];
}
