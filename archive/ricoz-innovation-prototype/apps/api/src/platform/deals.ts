import { Router } from "express";
import { diligenceTemplate } from "./templates";
import { z } from "zod";
import {
  Deal,
  Document,
  Grant,
  Listing,
  Membership,
  Offer,
  Practice,
  Snapshot,
  Task,
  User,
} from "./models";
import {
  audit,
  command,
  deal,
  disclosure,
  fail,
  manages,
  notify,
  ok,
  owns,
  practice,
  practiceFilter,
  participantFilter,
  route,
  uid,
  list,
  Req,
} from "./core";
import { ClientSession } from "mongoose";
import {
  applyTransfers,
  id,
  purpose,
  reason,
  structure,
  transfers,
  offerTerms,
} from "./contracts";
export const deals = Router();
deals.get(
  "/deals/:id/offers",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    return list(req, res, Offer, {
      dealId: String(d._id),
      ...(manages(req, p) || owns(req, p) ? {} : { userId: uid(req) }),
    });
  }),
);
deals.get(
  "/deals/:id/tasks",
  route(async (req, res) => {
    const { d } = await deal(req, id.parse(req.params.id));
    return list(req, res, Task, { dealId: String(d._id) });
  }),
);
const stageTransitions: Record<string, string[]> = {
  initiated: ["preparation", "onHold", "cancelled"],
  preparation: ["initiated", "diligence", "onHold", "cancelled"],
  diligence: ["preparation", "termsAgreed", "onHold", "cancelled"],
  termsAgreed: ["diligence", "closing", "onHold", "cancelled"],
  closing: ["termsAgreed", "onHold", "cancelled"],
  closed: ["handover"],
  handover: ["completed"],
  completed: [],
  cancelled: [],
  onHold: [
    "initiated",
    "preparation",
    "diligence",
    "termsAgreed",
    "closing",
    "cancelled",
  ],
};
async function diligenceReady(d: any, p: any, session: ClientSession) {
  for (const item of d.diligence.filter((x: any) => x.mandatory)) {
    if (item.status === "waived") {
      if (!item.reviewerId || !item.reason || item.reason.length < 5)
        fail(422, "A waiver requires reviewer authority and a recorded reason");
      continue;
    }
    if (
      item.status !== "accepted" ||
      !(await Document.exists({
        _id: item.evidenceDocumentId,
        practiceId: String(p._id),
        state: "released",
        ...(item.evidenceCategory ? { category: item.evidenceCategory } : {}),
      }).session(session))
    )
      fail(422, "Mandatory diligence requires current accepted evidence");
  }
}
async function participantReadiness(
  req: Req,
  p: any,
  d: any,
  session: ClientSession,
  confidential: boolean,
) {
  for (const participant of d.participants.filter((x: any) => x.active)) {
    const user: any = await User.findOne({
      _id: participant.userId,
      verified: true,
      suspended: { $ne: true },
    }).session(session);
    const memberships = await Membership.find({
      _id: participant.membershipId,
      userId: participant.userId,
      active: true,
    }).session(session);
    if (!user || !memberships.length)
      fail(
        422,
        "Every active participant requires a current identity and bound membership",
      );
    if (
      !(await Document.exists({
        _id: participant.authorityDocumentId,
        practiceId: String(p._id),
        category: "authority",
        state: "released",
      }).session(session))
    )
      fail(422, "Current reviewed participant authority evidence required");
    if (
      confidential &&
      !(await disclosure(
        { ...req, actor: user, memberships } as Req,
        p,
        "identity",
      ))
    )
      fail(
        422,
        "Every active participant requires current qualification, agreement and named disclosure",
      );
  }
}
async function acceptedTerms(d: any, p: any, session: ClientSession) {
  const offer: any = await Offer.findOne({
    dealId: String(d._id),
    status: "accepted",
  }).session(session);
  if (
    !offer ||
    !(await Document.exists({
      _id: offer.decision?.evidenceDocumentId,
      practiceId: String(p._id),
      category: "terms",
      state: "released",
    }).session(session))
  )
    fail(
      422,
      "Current accepted terms and reviewed communication evidence required",
    );
  return offer;
}
const dto = (d: any) => ({
  id: String(d._id),
  practiceId: d.practiceId,
  purpose: d.purpose,
  legalStructure: d.legalStructure,
  stage: d.stage,
  revision: d.revision,
  participants: d.participants.map((x: any) => ({
    userId: x.userId,
    capacity: x.capacity,
    active: x.active,
  })),
  diligence: d.diligence,
  history: d.history,
  closing: d.closing
    ? { at: d.closing.at, ownershipApplied: d.closing.ownershipApplied }
    : undefined,
});
deals.get(
  "/deals",
  route(async (req, res) => {
    const ps = await Practice.find(practiceFilter(req)).select("_id");
    return list(
      req,
      res,
      Deal,
      {
        $or: [
          { practiceId: { $in: ps.map((p) => String(p._id)) } },
          participantFilter(req),
        ],
      },
      dto,
    );
  }),
);
deals.post(
  "/deals",
  route(async (req, res) => {
    const b = z
      .object({
        practiceId: id,
        purpose,
        legalStructure: structure,
        participants: z
          .array(
            z
              .object({
                userId: id,
                capacity: z.enum([
                  "buyer",
                  "acquirer",
                  "retiringPartner",
                  "remainingPartner",
                  "successor",
                ]),
                authorityDocumentId: id,
              })
              .strict(),
          )
          .min(1)
          .max(30),
        reason,
      })
      .strict()
      .parse(req.body);
    const p = await practice(req, b.practiceId);
    if (!manages(req, p)) fail(403, "Assigned broker required");
    const named: any[] = [];
    for (const x of b.participants) {
      if (
        !(await User.exists({
          _id: x.userId,
          verified: true,
          suspended: { $ne: true },
        })) ||
        !(await Membership.exists({ userId: x.userId, active: true }))
      )
        fail(422, "Active verified participant required");
      if (
        !(await Document.exists({
          _id: x.authorityDocumentId,
          practiceId: b.practiceId,
          state: "released",
          category: "authority",
        }))
      )
        fail(422, "Reviewed participant authority evidence required");
      const m: any = await Membership.findOne({
        userId: x.userId,
        active: true,
        role: { $in: ["buyer", "acquirer", "seller"] },
      });
      if (!m)
        fail(
          422,
          "Participant capacity requires an active non-staff membership",
        );
      named.push({ ...x, membershipId: String(m._id), active: true });
    }
    ok(
      res,
      await command(req, "deal.create", b.practiceId, async (s) => {
        const [d] = await Deal.create(
          [
            {
              ...b,
              brokerageId: p.brokerageId,
              brokerId: p.brokerId,
              stage: "initiated",
              baselineId: p.ownershipSnapshotId,
              participants: named,
              diligence: diligenceTemplate(
                p.intake.category,
                b.purpose,
                b.legalStructure,
              ),
              history: [
                {
                  stage: "initiated",
                  actorId: uid(req),
                  at: new Date(),
                  reason: b.reason,
                },
              ],
            },
          ],
          { session: s },
        );
        await audit(
          req,
          "deal.created",
          String(d._id),
          p.brokerageId,
          undefined,
          s,
        );
        for (const x of b.participants)
          await notify(
            x.userId,
            `deal:${d._id}:${x.userId}`,
            "You were added to a private transition workspace.",
            s,
          );
        return dto(d);
      }),
      201,
    );
  }),
);
deals.get(
  "/deals/:id",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    const privileged = manages(req, p) || owns(req, p);
    const people: any[] = await User.find({
      _id: { $in: d.participants.map((x: any) => x.userId) },
    })
      .select("name")
      .lean();
    ok(res, {
      ...dto(d),
      participants: dto(d).participants.map((x: any) => ({
        ...x,
        name: people.find((u) => String(u._id) === x.userId)?.name,
      })),
      permissions: {
        manage: manages(req, p),
        decide: privileged,
        offer: d.participants.some(
          (x: any) =>
            x.active &&
            x.userId === uid(req) &&
            ["buyer", "acquirer", "remainingPartner", "successor"].includes(
              x.capacity,
            ),
        ),
      },
      ownership:
        privileged && p.ownershipSnapshotId
          ? await Snapshot.findById(p.ownershipSnapshotId).lean()
          : undefined,
      proposal: privileged ? d.proposal : undefined,
      baselineId: privileged ? d.baselineId : undefined,
      offers: await Offer.find({
        dealId: String(d._id),
        ...(privileged ? {} : { userId: uid(req) }),
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      tasks: await Task.find({ dealId: String(d._id) })
        .limit(100)
        .lean(),
    });
  }),
);
deals.post(
  "/deals/:id/proposal",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    if (
      !manages(req, p) ||
      ["closed", "handover", "completed", "cancelled"].includes(d.stage)
    )
      fail(403, "Proposal cannot be changed");
    const b = z
      .object({ baselineId: id, transfers, disputed: z.boolean(), reason })
      .strict()
      .parse(req.body);
    const snap: any = await Snapshot.findOne({
      _id: b.baselineId,
      practiceId: String(p._id),
    });
    if (!snap || p.ownershipSnapshotId !== b.baselineId)
      fail(409, "Stale ownership baseline");
    applyTransfers(snap.holdings, b.transfers);
    for (const t of b.transfers)
      if (
        !(await Document.exists({
          _id: t.consentDocumentId,
          practiceId: String(p._id),
          category: "consent",
          state: "released",
        }))
      )
        fail(422, "Reviewed consent evidence required for every transfer");
    ok(
      res,
      await command(req, "deal.proposal", String(d._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        const current: any = await Practice.findById(p._id).session(s);
        if (
          ["closed", "handover", "completed", "cancelled", "onHold"].includes(
            fresh.stage,
          )
        )
          fail(409, "Proposal is locked");
        if (current.ownershipSnapshotId !== b.baselineId)
          fail(409, "Stale ownership baseline");
        fresh.baselineId = b.baselineId;
        fresh.proposal = { ...b, recordedBy: uid(req) };
        fresh.revision++;
        await fresh.save({ session: s });
        await audit(
          req,
          "deal.proposal",
          String(d._id),
          p.brokerageId,
          { disputed: b.disputed, reason: b.reason },
          s,
        );
        return fresh.proposal;
      }),
    );
  }),
);
deals.post(
  "/deals/:id/offers",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    if (["closed", "handover", "completed", "cancelled"].includes(d.stage))
      fail(409, "Deal is no longer accepting offers");
    if (
      !d.participants.some(
        (x: any) =>
          x.active &&
          x.userId === uid(req) &&
          ["buyer", "acquirer", "remainingPartner", "successor"].includes(
            x.capacity,
          ),
      )
    )
      fail(403, "Acquiring participant required");
    if (!(await disclosure(req, p, "identity")))
      fail(
        403,
        "Current qualification, agreement and named identity grant required",
      );
    const b = offerTerms
      .extend({ previousId: id.optional() })
      .strict()
      .parse(req.body);
    if (new Date(b.expiresAt) <= new Date())
      fail(422, "Offer expiry must be in the future");
    if (b.legalStructure !== d.legalStructure)
      fail(422, "Offer structure must match deal");
    for (const attachment of b.attachments) {
      const doc: any = await Document.findOne({
        _id: attachment,
        practiceId: String(p._id),
        state: "released",
      });
      if (!doc || !(await disclosure(req, p, `document:${attachment}`)))
        fail(422, "Authorized released attachment required");
    }
    ok(
      res,
      await command(req, "offer.submit", String(d._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        if (
          ["closed", "handover", "completed", "cancelled", "onHold"].includes(
            fresh.stage,
          )
        )
          fail(409, "Deal is not accepting offers");
        fresh.revision++;
        await fresh.save({ session: s });
        if (b.previousId) {
          const old = await Offer.findOne({
            _id: b.previousId,
            dealId: String(d._id),
            userId: uid(req),
            status: "submitted",
          }).session(s);
          if (!old) fail(409, "Previous submitted revision not found");
          await Offer.updateOne(
            { _id: old._id },
            { $set: { status: "superseded" } },
            { session: s },
          );
        }
        const [offer] = await Offer.create(
          [
            {
              dealId: String(d._id),
              userId: uid(req),
              submittedBy: uid(req),
              previousId: b.previousId,
              terms: b,
              status: "submitted",
            },
          ],
          { session: s },
        );
        await audit(
          req,
          "offer.submitted",
          String(d._id),
          p.brokerageId,
          { offerId: String(offer._id) },
          s,
        );
        return offer.toObject();
      }),
      201,
    );
  }),
);
deals.post(
  "/offers/:id/counter",
  route(async (req, res) => {
    const previous: any = await Offer.findById(id.parse(req.params.id));
    if (!previous) fail(404, "Offer not found");
    const { d, p } = await deal(req, previous.dealId);
    if (!manages(req, p) && !owns(req, p) && previous.userId !== uid(req))
      fail(403, "Counteroffer not permitted");
    if (!(await disclosure(req, p, "identity")))
      fail(403, "Current confidential access required");
    const terms = offerTerms.parse(req.body);
    if (
      new Date(terms.expiresAt) <= new Date() ||
      terms.legalStructure !== d.legalStructure
    )
      fail(422, "Current expiry and matching structure required");
    for (const attachment of terms.attachments)
      if (
        !(await Document.exists({
          _id: attachment,
          practiceId: String(p._id),
          state: "released",
        })) ||
        !(await disclosure(req, p, `document:${attachment}`))
      )
        fail(422, "Authorized released attachments required");
    ok(
      res,
      await command(req, "offer.counter", String(previous._id), async (s) => {
        const current: any = await Deal.findById(d._id).session(s);
        if (
          ["closed", "handover", "completed", "cancelled"].includes(
            current.stage,
          )
        )
          fail(409, "Deal no longer accepts offers");
        current.revision++;
        await current.save({ session: s });
        const replaced = await Offer.updateOne(
          {
            _id: previous._id,
            status: "submitted",
            "terms.expiresAt": { $gt: new Date().toISOString() },
          },
          { $set: { status: "superseded" } },
          { session: s },
        );
        if (!replaced.modifiedCount)
          fail(409, "Offer is expired or already decided");
        const [revision] = await Offer.create(
          [
            {
              dealId: String(d._id),
              userId: previous.userId,
              submittedBy: uid(req),
              previousId: String(previous._id),
              terms,
              status: "submitted",
            },
          ],
          { session: s },
        );
        await audit(
          req,
          "offer.countered",
          String(d._id),
          p.brokerageId,
          { offerId: String(revision._id) },
          s,
        );
        await notify(
          previous.userId,
          `counter:${revision._id}`,
          "A new immutable counteroffer revision is available.",
          s,
        );
        return revision.toObject();
      }),
      201,
    );
  }),
);
deals.post(
  "/offers/:id/decision",
  route(async (req, res) => {
    const o: any = await Offer.findById(id.parse(req.params.id));
    if (!o) fail(404, "Offer not found");
    const { d, p } = await deal(req, o.dealId);
    const b = z
      .object({
        status: z.enum(["accepted", "rejected", "withdrawn"]),
        evidenceDocumentId: id.optional(),
        reason,
      })
      .strict()
      .parse(req.body);
    if (
      b.status === "withdrawn"
        ? (o.submittedBy || o.userId) !== uid(req)
        : !manages(req, p) &&
          !(owns(req, p) && o.submittedBy !== uid(req)) &&
          !(
            o.userId === uid(req) &&
            o.submittedBy &&
            o.submittedBy !== uid(req)
          )
    )
      fail(403, "Offer decision not permitted");
    if (
      b.status === "accepted" &&
      !(await Document.exists({
        _id: b.evidenceDocumentId,
        practiceId: String(p._id),
        state: "released",
        category: "terms",
      }))
    )
      fail(422, "Reviewed communication/terms evidence required");
    if (
      b.status === "accepted" &&
      !(await disclosure(req, p, `document:${b.evidenceDocumentId}`))
    )
      fail(403, "Authorized terms evidence required");
    ok(
      res,
      await command(req, "offer.decision", String(o._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        if (
          ["closed", "handover", "completed", "cancelled", "onHold"].includes(
            fresh.stage,
          )
        )
          fail(409, "Deal is no longer open");
        fresh.revision++;
        await fresh.save({ session: s });
        if (b.status === "accepted") {
          const evidence = await Document.updateOne(
            {
              _id: b.evidenceDocumentId,
              practiceId: String(p._id),
              state: "released",
              category: "terms",
            },
            { $inc: { referenceRevision: 1 } },
            { session: s },
          );
          if (!evidence.matchedCount)
            fail(422, "Terms evidence changed; review again");
          const current: any = await Practice.findById(p._id).session(s);
          if (
            current.exclusiveDealId &&
            current.exclusiveDealId !== String(d._id)
          )
            fail(409, "This practice has another exclusive accepted deal");
          if (o.terms.exclusive) {
            const competing = await Deal.find({
              practiceId: String(p._id),
              _id: { $ne: d._id },
              stage: {
                $in: [
                  "initiated",
                  "preparation",
                  "diligence",
                  "termsAgreed",
                  "closing",
                  "onHold",
                ],
              },
            })
              .select("_id")
              .session(s);
            if (
              await Offer.exists({
                dealId: { $in: competing.map((x) => String(x._id)) },
                status: "accepted",
              }).session(s)
            )
              fail(409, "Another open deal already has accepted terms");
          }
          const locked = await Practice.updateOne(
            {
              _id: p._id,
              revision: current.revision,
              $or: [
                { exclusiveDealId: null },
                { exclusiveDealId: String(d._id) },
              ],
            },
            {
              ...(o.terms.exclusive
                ? { $set: { exclusiveDealId: String(d._id) } }
                : {}),
              $inc: { revision: 1 },
            },
            { session: s },
          );
          if (!locked.modifiedCount)
            fail(409, "Conflicting concurrent acceptance");
          if (o.terms.exclusive)
            await Listing.updateOne(
              {
                practiceId: String(p._id),
                status: { $in: ["published", "underOffer"] },
              },
              { $set: { status: "underOffer" } },
              { session: s },
            );
        }
        const updated = await Offer.findOneAndUpdate(
          {
            _id: o._id,
            status: "submitted",
            "terms.expiresAt": { $gt: new Date().toISOString() },
          },
          {
            $set: {
              status: b.status,
              decision: { ...b, actorId: uid(req), at: new Date() },
            },
          },
          { returnDocument: "after", session: s },
        );
        if (!updated) fail(409, "Offer is expired or already decided");
        // Unique partial index on accepted status prevents conflicting concurrent acceptances.
        await audit(
          req,
          "offer." + b.status,
          String(d._id),
          p.brokerageId,
          { offerId: String(o._id), reason: b.reason },
          s,
        );
        await notify(
          o.userId,
          `offer:${o._id}:${b.status}`,
          "An offer decision was recorded. Acceptance is not legal closing.",
          s,
        );
        return updated.toObject();
      }),
    );
  }),
);
deals.post(
  "/deals/:id/diligence/:itemId",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    const b = z
      .object({
        status: z.enum(["submitted", "accepted", "changesRequested", "waived"]),
        evidenceDocumentId: id.optional(),
        reason,
      })
      .strict()
      .parse(req.body);
    if (["closed", "handover", "completed", "cancelled"].includes(d.stage))
      fail(409, "Diligence is locked");
    if (b.status !== "submitted" && !manages(req, p))
      fail(403, "Assigned reviewer required");
    const item = d.diligence.find((x: any) => x.id === req.params.itemId);
    if (!item) fail(404, "Checklist item not found");
    if (["submitted", "accepted"].includes(b.status)) {
      const doc: any = await Document.findOne({
        _id: b.evidenceDocumentId,
        practiceId: String(p._id),
        state: "released",
      });
      if (!doc || !(await disclosure(req, p, `document:${doc._id}`)))
        fail(422, "Authorized released evidence required");
      if (item.evidenceCategory && doc.category !== item.evidenceCategory)
        fail(
          422,
          `This checklist item requires ${item.evidenceCategory} evidence`,
        );
    }
    ok(
      res,
      await command(
        req,
        "diligence.review",
        `${d._id}:${item.id}`,
        async (s) => {
          const fresh: any = await Deal.findById(d._id).session(s);
          if (
            ["closed", "handover", "completed", "cancelled"].includes(
              fresh.stage,
            )
          )
            fail(409, "Diligence is locked");
          const current = fresh.diligence.find((x: any) => x.id === item.id);
          Object.assign(current, b, {
            responsibleId:
              b.status === "submitted"
                ? uid(req)
                : current.responsibleId || uid(req),
            reviewerId: manages(req, p) ? uid(req) : undefined,
            at: new Date(),
          });
          fresh.markModified("diligence");
          fresh.revision++;
          await fresh.save({ session: s });
          await audit(
            req,
            "diligence." + b.status,
            String(d._id),
            p.brokerageId,
            { itemId: item.id, reason: b.reason },
            s,
          );
          return current;
        },
      ),
    );
  }),
);
deals.post(
  "/deals/:id/stage",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned broker required");
    const b = z
      .object({
        stage: z.enum([
          "initiated",
          "preparation",
          "diligence",
          "termsAgreed",
          "closing",
          "handover",
          "completed",
          "onHold",
          "cancelled",
        ]),
        revision: z.number().int().nonnegative(),
        reason,
      })
      .strict()
      .parse(req.body);
    ok(
      res,
      await command(req, "deal.stage", String(d._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        if (fresh.revision !== b.revision) fail(409, "Workspace changed");
        if (["completed", "cancelled"].includes(fresh.stage))
          fail(409, "Terminal stage cannot be changed");
        if (fresh.stage === "closed" && b.stage !== "handover")
          fail(422, "Closed deals can only enter handover");
        if (fresh.stage === "handover" && b.stage !== "completed")
          fail(422, "Handover can only be completed");
        if (!stageTransitions[fresh.stage]?.includes(b.stage))
          fail(422, "Invalid stage transition");
        if (
          fresh.stage === "onHold" &&
          b.stage !==
            fresh.history.filter((x: any) => x.stage !== "onHold").at(-1)
              ?.stage &&
          b.stage !== "cancelled"
        )
          fail(422, "Resume the stage recorded before hold");
        if (
          ["preparation", "diligence", "termsAgreed", "closing"].includes(
            b.stage,
          ) &&
          (!p.ownershipSnapshotId || fresh.baselineId !== p.ownershipSnapshotId)
        )
          fail(422, "Current ownership baseline required");
        if (
          ["preparation", "diligence", "termsAgreed", "closing"].includes(
            b.stage,
          )
        )
          await participantReadiness(
            req,
            p,
            fresh,
            s,
            b.stage !== "preparation",
          );
        if (["termsAgreed", "closing"].includes(b.stage))
          await diligenceReady(fresh, p, s);
        if (
          ["termsAgreed", "closing"].includes(b.stage) &&
          fresh.proposal?.disputed
        )
          fail(422, "Disputed transfers block progression");
        if (["termsAgreed", "closing"].includes(b.stage))
          await acceptedTerms(fresh, p, s);
        if (
          b.stage === "completed" &&
          (!(await Task.exists({
            dealId: String(d._id),
            kind: "handover",
            mandatory: true,
          }).session(s)) ||
            (await Task.exists({
              dealId: String(d._id),
              kind: "handover",
              mandatory: true,
              done: { $ne: true },
            }).session(s)))
        )
          fail(422, "Mandatory handover tasks are unresolved");
        fresh.stage = b.stage;
        fresh.revision++;
        fresh.history.push({ ...b, actorId: uid(req), at: new Date() });
        await fresh.save({ session: s });
        if (b.stage === "cancelled") {
          await Grant.updateMany(
            {
              practiceId: String(p._id),
              userId: { $in: fresh.participants.map((x: any) => x.userId) },
              revokedAt: null,
            },
            { $set: { revokedAt: new Date() } },
            { session: s },
          );
          const exclusive = await Practice.updateOne(
            { _id: p._id, exclusiveDealId: String(d._id) },
            { $unset: { exclusiveDealId: "" } },
            { session: s },
          );
          if (exclusive.modifiedCount)
            await Listing.updateOne(
              { practiceId: String(p._id), status: "underOffer" },
              { $set: { status: "published" } },
              { session: s },
            );
        }
        await audit(req, "deal.stage", String(d._id), p.brokerageId, b, s);
        for (const participant of fresh.participants.filter(
          (x: any) => x.active,
        ))
          await notify(
            participant.userId,
            `stage:${d._id}:${fresh.revision}:${participant.userId}`,
            "A transition workspace stage was updated.",
            s,
          );
        return dto(fresh);
      }),
    );
  }),
);
deals.post(
  "/deals/:id/close",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned broker required");
    const b = z
      .object({ evidenceDocumentId: id, baselineId: id, reason })
      .strict()
      .parse(req.body);
    ok(
      res,
      await command(req, "deal.close", String(d._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        const current: any = await Practice.findById(p._id).session(s);
        if (fresh.closing) fail(409, "Closing already applied");
        if (fresh.stage !== "closing") fail(422, "Deal must be in closing");
        if (
          fresh.baselineId !== b.baselineId ||
          current.ownershipSnapshotId !== b.baselineId
        )
          fail(409, "Stale ownership baseline");
        if (
          !(await Document.exists({
            _id: b.evidenceDocumentId,
            practiceId: String(p._id),
            category: "closing",
            state: "released",
          }).session(s))
        )
          fail(422, "Released external legal-close evidence required");
        await diligenceReady(fresh, p, s);
        const accepted = await acceptedTerms(fresh, p, s);
        await participantReadiness(req, p, fresh, s, true);
        const evidenceIds = Array.from(
          new Set(
            [
              b.evidenceDocumentId,
              accepted.decision.evidenceDocumentId,
              ...fresh.participants
                .filter((x: any) => x.active)
                .map((x: any) => x.authorityDocumentId),
              ...fresh.diligence
                .filter((x: any) => x.status === "accepted")
                .map((x: any) => x.evidenceDocumentId),
              ...(fresh.legalStructure === "equityTransfer"
                ? (fresh.proposal?.transfers || []).map(
                    (x: any) => x.consentDocumentId,
                  )
                : []),
            ].filter(Boolean),
          ),
        );
        const pinned = await Document.updateMany(
          {
            _id: { $in: evidenceIds },
            practiceId: String(p._id),
            state: "released",
          },
          { $inc: { referenceRevision: 1 } },
          { session: s },
        );
        if (pinned.matchedCount !== evidenceIds.length)
          fail(422, "Closing evidence changed; review again");
        let snapshotId = current.ownershipSnapshotId;
        if (fresh.legalStructure === "equityTransfer") {
          if (
            !fresh.proposal ||
            fresh.proposal.disputed ||
            fresh.proposal.baselineId !== b.baselineId
          )
            fail(422, "Current undisputed transfer proposal required");
          if (
            fresh.proposal.transfers.reduce(
              (sum: number, t: any) => sum + t.basisPoints,
              0,
            ) !== accepted.terms.stakeBasisPoints
          )
            fail(
              422,
              "Transfer proposal must match the accepted ownership stake",
            );
          for (const t of fresh.proposal.transfers)
            if (
              !(await Document.exists({
                _id: t.consentDocumentId,
                practiceId: String(p._id),
                category: "consent",
                state: "released",
              }).session(s))
            )
              fail(422, "Current consent evidence required");
          const before: any = await Snapshot.findById(b.baselineId).session(s);
          const after = applyTransfers(
            before.holdings,
            fresh.proposal.transfers,
          );
          const [snap] = await Snapshot.create(
            [
              {
                practiceId: String(p._id),
                holdings: after,
                previousId: b.baselineId,
                evidenceDocumentId: b.evidenceDocumentId,
                verifiedBy: uid(req),
              },
            ],
            { session: s },
          );
          snapshotId = String(snap._id);
          const changed = await Practice.updateOne(
            { _id: p._id, ownershipSnapshotId: b.baselineId },
            {
              $set: { ownershipSnapshotId: snapshotId },
              $inc: { revision: 1 },
            },
            { session: s },
          );
          if (!changed.modifiedCount) fail(409, "Concurrent ownership change");
        }
        if (fresh.legalStructure === "assetTransfer") {
          const changed = await Practice.updateOne(
            {
              _id: p._id,
              ownershipSnapshotId: b.baselineId,
              revision: current.revision,
            },
            { $inc: { revision: 1 } },
            { session: s },
          );
          if (!changed.modifiedCount) fail(409, "Concurrent practice change");
        }
        if (fresh.legalStructure === "otherReviewed")
          fail(
            422,
            "Other legal structures require an implemented reviewed closing policy",
          );
        await Practice.updateOne(
          { _id: p._id, exclusiveDealId: String(d._id) },
          { $unset: { exclusiveDealId: "" } },
          { session: s },
        );
        await Listing.updateOne(
          {
            practiceId: String(p._id),
            status: { $in: ["published", "underOffer", "paused"] },
          },
          { $set: { status: "closed" } },
          { session: s },
        );
        fresh.closing = {
          ...b,
          actorId: uid(req),
          at: new Date(),
          snapshotId,
          ownershipApplied: fresh.legalStructure === "equityTransfer",
        };
        fresh.stage = "closed";
        fresh.revision++;
        fresh.history.push({
          stage: "closed",
          at: new Date(),
          actorId: uid(req),
          reason: b.reason,
        });
        await fresh.save({ session: s });
        await audit(
          req,
          "deal.closed",
          String(d._id),
          p.brokerageId,
          fresh.closing,
          s,
        );
        for (const participant of fresh.participants)
          await notify(
            participant.userId,
            `closed:${d._id}`,
            "Legal closing was recorded; handover remains separate.",
            s,
          );
        return dto(fresh);
      }),
    );
  }),
);
deals.post(
  "/deals/:id/tasks",
  route(async (req, res) => {
    const { d, p } = await deal(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned broker required");
    const b = z
      .object({
        title: z.string().min(3).max(200),
        assignedTo: id,
        dueAt: z.string().datetime(),
        mandatory: z.boolean(),
        kind: z.enum(["followUp", "handover"]),
      })
      .strict()
      .parse(req.body);
    if (
      ![
        uid(req),
        p.ownerId,
        ...d.participants
          .filter((x: any) => x.active)
          .map((x: any) => x.userId),
      ].includes(b.assignedTo)
    )
      fail(422, "Task assignee must participate");
    ok(
      res,
      await command(req, "task.create", String(d._id), async (s) => {
        const fresh: any = await Deal.findById(d._id).session(s);
        if (["completed", "cancelled"].includes(fresh.stage))
          fail(409, "Terminal workspaces cannot receive new obligations");
        const [task] = await Task.create(
          [
            {
              ...b,
              dealId: String(d._id),
              practiceId: String(p._id),
              done: false,
            },
          ],
          { session: s },
        );
        // Updating the parent makes task creation conflict with concurrent completion gates.
        fresh.revision++;
        await fresh.save({ session: s });
        await audit(
          req,
          "task.created",
          String(d._id),
          p.brokerageId,
          { taskId: String(task._id) },
          s,
        );
        await notify(
          b.assignedTo,
          `assigned:${task._id}`,
          "A transition task was assigned to you.",
          s,
        );
        return task.toObject();
      }),
      201,
    );
  }),
);
deals.post(
  "/tasks/:id/complete",
  route(async (req, res) => {
    const t: any = await Task.findById(id.parse(req.params.id));
    if (!t) fail(404, "Task not found");
    const { d, p } = await deal(req, t.dealId);
    z.object({}).strict().parse(req.body);
    if (!manages(req, p) && t.assignedTo !== uid(req))
      fail(403, "Assigned actor required");
    if (t.kind === "handover" && !["closed", "handover"].includes(d.stage))
      fail(422, "Handover tasks can be completed only after legal closing");
    ok(
      res,
      await command(req, "task.complete", String(t._id), async (s) => {
        const updated = await Task.findOneAndUpdate(
          { _id: t._id },
          { $set: { done: true, completedBy: uid(req) } },
          { returnDocument: "after", session: s },
        );
        await audit(
          req,
          "task.completed",
          t.dealId,
          p.brokerageId,
          { taskId: String(t._id) },
          s,
        );
        return updated!.toObject();
      }),
    );
  }),
);
