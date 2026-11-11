import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import type { Env } from './config/env';
import { requireCsrf } from './middleware/csrf';
import { errorHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { practiceRouter } from './modules/practices/practice.routes';
import { listingRouter } from './modules/listings/listing.routes';
import { inquiryRouter } from './modules/inquiries/inquiry.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { dealRouter } from './modules/deals/deal.routes';

export function createApp(env: Env, options?: { website?: (req: Request, res: Response) => void }) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.env = env;
  app.use('/api', helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    '/api',
    cors({
      origin: env.webOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-PracticeBridge-Request'],
    }),
  );
  app.use('/api', express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', requireCsrf);

  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.json({ data: { status: 'ok', database: connected ? 'connected' : 'disconnected', service: 'practicebridge-api' } });
  });

  if (!options?.website) {
    app.get('/', (_req, res) => {
      res.json({ data: { service: 'practicebridge-api', health: '/api/health' } });
    });
  }

  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/practices', practiceRouter);
  app.use('/api/listings', listingRouter);
  app.use('/api/inquiries', inquiryRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/deals', dealRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That API endpoint does not exist.' } });
  });

  if (options?.website) app.use(options.website);
  app.use(errorHandler);
  return app;
}
