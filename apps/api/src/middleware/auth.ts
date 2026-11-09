import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { HydratedDocument } from 'mongoose';
import type { Env } from '../config/env';
import { User, type IUser, type UserRole } from '../modules/users/user.model';
import { HttpError } from '../utils/errors';
import { SESSION_COOKIE, verifySession } from '../utils/jwt';

declare global {
  // Express exposes request user data through this namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
    }
  }
}

export function getEnv(req: Request): Env {
  return req.app.locals.env as Env;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== 'string') {
      throw new HttpError(401, 'Sign in to continue.', 'UNAUTHENTICATED');
    }
    let session;
    try {
      session = verifySession(token, getEnv(req));
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new HttpError(401, 'Your session has expired. Sign in again.', 'SESSION_EXPIRED');
      }
      throw new HttpError(401, 'Sign in to continue.', 'UNAUTHENTICATED');
    }
    const user = await User.findById(session.sub);
    if (!user) {
      throw new HttpError(401, 'Sign in to continue.', 'UNAUTHENTICATED');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, 'Sign in to continue.', 'UNAUTHENTICATED'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have access to this action.', 'FORBIDDEN'));
      return;
    }
    next();
  };
}
