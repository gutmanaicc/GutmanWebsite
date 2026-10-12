import { fileURLToPath } from 'node:url';
import { createSelfHostedRuntime } from '../server/self-hosted-runtime.mjs';
import { createSelfHostedServer, loadSelfHostedApiHandlers } from '../server/self-hosted-http.mjs';

const port = Number(process.env.PORT || 3000);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('A valid PORT is required.');
const runtime = createSelfHostedRuntime();
let server;
try {
  const apiHandlers = await loadSelfHostedApiHandlers(fileURLToPath(new URL('../.self-hosted-api/', import.meta.url)));
  server = await createSelfHostedServer({ runtime, apiHandlers, staticDirectory: fileURLToPath(new URL('../dist/', import.meta.url)), preview: process.env.ACADEMY_PREVIEW !== '0' });
} catch (error) { runtime.close(); throw error; }
server.listen(port, process.env.ACADEMY_HOST || '0.0.0.0', () => console.log(`Gutman standalone Node24 website on port ${port}; payment mode ${runtime.store.mode}, provider ready ${runtime.checkout.ready}; preview ${process.env.ACADEMY_PREVIEW !== '0'}.`));
// No autonomous outbound sending. The owner-protected drain endpoint controls
// approved email delivery; reconciliation is server-authenticated and read-only at provider.
let busy = false;
const interval = setInterval(async () => {
  if (busy) return; busy = true;
  try { runtime.store.expireHolds(); await runtime.checkout.refreshPending(); } catch { /* No participant or provider diagnostic logging. */ }
  finally { busy = false; }
}, 60_000); interval.unref();
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  if (closing) return; closing = true; clearInterval(interval);
  server.close(() => { runtime.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 15_000).unref();
});
