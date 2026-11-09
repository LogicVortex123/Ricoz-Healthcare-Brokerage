import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  if (req.get('X-PracticeBridge-Request') !== '1') {
    next(new HttpError(403, 'Refresh the page and try again.', 'CSRF_REJECTED'));
    return;
  }
  next();
}
