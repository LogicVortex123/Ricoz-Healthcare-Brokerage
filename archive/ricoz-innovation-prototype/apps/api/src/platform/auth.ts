import { Router } from "express";
import {
  createJwtSession,
  signAccessToken,
  verifyAccessToken,
  readAccessToken,
  readCookie,
  setSessionCookies,
  clearSessionCookies,
} from "./jwt-session";
import { Response } from "express";
import { authConfiguration, simpleDevelopmentAuth } from "./auth-mode";
import { authLimit } from "./limits";
import argon2 from "argon2";
import { TOTP, Secret } from "otpauth";
import { z } from "zod";
import { ClientSession } from "mongoose";
import {
  AuthToken,
  Membership,
  Organization,
  Outbox,
  Session,
  User,
} from "./models";
import {
  audit,
  fail,
  hash,
  hasRole,
  ok,
  Req,
  route,
  secret,
  transaction,
  uid,
} from "./core";

export const auth = Router();
const tokenFrom = readAccessToken;
const profile = (u: any) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  verified: !!u.verified && !u.developmentVerification,
  verificationDeferred: !!u.developmentVerification,
  mfaEnabled: u.mfaEnabled,
  deletionRequestedAt: u.deletionRequestedAt,
});
const email = z
  .string()
  .email()
  .max(254)
  .transform((x) => x.toLowerCase());
const newPassword = () =>
  z.string().min(authConfiguration().passwordMinimum).max(128);
