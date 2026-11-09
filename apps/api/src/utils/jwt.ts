import jwt from 'jsonwebtoken';
import type { Env } from '../config/env';

export const SESSION_COOKIE = 'pb_session';
export const SESSION_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  role: string;
};

export function signSession(userId: string, role: string, env: Env) {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, {
    expiresIn: SESSION_SECONDS,
    issuer: 'practicebridge',
  });
}

export function verifySession(token: string, env: Env): SessionPayload {
  const payload = jwt.verify(token, env.jwtSecret, { issuer: 'practicebridge' });
  if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string') {
    throw new jwt.JsonWebTokenError('Invalid session');
  }
  return { sub: payload.sub, role: payload.role };
}

export function sessionCookieOptions(env: Env) {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_SECONDS * 1000,
  };
}
