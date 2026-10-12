import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { CommerceStore } from '../server/commerce.mjs';
import { applyOwnerSchedule } from '../server/owner-schedule.mjs';

const apply = process.argv.includes('--apply');
const schedule = JSON.parse(await readFile(new URL('../shared/academy-owner-schedule.json', import.meta.url), 'utf8'));
const path = process.env.ACADEMY_DB_PATH;
if (!path || !isAbsolute(path) || path === ':memory:') throw new Error('An explicit persistent database path is required.');
const store = new CommerceStore({ path });
try { console.log(JSON.stringify(applyOwnerSchedule(store, schedule, { apply }))); }
finally { store.close(); }
