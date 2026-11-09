import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { HttpError, type FieldError } from '../utils/errors';

export function formatZod(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'form',
    message: issue.message,
  }));
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      next(new HttpError(400, 'Check the highlighted fields.', 'VALIDATION_ERROR', formatZod(parsed.error)));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
