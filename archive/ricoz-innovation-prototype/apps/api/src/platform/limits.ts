import { RequestHandler } from "express";
import { RateLimit } from "./models";
import { fail, hash, Req } from "./core";

export async function consume(
  scope: string,
  identity: string,
  maximum: number,
  windowMs: number,
) {
  const bucket = Math.floor(Date.now() / windowMs);
  const key = hash(`${scope}:${identity}:${bucket}`);
  let counter: any;
  try {
    counter = await RateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error: any) {
    if (error.code !== 11000) throw error;
    counter = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );
  }
  if (!counter || counter.count > maximum)
    fail(
      429,
      "Too many attempts. Try again after the current rate-limit window.",
    );
}
export const authLimit: RequestHandler = (req, _res, next) => {
  if (req.method === "GET") return next();
  const action = req.path.split("/")[1] || "auth";
  consume(
    `auth:${action}`,
    req.ip || "unknown",
    action === "login" ? 20 : 30,
    15 * 60000,
  )
    .then(() => next())
    .catch(next);
};
export const sensitiveLimit: RequestHandler = (req: Req, _res, next) => {
  if (["GET", "HEAD"].includes(req.method)) return next();
  consume("sensitive", String(req.actor._id), 180, 15 * 60000)
    .then(() => next())
    .catch(next);
};