async function signIn(req: Req, res: Response, user: any, mfaVerified = false) {
  const previous = tokenFrom(req);
  if (previous) await Session.deleteOne({ hash: hash(previous) });
  const mode = authConfiguration().mode;
  const pair = await createJwtSession(String(user._id), mode, mfaVerified);
  const csrf = pair.csrf;
  setSessionCookies(res, pair);
  await audit(
    { ...req, actor: user } as Req,
    "auth.login",
    String(user._id),
    undefined,
    { mode },
  );
  const privileged = await Membership.exists({
    userId: String(user._id),
    active: true,
    role: { $in: ["superAdmin", "manager", "broker"] },
  });
  return {
    user: profile(user),
    csrf,
    authMode: mode,
    mfaSetupRequired: !simpleDevelopmentAuth() && !!privileged && !mfaVerified,
  };
}
auth.use(authLimit);
auth.get(
  "/config",
  route(async (_req, res) => ok(res, authConfiguration())),
);
auth.get("/status", route(async (req, res) => ok(res, { hasSession: !!(readAccessToken(req) || readCookie(req, "hpt_refresh")) })));
auth.post(
  "/refresh",
  route(async (req, res) => {
    z.object({}).strict().parse(req.body);
    if (
      req.get("Origin") !== (process.env.WEB_ORIGIN || "http://localhost:3000")
    )
      fail(403, "Same-origin refresh required");
    const refresh = readCookie(req, "hpt_refresh");
    if (!refresh || !/^[a-f\d]{24}\.[a-f\d]{64}$/i.test(refresh))
      fail(401, "Session expired. Please sign in again.");
    const sid = refresh.split(".")[0];
    const session: any = await Session.findById(sid);
    if (!session || session.expiresAt <= new Date())
      fail(401, "Session expired. Please sign in again.");
    if (session.refreshHash !== hash(refresh)) {
      if (
        session.previousRefreshHash === hash(refresh) &&
        session.refreshRotatedAt &&
        Date.now() - session.refreshRotatedAt.getTime() < 5000
      )
        fail(409, "Refresh already rotated. Retry with the current cookie.");
      await Session.deleteOne({ _id: sid });
      clearSessionCookies(res);
      fail(401, "Refresh token reuse detected. Please sign in again.");
    }
    const user: any = await User.findById(session.userId);
    if (
      !user ||
      user.suspended ||
      ((!user.verified || user.developmentVerification) &&
        !simpleDevelopmentAuth()) ||
      (session.authMode === "developmentSimple" && !simpleDevelopmentAuth()) ||
      !(await Membership.exists({ userId: session.userId, active: true }))
    ) {
      await Session.deleteOne({ _id: sid });
      clearSessionCookies(res);
      fail(401, "Account or session is unavailable");
    }
    const accessToken = signAccessToken(
      session.userId,
      sid,
      Math.max(
        1,
        Math.min(
          900,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
        ),
      ),
    );
    const refreshToken = `${sid}.${secret()}`;
    const updated = await Session.updateOne(
      { _id: sid, refreshHash: hash(refresh), expiresAt: { $gt: new Date() } },
      {
        $set: {
          hash: hash(accessToken),
          refreshHash: hash(refreshToken),
          previousRefreshHash: hash(refresh),
          refreshRotatedAt: new Date(),
        },
      },
    );
    if (!updated.modifiedCount)
      fail(409, "Refresh already rotated. Retry with the current cookie.");
    setSessionCookies(res, { accessToken, refreshToken });
    await audit({ ...req, actor: user } as Req, "auth.refreshed", sid);
    ok(res, { csrf: session.csrf, authMode: authConfiguration().mode });
  }),
);
function requireEmailTransport() {
  if (
    process.env.DEV_EMAIL_OUTBOX !== "true" ||
    process.env.NODE_ENV === "production"
  )
    fail(503, "Email transport is not configured");
}
const dummyHash = argon2.hash(secret(), { type: argon2.argon2id });
export async function issue(
  userId: string,
  to: string,
  purpose: string,
  payload?: any,
  session?: ClientSession,
) {
  requireEmailTransport();
  const token = secret();
  const expiresAt = new Date(Date.now() + 3600000);
  const persist = async (s: ClientSession) => {
    await AuthToken.create(
      [{ userId, hash: hash(token), purpose, payload, expiresAt }],
      { session: s },
    );
    await Outbox.create([{ to, kind: purpose, token, expiresAt }], {
      session: s,
    });
  };
  if (session) await persist(session);
  else await transaction(persist);
}
auth.post(
  "/register",
  route(async (req, res) => {
    if (!simpleDevelopmentAuth()) requireEmailTransport();
    const b = z
      .object({
        name: z.string().min(2).max(100),
        email,
        password: newPassword(),
        capacity: z.enum(["seller", "buyer"]),
      })
      .strict()
      .parse(req.body);
    if (await User.exists({ email: b.email })) {
      if (simpleDevelopmentAuth())
        fail(409, "This email already has an account. Please sign in.");
      return ok(res, {
        message: "Check your email for verification instructions.",
      });
    }
    const passwordHash = await argon2.hash(b.password, {
      type: argon2.argon2id,
    });
    await transaction(async (s) => {
      const [u] = await User.create(
        [
          {
            name: b.name,
            email: b.email,
            password: passwordHash,
            verified: simpleDevelopmentAuth(),
            developmentVerification: simpleDevelopmentAuth(),
          },
        ],
        { session: s },
      );
      const [o] = await Organization.create(
        [{ name: `${b.name}'s account`, kind: b.capacity }],
        { session: s },
      );
      await Membership.create(
        [
          {
            userId: String(u._id),
            organizationId: String(o._id),
            role: b.capacity,
            active: true,
          },
        ],
        { session: s },
      );
      if (process.env.DEV_EMAIL_OUTBOX === "true")
        await issue(String(u._id), b.email, "verify", undefined, s);
    });
    if (simpleDevelopmentAuth()) {
      const user = await User.findOne({ email: b.email });
      return ok(res, await signIn(req, res, user), 201);
    }
    return ok(res, {
      message: "Check your email for verification instructions.",
    });
  }),
);
auth.post(
  "/verify",
  route(async (req, res) => {
    const b = z
      .object({ token: z.string().length(64) })
      .strict()
      .parse(req.body);
    await transaction(async (s) => {
      const t = await AuthToken.findOneAndUpdate(
        {
          hash: hash(b.token),
          purpose: "verify",
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { consumedAt: new Date() } },
        { session: s },
      );
      if (!t) fail(422, "Invalid or expired verification token");
      await User.updateOne(
        { _id: t.userId },
        { $set: { verified: true, developmentVerification: false } },
        { session: s },
      );
    });
    ok(res, { message: "Email verified. You can sign in." });
  }),
);
auth.post(
  "/resend-verification",
  route(async (req, res) => {
    requireEmailTransport();
    const b = z.object({ email }).strict().parse(req.body);
    const u: any = await User.findOne({
      email: b.email,
      $or: [{ verified: { $ne: true } }, { developmentVerification: true }],
      suspended: { $ne: true },
    });
    if (u) await issue(String(u._id), b.email, "verify");
    ok(res, {
      message:
        "If an unverified account exists, verification instructions have been queued.",
    });
  }),
);
auth.post(
  "/login",
  route(async (req, res) => {
    const b = z
      .object({
        email,
        password: z.string().min(1).max(128),
        code: z
          .string()
          .regex(/^\d{6}$/)
          .optional(),
      })
      .strict()
      .parse(req.body);
    const u: any = await User.findOne({ email: b.email });
    if (
      !(await argon2.verify(u?.password || (await dummyHash), b.password)) ||
      !u
    )
      fail(401, "Invalid credentials");
    if (
      u.suspended ||
      ((!u.verified || u.developmentVerification) && !simpleDevelopmentAuth())
    )
      fail(403, "Account is suspended or email is not verified");
    let mfaVerified = false;
    if (u.mfaEnabled && !simpleDevelopmentAuth()) {
      if (!b.code) fail(401, "MFA code required");
      const step = new TOTP({
        secret: Secret.fromBase32(u.mfaSecret),
      }).validate({ token: b.code, window: 1 });
      if (step === null) fail(401, "Invalid MFA code");
      const counter = Math.floor(Date.now() / 30000) + step;
      const changed = await User.updateOne(
        {
          _id: u._id,
          $or: [{ mfaLastStep: { $lt: counter } }, { mfaLastStep: null }],
        },
        { $set: { mfaLastStep: counter } },
      );
      if (!changed.modifiedCount) fail(401, "MFA code already used");
      mfaVerified = true;
    }
    ok(res, await signIn(req, res, u, mfaVerified));
  }),
);
auth.post(
  "/recovery",
  route(async (req, res) => {
    requireEmailTransport();
    const b = z.object({ email }).strict().parse(req.body);
    const u = await User.findOne({ email: b.email });
    if (u) await issue(String(u._id), b.email, "reset");
    ok(res, {
      message: "If the account exists, recovery instructions have been queued.",
    });
  }),
);
auth.post(
  "/reset",
  route(async (req, res) => {
    const b = z
      .object({ token: z.string().length(64), password: newPassword() })
      .strict()
      .parse(req.body);
    const passwordHash = await argon2.hash(b.password);
    await transaction(async (s) => {
      const t = await AuthToken.findOneAndUpdate(
        {
          hash: hash(b.token),
          purpose: "reset",
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { consumedAt: new Date() } },
        { session: s },
      );
      if (!t) fail(422, "Invalid or expired reset token");
      await User.updateOne(
        { _id: t.userId },
        { $set: { password: passwordHash } },
        { session: s },
      );
      await Session.deleteMany({ userId: t.userId }, { session: s });
    });
    ok(res, { message: "Password reset; sessions revoked." });
  }),
);
export async function authenticate(req: Req, res: any, next: any) {
  try {
    const token = tokenFrom(req);
    if (!token) fail(401, "Sign in required");
    let claims;
    try {
      claims = verifyAccessToken(token);
    } catch {
      fail(401, "Invalid or expired access token");
    }
    req.session = await Session.findOne({
      _id: claims.sid,
      userId: claims.sub,
      hash: hash(token),
      expiresAt: { $gt: new Date() },
    });
    if (!req.session) fail(401, "Session expired");
    if (
      req.session.authMode === "developmentSimple" &&
      !simpleDevelopmentAuth()
    )
      fail(401, "Development sign-in is disabled. Please sign in again.");
    req.actor = await User.findById(req.session.userId);
    if (
      !req.actor ||
      req.actor.suspended ||
      ((!req.actor.verified || req.actor.developmentVerification) &&
        !simpleDevelopmentAuth())
    )
      fail(401, "Account unavailable");
    req.memberships = await Membership.find({
      userId: uid(req),
      active: true,
    }).lean();
    if (!req.memberships.length) fail(403, "Active membership required");
    if (
      !req.headers.authorization &&
      !["GET", "HEAD"].includes(req.method) &&
      req.get("X-CSRF-Token") !== req.session.csrf
    )
      fail(403, "Invalid CSRF token");
    if (
      !simpleDevelopmentAuth() &&
      hasRole(req, ["superAdmin", "manager", "broker"]) &&
      !req.session.mfaVerified &&
      ![
        "/account",
        "/account/mfa/setup",
        "/account/mfa/confirm",
        "/auth/logout",
      ].includes(req.path)
    )
      fail(403, "Privileged MFA enrollment and verification required");
    next();
  } catch (e) {
    next(e);
  }
}
export const account = Router();
account.get(
  "/account",
  route(async (req, res) =>
    ok(res, {
      user: profile(req.actor),
      memberships: req.memberships,
      csrf: req.session.csrf,
      authMode: authConfiguration().mode,
      mfaSetupRequired:
        !simpleDevelopmentAuth() &&
        hasRole(req, ["superAdmin", "manager", "broker"]) &&
        !req.session.mfaVerified,
    }),
  ),
);
account.patch(
  "/account",
  route(async (req, res) => {
    const b = z
      .object({ name: z.string().min(2).max(100) })
      .strict()
      .parse(req.body);
    await User.updateOne({ _id: uid(req) }, { $set: b });
    ok(res, b);
  }),
);
account.post(
  "/account/deletion-request",
  route(async (req, res) => {
    await User.updateOne(
      { _id: uid(req) },
      { $set: { deletionRequestedAt: new Date() } },
    );
    await audit(req, "account.deletionRequested", uid(req));
    ok(res, {
      message:
        "Request recorded; legal holds and retention require human review.",
    });
  }),
);
account.post(
  "/auth/logout",
  route(async (req, res) => {
    await Session.deleteOne({ _id: req.session._id });
    clearSessionCookies(res);
    ok(res, {});
  }),
);
account.post(
  "/account/mfa/setup",
  route(async (req, res) => {
    if (req.actor.mfaEnabled) fail(409, "MFA already enabled");
    const t = new TOTP({
      issuer: "Healthcare Transitions",
      label: req.actor.email,
    });
    await User.updateOne(
      { _id: uid(req) },
      { $set: { mfaSecret: t.secret.base32 } },
    );
    ok(res, { secret: t.secret.base32, uri: t.toString() });
  }),
);
account.post(
  "/account/mfa/confirm",
  route(async (req, res) => {
    if (req.actor.mfaEnabled) fail(409, "MFA is already enrolled");
    const b = z
      .object({ code: z.string().regex(/^\d{6}$/) })
      .strict()
      .parse(req.body);
    if (
      !req.actor.mfaSecret ||
      new TOTP({ secret: Secret.fromBase32(req.actor.mfaSecret) }).validate({
        token: b.code,
        window: 1,
      }) === null
    )
      fail(422, "Invalid MFA code");
    let pair: Awaited<ReturnType<typeof createJwtSession>>;
    await transaction(async (s) => {
      const changed = await User.updateOne(
        {
          _id: uid(req),
          mfaEnabled: { $ne: true },
          mfaSecret: req.actor.mfaSecret,
        },
        {
          $set: {
            mfaEnabled: true,
            mfaLastStep: Math.floor(Date.now() / 30000),
          },
        },
        { session: s },
      );
      if (!changed.modifiedCount) fail(409, "Enrollment changed; retry setup");
      await Session.deleteMany({ userId: uid(req) }, { session: s });
      pair = await createJwtSession(
        uid(req),
        authConfiguration().mode,
        true,
        s,
      );
      await audit(req, "mfa.enabled", uid(req), undefined, undefined, s);
    });
    setSessionCookies(res, pair!);
    ok(res, { csrf: pair!.csrf });
  }),
);
