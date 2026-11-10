import { createHash, randomBytes } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  Audit,
  Notification,
  Operation,
  Practice,
  Deal,
  Grant,
  Interest,
  Nda,
} from "./models";
import { collectionPage } from "./contracts";

export const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status });
}
export type Req = Request & {
  actor?: any;
  session?: any;
  memberships?: any[];
  requestId?: string;
};
export const route =
  (fn: (req: Req, res: Response) => Promise<any>) =>
  (req: Req, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
export const ok = (res: Response, data: any, status = 200) =>
  res.status(status).json({
    success: true,
    data,
    ...(res.locals.pagination ? { pagination: res.locals.pagination } : {}),
    requestId: res.locals.requestId,
  });
export async function list(
  req: Req,
  res: Response,
  model: any,
  filter: any,
  map: (value: any) => any = (value) => value,
  projection?: string,
  pagination?: { cursor?: string; limit: number; sort: "oldest" | "newest" },
) {
  const q = pagination || collectionPage.parse(req.query);
  let query = model
    .find({
      $and: [
        filter,
        ...(q.cursor
          ? [{ _id: { [q.sort === "newest" ? "$lt" : "$gt"]: q.cursor } }]
          : []),
      ],
    })
    .sort({ _id: q.sort === "newest" ? -1 : 1 })
    .limit(q.limit + 1);
  if (projection) query = query.select(projection);
  const items: any[] = await query.lean();
  res.locals.pagination = {
    nextCursor: items.length > q.limit ? String(items[q.limit - 1]._id) : null,
    limit: q.limit,
  };
  return ok(res, items.slice(0, q.limit).map(map));
}
export const uid = (req: Req) => String(req.actor._id);
export const hasRole = (req: Req, roles: string[], org?: string) =>
  req.memberships!.some(
    (m) => roles.includes(m.role) && (!org || m.organizationId === org),
  );
export const manages = (req: Req, p: any) =>
  hasRole(req, ["manager"], p.brokerageId) ||
  (p.brokerId === uid(req) && hasRole(req, ["broker"], p.brokerageId));
export const owns = (req: Req, p: any) =>
  p.ownerId === uid(req) && hasRole(req, ["seller"]);
export const practiceFilter = (req: Req) => ({
  $or: [
    { ownerId: hasRole(req, ["seller"]) ? uid(req) : "__none" },
    ...req
      .memberships!.filter((m) => ["manager", "broker"].includes(m.role))
      .map((m) => ({
        brokerageId: m.organizationId,
        ...(m.role === "broker" ? { brokerId: uid(req) } : {}),
      })),
  ],
});
export const participantFilter = (req: Req) => ({
  participants: {
    $elemMatch: {
      userId: uid(req),
      membershipId: { $in: req.memberships!.map((m) => String(m._id)) },
      active: true,
    },
  },
});
export async function practice(req: Req, id: string, allowParticipant = false) {
  const p: any = await Practice.findById(id);
  if (!p) fail(404, "Practice not found");
  if (manages(req, p) || owns(req, p)) return p;
  if (
    allowParticipant &&
    (await Deal.exists({
      practiceId: id,
      stage: { $ne: "cancelled" },
      participants: {
        $elemMatch: {
          userId: uid(req),
          membershipId: { $in: req.memberships!.map((m) => String(m._id)) },
          active: true,
        },
      },
    }))
  )
    return p;
  fail(404, "Practice not found");
}
export async function deal(req: Req, id: string) {
  const d: any = await Deal.findById(id);
  if (!d) fail(404, "Deal not found");
  const p = await practice(req, d.practiceId, true);
  if (
    !manages(req, p) &&
    !owns(req, p) &&
    !d.participants.some(
      (x: any) =>
        x.userId === uid(req) &&
        x.active &&
        req.memberships!.some((m) => String(m._id) === x.membershipId),
    )
  )
    fail(404, "Deal not found");
  return { d, p };
}
export async function currentScopes(req: Req, p: any): Promise<Set<string>> {
  if (!process.env.NDA_VERSION || !process.env.NDA_TEXT) return new Set();
  const userId = uid(req);
  const now = new Date();
  const relationship = await Deal.exists({
    practiceId: String(p._id),
    stage: { $ne: "cancelled" },
    participants: {
      $elemMatch: {
        userId,
        membershipId: { $in: req.memberships!.map((m) => String(m._id)) },
        active: true,
      },
    },
  });
  if (!relationship) return new Set();
  const qualified = await Interest.exists({
    practiceId: String(p._id),
    userId,
    "qualification.status": "approved",
    "qualification.expiresAt": { $gt: now },
  });
  const nda = await Nda.exists({
    practiceId: String(p._id),
    userId,
    version: process.env.NDA_VERSION,
    hash: hash(process.env.NDA_TEXT || ""),
  });
  if (!qualified || !nda) return new Set();
  const scopes: string[] = await Grant.distinct("scopes", {
    practiceId: String(p._id),
    userId,
    revokedAt: null,
    expiresAt: { $gt: now },
  });
  return new Set(scopes);
}
export async function disclosure(req: Req, p: any, scope: string) {
  if (manages(req, p) || owns(req, p)) return true;
  return (await currentScopes(req, p)).has(scope);
}
export async function audit(
  req: Req,
  action: string,
  resourceId: string,
  brokerageId?: string,
  detail?: any,
  session?: mongoose.ClientSession,
) {
  await Audit.create(
    [
      {
        actorId: req.actor ? uid(req) : undefined,
        action,
        resourceId,
        brokerageId,
        detail,
        requestId: req.requestId,
      },
    ],
    { session },
  );
}
export async function notify(
  userId: string,
  key: string,
  message: string,
  session?: mongoose.ClientSession,
) {
  await Notification.updateOne(
    { key },
    { $setOnInsert: { userId, key, message } },
    { upsert: true, session },
  );
}
export async function transaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
) {
  return mongoose.connection.transaction(fn);
}
export async function command(
  req: Req,
  action: string,
  resource: string,
  fn: (s: mongoose.ClientSession) => Promise<any>,
) {
  const supplied = req.get("Idempotency-Key");
  if (!supplied || !/^[\w-]{8,100}$/.test(supplied))
    fail(
      422,
      "Idempotency-Key of 8–100 letters, digits, hyphens or underscores required",
    );
  const canonical = (value: any): any =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((k) => [k, canonical(value[k])]),
          )
        : value;
  const key = `${uid(req)}:${action}:${resource}:${supplied}`;
  const requestHash = hash(JSON.stringify(canonical(req.body)));
  return transaction(async (s) => {
    const existing = await Operation.findOne({ key }).session(s);
    if (existing) {
      if (existing.hash !== requestHash)
        fail(409, "Idempotency key was used for a different request");
      return existing.result;
    }
    const result = await fn(s);
    await Operation.create([{ key, hash: requestHash, result }], {
      session: s,
    });
    return result;
  });
}
