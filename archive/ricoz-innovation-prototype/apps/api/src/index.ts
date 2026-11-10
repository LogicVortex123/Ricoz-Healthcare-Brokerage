/**
 * Legacy prototype entry. The authoritative Express API is `src/server.ts`
 * (modular platform under `src/platform/`). Prefer `npm run dev` / `npm start`
 * which target server.ts. This file is retained only for historical reference.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import workflow, { User, hashPassword } from './workflow';
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '2mb' }));
app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.get('/health', (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ success: mongoose.connection.readyState === 1 }));
app.use('/api/v1', workflow);
app.use((_req, res) => res.status(404).json({ success: false, error: { message: 'Endpoint not found' } }));
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error instanceof ZodError ? 422 : error.code === 11000 ? 409 : error.name === 'CastError' ? 404 : error.status || 500;
  res.status(status).json({ success: false, error: { message: error instanceof ZodError ? error.issues.map(x => x.message).join('; ') : error.code === 11000 ? 'Account already exists' : status === 500 ? 'Request failed' : error.message } });
});
export async function start() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in apps/api/.env');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) throw new Error('Admin password must contain at least 12 characters');
    await User.updateOne({ email: process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase() }, { $setOnInsert: { name: 'Brokerage Administrator', password: hashPassword(process.env.BOOTSTRAP_ADMIN_PASSWORD), role: 'admin', qualification: 'approved' } }, { upsert: true });
  }
  return app.listen(Number(process.env.PORT || 4000), '127.0.0.1', () => console.log('Healthcare Transition API listening'));
}
if (require.main === module) start().catch(() => { console.error('API startup failed. Check database connectivity and configuration.'); process.exitCode = 1; });
export default app;
