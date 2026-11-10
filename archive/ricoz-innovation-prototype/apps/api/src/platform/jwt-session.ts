import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import mongoose, { ClientSession } from "mongoose";
import { Response, Request } from "express";
import { Session } from "./models";

const issuer = "healthcare-transition-api";
const audience = "healthcare-transition-web";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const random = () => randomBytes(32).toString("hex");
let developmentKey: string;
function signingKey() {
  if (process.env.JWT_SECRET) {
    if (Buffer.byteLength(process.env.JWT_SECRET) < 32)
      throw new Error("JWT_SECRET must contain at least 32 bytes");
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("JWT_SECRET is required in production");
  if (!developmentKey) {
    if (process.env.NODE_ENV === "test") developmentKey = random();
    else {
      const location = path.resolve(
        process.env.JWT_SECRET_FILE || ".dev-jwt-secret",
      );
      try {
        developmentKey = readFileSync(location, "utf8").trim();
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
        const generated = random();
        try {
          writeFileSync(location, generated, { flag: "wx", mode: 0o600 });
        } catch (failure: any) {
          if (failure.code !== "EEXIST") throw failure;
        }
        developmentKey = readFileSync(location, "utf8").trim();
      }
    }
  }
  if (Buffer.byteLength(developmentKey) < 32)
    throw new Error("JWT signing key is invalid");
  return developmentKey;
}
export function signAccessToken(
  userId: string,
  sessionId: string,
  seconds = 900,
) {
  return jwt.sign({ sid: sessionId }, signingKey(), {
    algorithm: "HS256",
    subject: userId,
    jwtid: random(),
    expiresIn: seconds,
    issuer,
    audience,
  });
}
export function verifyAccessToken(value: string): { sub: string; sid: string } {
  const payload = jwt.verify(value, signingKey(), {
    algorithms: ["HS256"],
    issuer,
    audience,
    maxAge: "15m",
    clockTolerance: 2,
  });
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    !/^[a-f\d]{24}$/i.test(payload.sub) ||
    !/^[a-f\d]{24}$/i.test(payload.sid) ||
    !payload.exp ||
    !payload.jti
  )
    throw new Error("Invalid token claims");
  return { sub: payload.sub, sid: payload.sid };
}
export function readCookie(req: Request, name: string) {
  return req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
export function readAccessToken(req: Request) {
  if (req.headers.authorization)
    return /^Bearer ([^ ]+)$/.exec(req.headers.authorization)?.[1];
  return readCookie(req, "hpt_session");
}
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});
export function setSessionCookies(
  res: Response,
  pair: { accessToken: string; refreshToken: string },
) {
  res.cookie("hpt_session", pair.accessToken, {
    ...cookieOptions(),
    maxAge: 15 * 60000,
  });
  res.cookie("hpt_refresh", pair.refreshToken, {
    ...cookieOptions(),
    path: "/api/v1/auth",
    maxAge: 8 * 3600000,
  });
}
export function clearSessionCookies(res: Response) {
  res.clearCookie("hpt_session", cookieOptions());
  res.clearCookie("hpt_refresh", { ...cookieOptions(), path: "/api/v1/auth" });
}
export async function createJwtSession(
  userId: string,
  mode: string,
  mfaVerified: boolean,
  session?: ClientSession,
) {
  const sid = String(new mongoose.Types.ObjectId());
  const accessToken = signAccessToken(userId, sid);
  const refreshToken = `${sid}.${random()}`;
  const csrf = random();
  await Session.create(
    [
      {
        _id: sid,
        hash: digest(accessToken),
        refreshHash: digest(refreshToken),
        userId,
        csrf,
        expiresAt: new Date(Date.now() + 8 * 3600000),
        mfaVerified,
        authMode: mode,
      },
    ],
    { session },
  );
  return { sid, accessToken, refreshToken, csrf };
}
