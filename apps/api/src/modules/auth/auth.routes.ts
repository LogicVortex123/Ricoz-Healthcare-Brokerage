import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { HttpError } from '../../utils/errors';
import { hashPassword, verifyPassword } from '../../utils/password';
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from '../../utils/jwt';
import { validateBody } from '../../middleware/validate';
import { getEnv, requireAuth } from '../../middleware/auth';
import { PUBLIC_ROLES, User } from '../users/user.model';
import { publicUser } from '../users/user.presenter';
import { recordAudit } from '../audit/audit.service';

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name.')
    .max(80)
    .refine((value) => Array.from(value).every((character) => character.charCodeAt(0) >= 32), 'Enter a valid name.'),
  email: z.string().trim().email('Enter a valid email address.').max(254).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .max(72, 'Use 72 characters or fewer.')
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/[0-9]/, 'Include at least one number.'),
  role: z.enum(PUBLIC_ROLES, { errorMap: () => ({ message: 'Choose buyer or seller. Administrator access cannot be self-assigned.' }) }),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Enter your password.').max(72),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res) => {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in a few minutes.' } });
  },
});

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body as z.infer<typeof registerSchema>;
    if (role !== 'SELLER' && role !== 'BUYER') {
      throw new HttpError(403, 'Administrator access cannot be self-assigned.', 'FORBIDDEN');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists.', 'EMAIL_IN_USE');
    }
    const user = await User.create({ name, email, passwordHash: await hashPassword(password), role });
    const token = signSession(String(user._id), user.role, getEnv(req));
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(getEnv(req)));
    await recordAudit({ actorId: String(user._id), action: 'REGISTER', entityType: 'user', entityId: String(user._id) });
    res.status(201).json({ data: { user: publicUser(user) } });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!user || !valid) {
      await recordAudit({ action: 'LOGIN_FAILED', entityType: 'user', metadata: { email } });
      throw new HttpError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
    }
    const token = signSession(String(user._id), user.role, getEnv(req));
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(getEnv(req)));
    await recordAudit({ actorId: String(user._id), action: 'LOGIN', entityType: 'user', entityId: String(user._id) });
    res.json({ data: { user: publicUser(user) } });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const env = getEnv(req);
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string') {
      try {
        const session = verifySession(token, env);
        await recordAudit({ actorId: session.sub, action: 'LOGOUT', entityType: 'user', entityId: session.sub });
      } catch {
        // An expired session can still be cleared.
      }
    }
    res.clearCookie(SESSION_COOKIE, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
    });
    res.json({ data: { success: true } });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: { user: publicUser(req.user!) } });
  }),
);
