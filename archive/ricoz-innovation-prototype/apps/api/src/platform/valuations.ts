import { Router } from "express";
import { z } from "zod";
import { Practice, Document, Valuation, User } from "./models";
import {
  audit,
  command,
  fail,
  list,
  manages,
  notify,
  ok,
  practice,
  practiceFilter,
  Req,
  route,
  uid,
} from "./core";
import { collectionPage, id, reason } from "./contracts";

export const valuations = Router();
const statuses = z.enum(["requested", "inReview", "reported", "declined"]);
function summary(value: any, p: any, req: Req) {
  const open = ["requested", "inReview"].includes(value.status);
  return {
    id: String(value._id),
    _id: String(value._id),
    title: `${p.intake.displayName} · human valuation`,
    practiceId: value.practiceId,
    practiceName: p.intake.displayName,
    category: p.intake.category,
    status: value.status,
    revision: value.revision || 0,
    requestedAt: value.createdAt,
    updatedAt: value.updatedAt,
    requestReason: value.reason,
    reviewReason: value.reviewReason || null,
    reportDocumentId: value.reportDocumentId || null,
    permissions: {
      review: manages(req, p) && open,
    },
  };
}
valuations.post(
  "/practices/:id/valuation",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id));
    const body = z.object({ reason }).strict().parse(req.body);
    ok(
      res,
      await command(
        req,
        "valuation.request",
        String(p._id),
        async (session) => {
          if (
            await Valuation.exists({
              practiceId: String(p._id),
              status: { $in: ["requested", "inReview"] },
            }).session(session)
          )
            fail(409, "This practice already has an open valuation request");
          const [value] = await Valuation.create(
            [
              {
                practiceId: String(p._id),
                requestedBy: uid(req),
                status: "requested",
                reason: body.reason,
                revision: 0,
                history: [
                  {
                    status: "requested",
                    actorId: uid(req),
                    reason: body.reason,
                    at: new Date(),
                  },
                ],
              },
            ],
            { session },
          );
          await audit(
            req,
            "valuation.requested",
            String(p._id),
            p.brokerageId,
            { requestId: String(value._id) },
            session,
          );
          if (p.brokerId)
            await notify(
              p.brokerId,
              `valuation:${value._id}`,
              "An assigned practice requested a human valuation review.",
              session,
            );
          return summary(value, p, req);
        },
      ),
      201,
    );
  }),
);
valuations.get(
  "/valuations",
  route(async (req, res) => {
    const query = collectionPage
      .extend({
        status: statuses.optional(),
        practiceId: id.optional(),
      })
      .strict()
      .parse(req.query);
    const practices = await Practice.find(practiceFilter(req))
      .select("intake ownerId brokerageId brokerId")
      .lean();
    const byId = new Map(practices.map((p) => [String(p._id), p]));
    const scopedIds = [...byId.keys()];
    const practiceId = query.practiceId
      ? byId.has(query.practiceId)
        ? query.practiceId
        : "__none"
      : { $in: scopedIds.length ? scopedIds : ["__none"] };
    return list(
      req,
      res,
      Valuation,
      {
        practiceId,
        ...(query.status ? { status: query.status } : {}),
      },
      (value) => summary(value, byId.get(value.practiceId), req),
      undefined,
      query,
    );
  }),
);
valuations.get(
  "/valuations/:id",
  route(async (req, res) => {
    const value: any = await Valuation.findById(id.parse(req.params.id)).lean();
    if (!value) fail(404, "Valuation request not found");
    const p = await practice(req, value.practiceId);
    const report: any = value.reportDocumentId
      ? await Document.findOne({
          _id: value.reportDocumentId,
          practiceId: value.practiceId,
          category: "valuation",
          classification: { $in: ["owner", "participant"] },
          state: "released",
        })
          .select("name state classification")
          .lean()
      : null;
    const reviewer: any = value.reviewerId
      ? await User.findById(value.reviewerId).select("name").lean()
      : null;
    ok(res, {
      ...summary(value, p, req),
      reviewerName: reviewer?.name || null,
      history: value.history || [],
      report: report
        ? {
            id: String(report._id),
            name: report.name,
            state: report.state,
            classification: report.classification,
          }
        : null,
    });
  }),
);
valuations.post(
  "/valuations/:id/review",
  route(async (req, res) => {
    const value: any = await Valuation.findById(id.parse(req.params.id));
    if (!value) fail(404, "Valuation request not found");
    const p = await practice(req, value.practiceId);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const body = z
      .object({
        status: z.enum(["inReview", "reported", "declined"]),
        reportDocumentId: id.optional(),
        reason,
        revision: z.number().int().nonnegative(),
      })
      .strict()
      .parse(req.body);
    ok(
      res,
      await command(
        req,
        "valuation.review",
        String(value._id),
        async (session) => {
          const current: any = await Valuation.findById(value._id).session(
            session,
          );
          if ((current.revision || 0) !== body.revision)
            fail(409, "Valuation request changed. Refresh and review again.");
          if (!["requested", "inReview"].includes(current.status))
            fail(409, "Valuation review is already final");
          if (body.status === "reported" && current.status !== "inReview")
            fail(422, "Start the human review before publishing a report");
          if (body.status === "reported") {
            const pinned = await Document.updateOne(
              {
                _id: body.reportDocumentId,
                practiceId: value.practiceId,
                category: "valuation",
                state: "released",
                classification: { $in: ["owner", "participant"] },
              },
              { $inc: { referenceRevision: 1 } },
              { session },
            );
            if (!pinned.matchedCount)
              fail(
                422,
                "A released, owner-accessible valuation report for this practice is required",
              );
            current.reportDocumentId = body.reportDocumentId;
          } else if (body.reportDocumentId)
            fail(
              422,
              "Attach a report only when publishing a completed review",
            );
          current.status = body.status;
          current.reviewReason = body.reason;
          current.reviewerId = uid(req);
          current.revision = body.revision + 1;
          current.history.push({
            status: body.status,
            actorId: uid(req),
            reason: body.reason,
            at: new Date(),
            ...(body.status === "reported"
              ? { reportDocumentId: body.reportDocumentId }
              : {}),
          });
          await current.save({ session });
          await audit(
            req,
            "valuation.reviewed",
            String(p._id),
            p.brokerageId,
            {
              requestId: String(value._id),
              status: body.status,
              reason: body.reason,
            },
            session,
          );
          await notify(
            value.requestedBy,
            `valuation:${value._id}:${current.revision}`,
            body.status === "reported"
              ? "Your human valuation report is ready in the valuation workspace."
              : "Your human valuation request was reviewed.",
            session,
          );
          return summary(current, p, req);
        },
      ),
    );
  }),
);
