import { Router } from "express";
import { z } from "zod";
import {
  Deal,
  Interest,
  Lead,
  Listing,
  Membership,
  Organization,
  Practice,
  Snapshot,
  User,
  Document,
} from "./models";
import {
  audit,
  command,
  fail,
  hasRole,
  manages,
  notify,
  ok,
  practice,
  practiceFilter,
  route,
  uid,
  list,
} from "./core";
import { holdings, id, intake, page, reason, teaser } from "./contracts";
export const publicRoutes = Router();
const publicTeaser = (listing: any) => ({
  id: String(listing._id),
  headline: listing.teaser.headline,
  category: listing.teaser.category,
  country: listing.teaser.country,
  region: listing.teaser.region,
  summary: listing.teaser.summary,
  transitionPurpose: listing.teaser.transitionPurpose,
});
publicRoutes.get(
  "/listings",
  route(async (req, res) => {
    const q = page
      .extend({
        category: z
          .enum(["dental", "veterinary", "specialistMedical"])
          .optional(),
        country: z.string().length(2).optional(),
        sort: z.enum(["oldest", "newest"]).default("newest"),
      })
      .strict()
      .parse(req.query);
    const filter = {
      status: "published",
      ...(q.category ? { "teaser.category": q.category } : {}),
      ...(q.country ? { "teaser.country": q.country } : {}),
      ...(q.cursor
        ? { _id: { [q.sort === "newest" ? "$lt" : "$gt"]: q.cursor } }
        : {}),
    };
    const items: any[] = await Listing.find(filter)
      .sort({ _id: q.sort === "newest" ? -1 : 1 })
      .limit(q.limit + 1)
      .lean();
    ok(res, {
      items: items.slice(0, q.limit).map(publicTeaser),
      nextCursor:
        items.length > q.limit ? String(items[q.limit - 1]._id) : null,
    });
  }),
);
publicRoutes.get(
  "/listings/:id",
  route(async (req, res) => {
    const l: any = await Listing.findOne({
      _id: id.parse(req.params.id),
      status: "published",
    });
    if (!l) fail(404, "Listing not found");
    ok(res, publicTeaser(l));
  }),
);
export const practices = Router();
function privatePractice(req: any, p: any) {
  const value = typeof p.toObject === "function" ? p.toObject() : p;
  return {
    ...value,
    permissions: {
      review: manages(req, p),
      assign: hasRole(req, ["manager"], p.brokerageId),
      owner: p.ownerId === uid(req),
    },
  };
}
practices.get(
  "/practices/:id/directory",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned staff required");
    const q = z
      .object({ email: z.string().email().max(254).optional() })
      .strict()
      .parse(req.query);
    const interests = await Interest.find({ practiceId: String(p._id) })
      .select("userId")
      .limit(100);
    const deals = await Deal.find({ practiceId: String(p._id) })
      .select("participants")
      .limit(100);
    const members = await Membership.find({
      organizationId: p.brokerageId,
      active: true,
    })
      .select("userId")
      .limit(100);
    const ids = [
      p.ownerId,
      ...interests.map((i) => i.userId),
      ...members.map((m) => m.userId),
      ...deals.flatMap((d) => d.participants.map((x: any) => x.userId)),
    ];
    const people = await User.find({
      ...(q.email ? { email: q.email.toLowerCase() } : { _id: { $in: ids } }),
      verified: true,
      suspended: { $ne: true },
    })
      .select("name email")
      .limit(100)
      .lean();
    if (q.email)
      await audit(req, "participant.lookup", String(p._id), p.brokerageId);
    ok(
      res,
      people.map((u) => ({ id: String(u._id), name: u.name, email: u.email })),
    );
  }),
);
practices.post(
  "/practices/:id/qualification",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const b = z
      .object({
        userId: id,
        status: z.enum(["approved", "rejected", "revoked"]),
        reason,
        expiresAt: z.string().datetime(),
      })
      .strict()
      .parse(req.body);
    if (
      new Date(b.expiresAt) <= new Date() ||
      !(await Deal.exists({
        practiceId: String(p._id),
        participants: { $elemMatch: { userId: b.userId, active: true } },
      }))
    )
      fail(422, "Current explicit participant and future expiry required");
    ok(
      res,
      await command(
        req,
        "private.qualification",
        `${p._id}:${b.userId}`,
        async (s) => {
          const i = await Interest.findOneAndUpdate(
            { practiceId: String(p._id), userId: b.userId },
            {
              $set: {
                readiness: "Private participant review",
                qualification: {
                  status: b.status,
                  reason: b.reason,
                  expiresAt: new Date(b.expiresAt),
                  reviewerId: uid(req),
                },
              },
            },
            { upsert: true, returnDocument: "after", session: s },
          );
          await audit(
            req,
            "qualification." + b.status,
            String(p._id),
            p.brokerageId,
            { reason: b.reason, userId: b.userId },
            s,
          );
          return i!.toObject();
        },
      ),
    );
  }),
);
practices.get(
  "/brokerages",
  route(async (_req, res) =>
    ok(
      res,
      await Organization.find({ kind: "brokerage" })
        .select("name")
        .limit(50)
        .lean(),
    ),
  ),
);
practices.get(
  "/practices",
  route(async (req, res) => {
    const q = page.strict().parse(req.query);
    const items = await Practice.find({
      ...practiceFilter(req),
      ...(q.cursor ? { _id: { $gt: q.cursor } } : {}),
    })
      .sort({ _id: 1 })
      .limit(q.limit + 1)
      .lean();
    ok(res, {
      items: items.slice(0, q.limit).map((p) => privatePractice(req, p)),
      nextCursor:
        items.length > q.limit ? String(items[q.limit - 1]._id) : null,
    });
  }),
);
practices.post(
  "/practices",
  route(async (req, res) => {
    if (!hasRole(req, ["seller"])) fail(403, "Seller membership required");
    const b = z.object({ brokerageId: id, intake }).strict().parse(req.body);
    if (!(await Organization.exists({ _id: b.brokerageId, kind: "brokerage" })))
      fail(422, "Invalid brokerage");
    const result = await command(req, "practice.create", "new", async (s) => {
      const [p] = await Practice.create([{ ...b, ownerId: uid(req) }], {
        session: s,
      });
      await Lead.create(
        [{ practiceId: String(p._id), brokerageId: b.brokerageId, notes: [] }],
        { session: s },
      );
      await audit(
        req,
        "practice.created",
        String(p._id),
        b.brokerageId,
        undefined,
        s,
      );
      return p.toObject();
    });
    ok(res, result, 201);
  }),
);
practices.get(
  "/practices/:id",
  route(async (req, res) =>
    ok(res, privatePractice(req, await practice(req, id.parse(req.params.id)))),
  ),
);
practices.post(
  "/practices/:id/assign",
  route(async (req, res) => {
    const p: any = await practice(req, id.parse(req.params.id));
    if (!hasRole(req, ["manager"], p.brokerageId))
      fail(403, "Brokerage manager required");
    const b = z.object({ brokerId: id, reason }).strict().parse(req.body);
    if (
      !(await Membership.exists({
        userId: b.brokerId,
        organizationId: p.brokerageId,
        role: "broker",
        active: true,
      }))
    )
      fail(422, "Active broker in this brokerage required");
    ok(
      res,
      await command(req, "assignment", String(p._id), async (s) => {
        await Practice.updateOne(
          { _id: p._id },
          { $set: { brokerId: b.brokerId } },
          { session: s },
        );
        await Lead.updateMany(
          { practiceId: String(p._id) },
          { $set: { brokerId: b.brokerId } },
          { session: s },
        );
        await Deal.updateMany(
          { practiceId: String(p._id) },
          { $set: { brokerId: b.brokerId } },
          { session: s },
        );
        await audit(
          req,
          "practice.assigned",
          String(p._id),
          p.brokerageId,
          b,
          s,
        );
        return { brokerId: b.brokerId };
      }),
    );
  }),
);
practices.post(
  "/practices/:id/listing",
  route(async (req, res) => {
    const p: any = await practice(req, id.parse(req.params.id));
    const b = z
      .object({
        teaser,
        status: z.enum([
          "draft",
          "review",
          "published",
          "paused",
          "underOffer",
          "withdrawn",
          "closed",
        ]),
        reason,
      })
      .strict()
      .parse(req.body);
    if (
      ["published", "underOffer", "closed"].includes(b.status) &&
      !manages(req, p)
    )
      fail(403, "Assigned reviewer required");
    if (
      b.teaser.category !== p.intake.category ||
      b.teaser.transitionPurpose !== p.intake.transitionPurpose
    )
      fail(422, "Teaser must match practice category and purpose");
    ok(
      res,
      await command(req, "listing.review", String(p._id), async (s) => {
        const l = await Listing.findOneAndUpdate(
          { practiceId: String(p._id) },
          {
            $set: {
              brokerageId: p.brokerageId,
              teaser: b.teaser,
              status: b.status,
              reviewerId: manages(req, p) ? uid(req) : undefined,
            },
          },
          { upsert: true, returnDocument: "after", session: s },
        );
        await audit(
          req,
          "listing." + b.status,
          String(p._id),
          p.brokerageId,
          { reason: b.reason },
          s,
        );
        return l!.toObject();
      }),
    );
  }),
);
practices.post(
  "/listings/:id/interests",
  route(async (req, res) => {
    if (!hasRole(req, ["buyer", "acquirer"]))
      fail(403, "Buyer membership required");
    const b = z
      .object({ readiness: z.string().min(10).max(1000) })
      .strict()
      .parse(req.body);
    const l: any = await Listing.findOne({
      _id: id.parse(req.params.id),
      status: "published",
    });
    if (!l) fail(404, "Listing not found");
    ok(
      res,
      await command(req, "interest", String(l._id), async (s) => {
        const i = await Interest.findOneAndUpdate(
          { listingId: String(l._id), userId: uid(req) },
          {
            $setOnInsert: {
              practiceId: l.practiceId,
              readiness: b.readiness,
              qualification: { status: "pending" },
            },
          },
          { upsert: true, returnDocument: "after", session: s },
        );
        const p: any = await Practice.findById(l.practiceId).session(s);
        await Lead.updateOne(
          { interestId: String(i!._id) },
          {
            $setOnInsert: {
              practiceId: l.practiceId,
              brokerageId: p.brokerageId,
              brokerId: p.brokerId,
              notes: [],
            },
          },
          { upsert: true, session: s },
        );
        await audit(
          req,
          "interest.created",
          String(i!._id),
          p.brokerageId,
          undefined,
          s,
        );
        if (p.brokerId)
          await notify(
            p.brokerId,
            `interest:${i!._id}`,
            "A buyer expressed interest in an assigned practice.",
            s,
          );
        return { id: String(i!._id), qualification: i!.qualification };
      }),
      201,
    );
  }),
);
practices.get(
  "/interests",
  route(async (req, res) => {
    const ps = await Practice.find(practiceFilter(req)).select("_id");
    return list(req, res, Interest, {
      $or: [
        { userId: uid(req) },
        { practiceId: { $in: ps.map((p) => String(p._id)) } },
      ],
    });
  }),
);
practices.post(
  "/interests/:id/qualification",
  route(async (req, res) => {
    const i: any = await Interest.findById(id.parse(req.params.id));
    if (!i) fail(404, "Interest not found");
    const p: any = await practice(req, i.practiceId);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const b = z
      .object({
        status: z.enum(["approved", "rejected", "revoked"]),
        reason,
        expiresAt: z.string().datetime(),
      })
      .strict()
      .parse(req.body);
    if (new Date(b.expiresAt) <= new Date())
      fail(422, "Future expiry required");
    ok(
      res,
      await command(req, "qualification", String(i._id), async (s) => {
        await Interest.updateOne(
          { _id: i._id },
          {
            $set: {
              qualification: {
                ...b,
                expiresAt: new Date(b.expiresAt),
                reviewerId: uid(req),
              },
            },
          },
          { session: s },
        );
        await audit(
          req,
          "qualification." + b.status,
          String(i._id),
          p.brokerageId,
          { reason: b.reason },
          s,
        );
        await notify(
          i.userId,
          `qualification:${i._id}:${req.get("Idempotency-Key")}`,
          "Your opportunity qualification was reviewed.",
          s,
        );
        return b;
      }),
    );
  }),
);
practices.post(
  "/practices/:id/ownership",
  route(async (req, res) => {
    const p: any = await practice(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const b = z
      .object({
        holdings,
        evidenceDocumentId: id,
        baselineId: id.nullable(),
        reason,
      })
      .strict()
      .parse(req.body);
    if (
      !(await Document.exists({
        _id: b.evidenceDocumentId,
        practiceId: String(p._id),
        state: "released",
        category: "ownership",
      }))
    )
      fail(422, "Reviewed ownership evidence required");
    ok(
      res,
      await command(req, "ownership.verify", String(p._id), async (s) => {
        if (b.baselineId) {
          const previous: any = await Snapshot.findOne({
            _id: b.baselineId,
            practiceId: String(p._id),
          }).session(s);
          const normalized = (values: any[]) =>
            values
              .map((x) => ({ ownerId: x.ownerId, basisPoints: x.basisPoints }))
              .sort((a, b) => a.ownerId.localeCompare(b.ownerId));
          if (
            !previous ||
            JSON.stringify(normalized(previous.holdings)) !==
              JSON.stringify(normalized(b.holdings))
          )
            fail(
              422,
              "Existing ownership holdings may change only through the legal closing command",
            );
        }
        const [snap] = await Snapshot.create(
          [
            {
              practiceId: String(p._id),
              holdings: b.holdings,
              evidenceDocumentId: b.evidenceDocumentId,
              verifiedBy: uid(req),
              previousId: b.baselineId,
            },
          ],
          { session: s },
        );
        const r = await Practice.updateOne(
          { _id: p._id, ownershipSnapshotId: b.baselineId },
          { $set: { ownershipSnapshotId: String(snap._id) } },
          { session: s },
        );
        if (!r.modifiedCount) fail(409, "Stale ownership baseline");
        await audit(
          req,
          "ownership.verified",
          String(p._id),
          p.brokerageId,
          { reason: b.reason },
          s,
        );
        return snap.toObject();
      }),
    );
  }),
);
practices.get(
  "/practices/:id/ownership",
  route(async (req, res) => {
    const p: any = await practice(req, id.parse(req.params.id));
    return list(req, res, Snapshot, { practiceId: String(p._id) });
  }),
);
practices.get(
  "/leads",
  route(async (req, res) => {
    const ps = await Practice.find(practiceFilter(req)).select(
      "_id brokerageId brokerId",
    );
    const ids = ps.filter((p) => manages(req, p)).map((p) => String(p._id));
    return list(req, res, Lead, { practiceId: { $in: ids } });
  }),
);
practices.post(
  "/leads/:id/notes",
  route(async (req, res) => {
    const l: any = await Lead.findById(id.parse(req.params.id));
    if (!l) fail(404, "Lead not found");
    const p = await practice(req, l.practiceId);
    if (!manages(req, p)) fail(404, "Lead not found");
    const b = z
      .object({ text: z.string().min(3).max(2000) })
      .strict()
      .parse(req.body);
    const changed = await Lead.updateOne(
      { _id: l._id, "notes.99": { $exists: false } },
      { $push: { notes: { ...b, actorId: uid(req), at: new Date() } } },
    );
    if (!changed.modifiedCount) fail(409, "Internal note limit reached");
    await audit(req, "lead.note", String(l._id), p.brokerageId);
    ok(res, {});
  }),
);
