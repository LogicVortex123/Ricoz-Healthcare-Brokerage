import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../utils/errors';
import { redactSecrets } from '../utils/secrets';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That record could not be found.' } });
    return;
  }

  if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'That record already exists.' } });
    return;
  }

  const message = error instanceof Error ? redactSecrets(error.message) : 'Unknown error';
  console.error('[practicebridge] Unhandled error.', message);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
}
