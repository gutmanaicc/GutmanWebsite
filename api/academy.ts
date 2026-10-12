// Shared Node24 handler: private encrypted CAS state, never temporary SQLite persistence.
// @ts-ignore JavaScript server modules are validated by node --test independently of frontend tsconfig.
import { createCloudRuntime } from '../server/cloud-runtime.mjs';

let runtime: ReturnType<typeof createCloudRuntime>;
export default async function handler(req: unknown, res: { setHeader(name: string, value: string): void; status(code: number): { json(value: unknown): void } }) {
  try {
    runtime ||= createCloudRuntime();
    await runtime.handler(req, res);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: { code: 'PAYMENT_UNAVAILABLE', message: 'מערכת ההרשמה אינה זמינה כרגע. נסו שוב בהמשך.' } });
  }
}
