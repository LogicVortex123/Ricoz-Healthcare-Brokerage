import { Router } from "express";
import { z } from "zod";
import {
  Audit,
  Deal,
  Interest,
  Membership,
  Notification,
  Practice,
  Session,
  Task,
  User,
} from "./models";
import {
  audit,
  command,
  fail,
  hasRole,
  ok,
  practiceFilter,
  participantFilter,
  list,
  route,
  uid,
} from "./core";
import { id, page, reason } from "./contracts";
import { issue } from "./auth";
import { AuthToken } from "./models";
import { hash } from "./core";
export const admin = Router();
admin.post(
  "/organizations",
  route(async (req, res) => {
    if (!hasRole(req, ["superAdmin"]))
      fail(403, "Super administrator required");
    const b = z
      .object({
        name: z.string().min(3).max(150),
        kind: z.enum(["brokerage", "acquirer"]),
        reason,
      })
      .strict()
      .parse(req.body);
    const { Organization } = await import("./models");
    ok(
      res,
      await command(req, "organization.create", "new", async (s) => {
        const [org] = await Organization.create(
          [{ name: b.name, kind: b.kind }],
          { session: s },
        );
        await audit(
          req,
          "organization.created",
          String(org._id),
          undefined,
          { reason: b.reason },
          s,
        );
        return org.toObject();
      }),
      201,
    );
  }),
);
admin.get(
  "/organizations",
  route(async (req, res) => {
    const { Organization } = await import("./models");
    return list(
      req,
      res,
      Organization,
      hasRole(req, ["superAdmin"])
        ? {}
        : { _id: { $in: req.memberships!.map((m) => m.organizationId) } },
    );
  }),
);
admin.post(
  "/invitations",
  route(async (req, res) => {
    const b = z
      .object({
        email: z
          .string()
          .email()
          .transform((x) => x.toLowerCase()),
        organizationId: id,
        role: z.enum(["broker", "manager", "acquirer"]),
        reason,
      })
      .strict()
      .parse(req.body);
    if (
      !hasRole(req, ["superAdmin"]) &&
      !(b.role === "broker" && hasRole(req, ["manager"], b.organizationId))
    )
      fail(403, "Authorized role administrator required");
    const { Organization } = await import("./models");
    const org: any = await Organization.findById(b.organizationId);
    if (
      !org ||
      (["broker", "manager"].includes(b.role)
        ? org.kind !== "brokerage"
        : org.kind !== "acquirer")
    )
      fail(422, "Organization kind does not support this role");
    const u: any = await User.findOne({
      email: b.email,
      verified: true,
      suspended: { $ne: true },
    });
    if (!u) fail(422, "Invitee must first register and verify their account");
    await issue(String(u._id), u.email, "invitation", {
      organizationId: b.organizationId,
      role: b.role,
    });
    await audit(req, "invitation.issued", String(u._id), b.organizationId, {
      reason: b.reason,
    });
    ok(res, { message: "Invitation queued to development outbox." });
  }),
);
admin.post(
  "/invitations/accept",
  route(async (req, res) => {
    const b = z
      .object({ token: z.string().length(64) })
      .strict()
      .parse(req.body);
    ok(
      res,
      await command(req, "invitation.accept", uid(req), async (s) => {
        const t: any = await AuthToken.findOneAndUpdate(
          {
            hash: hash(b.token),
            purpose: "invitation",
            userId: uid(req),
            consumedAt: null,
            expiresAt: { $gt: new Date() },
          },
          { $set: { consumedAt: new Date() } },
          { session: s },
        );
        if (!t) fail(422, "Invalid or expired invitation");
        await Membership.updateOne(
          { userId: uid(req), organizationId: t.payload.organizationId },
          { $set: { role: t.payload.role, active: true } },
          { upsert: true, session: s },
        );
        await Session.deleteMany({ userId: uid(req) }, { session: s });
        await audit(
          req,
          "invitation.accepted",
          uid(req),
          t.payload.organizationId,
          undefined,
          s,
        );
        return {
          message:
            "Invitation accepted. Sign in again; privileged access requires MFA.",
        };
      }),
    );
  }),
);
admin.get(
  "/memberships",
  route(async (req, res) => {
    const scopes = req
      .memberships!.filter((m) => m.role === "manager")
      .map((m) => m.organizationId);
    if (!scopes.length && !hasRole(req, ["superAdmin"]))
      fail(403, "Administrator required");
    return list(
      req,
      res,
      Membership,
      hasRole(req, ["superAdmin"]) ? {} : { organizationId: { $in: scopes } },
    );
  }),
);
admin.post(
  "/memberships",
  route(async (req, res) => {
    const b = z
      .object({
        userId: id,
        organizationId: id,
        role: z.enum(["manager", "broker", "seller", "buyer", "acquirer"]),
        active: z.boolean(),
        reason,
      })
      .strict()
      .parse(req.body);
    if (
      !hasRole(req, ["superAdmin"]) &&
      !hasRole(req, ["manager"], b.organizationId)
    )
      fail(403, "Organization administrator required");
    const { Organization } = await import("./models");
    const org: any = await Organization.findById(b.organizationId);
    if (!org || !(await User.exists({ _id: b.userId })))
      fail(422, "User and organization must exist");
    if (["broker", "manager"].includes(b.role) && org.kind !== "brokerage")
      fail(422, "Staff requires brokerage organization");
    if (
      !hasRole(req, ["superAdmin"]) &&
      ["manager", "seller", "buyer", "acquirer"].includes(b.role)
    )
      fail(403, "Super administrator required for this role assignment");
    const existing: any = await Membership.findOne({
      userId: b.userId,
      organizationId: b.organizationId,
    });
    if (!hasRole(req, ["superAdmin"]) && existing && existing.role !== "broker")
      fail(403, "Managers may only update broker memberships");
    ok(
      res,
      await command(
        req,
        "membership.update",
        `${b.organizationId}:${b.userId}`,
        async (s) => {
          const m = await Membership.findOneAndUpdate(
            { userId: b.userId, organizationId: b.organizationId },
            { $set: { role: b.role, active: b.active } },
            { upsert: true, returnDocument: "after", session: s },
          );
          await Session.deleteMany({ userId: b.userId }, { session: s });
          await audit(
            req,
            "membership.updated",
            String(m!._id),
            b.organizationId,
            { reason: b.reason, active: b.active, role: b.role },
            s,
          );
          return m!.toObject();
        },
      ),
    );
  }),
);
admin.post(
  "/users/:id/suspend",
  route(async (req, res) => {
    if (!hasRole(req, ["superAdmin"]))
      fail(403, "Super administrator required");
    const b = z
      .object({ suspended: z.boolean(), reason })
      .strict()
      .parse(req.body);
    const userId = id.parse(req.params.id);
    ok(
      res,
      await command(req, "account.suspend", userId, async (s) => {
        await User.updateOne(
          { _id: userId },
          { $set: { suspended: b.suspended } },
          { session: s },
        );
        await Session.deleteMany({ userId }, { session: s });
        await audit(req, "account.suspended", userId, undefined, b, s);
        return { suspended: b.suspended };
      }),
    );
  }),
);
admin.get(
  "/notifications",
  route(async (req, res) => list(req, res, Notification, { userId: uid(req) })),
);
admin.post(
  "/notifications/:id/read",
  route(async (req, res) => {
    z.object({}).strict().parse(req.body);
    const n = await Notification.findOneAndUpdate(
      { _id: id.parse(req.params.id), userId: uid(req) },
      { $set: { readAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!n) fail(404, "Notification not found");
    ok(res, n);
  }),
);
admin.get(
  "/audit",
  route(async (req, res) => {
    const scopes = req.memberships!.filter((m) =>
      ["manager", "broker"].includes(m.role),
    );
    if (!scopes.length && !hasRole(req, ["superAdmin"]))
      fail(403, "Staff required");
    const ps = await Practice.find(practiceFilter(req)).select("_id");
    const ds = await Deal.find({
      practiceId: { $in: ps.map((p) => String(p._id)) },
    }).select("_id");
    const q = page.strict().parse(req.query);
    const items = await Audit.find({
      ...(hasRole(req, ["superAdmin"])
        ? {
            action: {
              $in: [
                "membership.updated",
                "account.suspended",
                "auth.login",
                "mfa.enabled",
              ],
            },
          }
        : {
            $or: [
              { resourceId: { $in: [...ps, ...ds].map((x) => String(x._id)) } },
              {
                brokerageId: {
                  $in: scopes
                    .filter((m) => m.role === "manager")
                    .map((m) => m.organizationId),
                },
              },
            ],
          }),
      ...(q.cursor ? { _id: { $lt: q.cursor } } : {}),
    })
      .sort({ _id: -1 })
      .limit(q.limit + 1)
      .lean();
    ok(res, {
      items: items.slice(0, q.limit),
      nextCursor:
        items.length > q.limit ? String(items[q.limit - 1]._id) : null,
    });
  }),
);
admin.get(
  "/metrics",
  route(async (req, res) => {
    const ps = await Practice.find(practiceFilter(req)).select("_id");
    const ids = ps.map((p) => String(p._id));
    const ds = await Deal.find({
      $or: [{ practiceId: { $in: ids } }, participantFilter(req)],
    }).select("_id stage");
    const dealIds = ds.map((d) => String(d._id));
    const overdue = await Task.countDocuments({
      dealId: { $in: dealIds },
      done: { $ne: true },
      dueAt: { $lt: new Date() },
    });
    ok(res, {
      practices: ids.length,
      activeDeals: ds.filter(
        (d) => !["completed", "cancelled"].includes(d.stage),
      ).length,
      closedAwaitingHandover: ds.filter((d) =>
        ["closed", "handover"].includes(d.stage),
      ).length,
      overdueTasks: overdue,
      interests: await Interest.countDocuments({
        $or: [{ practiceId: { $in: ids } }, { userId: uid(req) }],
      }),
    });
  }),
);
