import { Router } from "express";
import { z } from "zod";
import { documentStore, malwareScanner } from "./adapters";
export { storageRoot } from "./adapters";
import {
  Document,
  Grant,
  Interest,
  Membership,
  Nda,
  User,
  Deal,
  Offer,
  Snapshot,
  Valuation,
} from "./models";
import {
  audit,
  command,
  disclosure,
  currentScopes,
  list,
  owns,
  fail,
  hash,
  manages,
  ok,
  practice,
  route,
  secret,
  uid,
  notify,
} from "./core";
import { id, reason } from "./contracts";
export const documents = Router();
documents.get(
  "/practices/:id/grants",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    return list(req, res, Grant, {
      practiceId: String(p._id),
      ...(manages(req, p) || owns(req, p) ? {} : { userId: uid(req) }),
    });
  }),
);
documents.get(
  "/practices/:id/nda-records",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    return list(req, res, Nda, {
      practiceId: String(p._id),
      ...(manages(req, p) || owns(req, p) ? {} : { userId: uid(req) }),
    });
  }),
);
const publicDoc = (d: any) => ({
  id: String(d._id),
  practiceId: d.practiceId,
  name: d.name,
  category: d.category,
  classification: d.classification,
  size: d.size,
  state: d.state,
  previousId: d.previousId,
  createdAt: d.createdAt,
});
documents.get(
  "/agreement",
  route(async (_req, res) =>
    ok(res, {
      version: process.env.NDA_VERSION || null,
      text: process.env.NDA_TEXT || null,
      hash: process.env.NDA_TEXT ? hash(process.env.NDA_TEXT) : null,
      notice:
        "Electronic acceptance evidence; not a legally validated e-signature.",
    }),
  ),
);
documents.post(
  "/practices/:id/nda",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    const b = z
      .object({
        version: z.string(),
        hash: z.string().length(64),
        actorName: z.string().min(2).max(100),
        representedParty: z.string().min(2).max(200),
        authority: z.literal(true),
      })
      .strict()
      .parse(req.body);
    if (!process.env.NDA_TEXT || !process.env.NDA_VERSION)
      fail(503, "Reviewed agreement is not configured");
    if (
      b.version !== process.env.NDA_VERSION ||
      b.hash !== hash(process.env.NDA_TEXT) ||
      b.actorName !== req.actor.name
    )
      fail(422, "Current agreement and registered actor name required");
    ok(
      res,
      await command(req, "nda.accept", String(p._id), async (s) => {
        const [n] = await Nda.create(
          [
            {
              ...b,
              practiceId: String(p._id),
              userId: uid(req),
              scope: "practice",
              acceptedAt: new Date(),
            },
          ],
          { session: s },
        );
        await audit(
          req,
          "nda.accepted",
          String(p._id),
          p.brokerageId,
          { ndaId: String(n._id), version: b.version },
          s,
        );
        return { id: String(n._id), version: n.version };
      }),
      201,
    );
  }),
);
documents.get(
  "/practices/:id/access",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    const staff = manages(req, p);
    const grants = await Grant.find({
      practiceId: String(p._id),
      ...(staff ? {} : { userId: uid(req) }),
    })
      .limit(100)
      .lean();
    const ndas = await Nda.find({
      practiceId: String(p._id),
      ...(staff ? {} : { userId: uid(req) }),
    })
      .limit(100)
      .lean();
    ok(res, {
      grants,
      ndas,
      canUpload: await disclosure(req, p, "upload"),
      financialOverview: (await disclosure(req, p, "financials"))
        ? p.intake.financials
        : null,
      identity: (await disclosure(req, p, "identity"))
        ? { legalName: p.intake.legalName, address: p.intake.address }
        : null,
    });
  }),
);
documents.post(
  "/practices/:id/grants",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id));
    if (!manages(req, p)) fail(403, "Assigned broker required");
    const b = z
      .object({
        userId: id,
        scopes: z
          .array(
            z
              .string()
              .regex(/^(identity|financials|upload|document:[a-f\d]{24})$/i),
          )
          .min(1)
          .max(30),
        expiresAt: z.string().datetime(),
        reason,
      })
      .strict()
      .parse(req.body);
    const now = new Date();
    if (new Date(b.expiresAt) <= now) fail(422, "Future expiry required");
    const target = await User.findOne({
      _id: b.userId,
      verified: true,
      suspended: { $ne: true },
    });
    if (
      !target ||
      !(await Membership.exists({ userId: b.userId, active: true }))
    )
      fail(422, "Active verified identity required");
    const { Deal } = await import("./models");
    if (
      !(await Deal.exists({
        practiceId: String(p._id),
        stage: { $ne: "cancelled" },
        participants: { $elemMatch: { userId: b.userId, active: true } },
      }))
    )
      fail(422, "Active explicit deal participation required");
    if (
      !(await Interest.exists({
        practiceId: String(p._id),
        userId: b.userId,
        "qualification.status": "approved",
        "qualification.expiresAt": { $gt: now },
      })) ||
      !(await Nda.exists({
        practiceId: String(p._id),
        userId: b.userId,
        version: process.env.NDA_VERSION,
        hash: hash(process.env.NDA_TEXT || ""),
      }))
    )
      fail(
        422,
        "Current opportunity qualification and agreement evidence required",
      );
    for (const scope of b.scopes)
      if (
        !["identity", "financials", "upload"].includes(scope) &&
        !(await Document.exists({
          _id: scope.slice(9),
          practiceId: String(p._id),
          state: "released",
          classification: "participant",
        }))
      )
        fail(422, "Released participant document required");
    ok(
      res,
      await command(req, "disclosure.grant", String(p._id), async (s) => {
        const [g] = await Grant.create(
          [{ ...b, practiceId: String(p._id), issuedBy: uid(req) }],
          { session: s },
        );
        await audit(
          req,
          "disclosure.granted",
          String(p._id),
          p.brokerageId,
          { grantId: String(g._id), reason: b.reason },
          s,
        );
        await notify(
          b.userId,
          `grant:${g._id}`,
          "Your named disclosure access was updated. Current prerequisites still apply.",
          s,
        );
        return g.toObject();
      }),
      201,
    );
  }),
);
documents.post(
  "/grants/:id/revoke",
  route(async (req, res) => {
    const g: any = await Grant.findById(id.parse(req.params.id));
    if (!g) fail(404, "Grant not found");
    const p = await practice(req, g.practiceId);
    const b = z.object({ reason }).strict().parse(req.body);
    ok(
      res,
      await command(req, "disclosure.revoke", String(g._id), async (s) => {
        await Grant.updateOne(
          { _id: g._id },
          { $set: { revokedAt: new Date() } },
          { session: s },
        );
        await audit(
          req,
          "disclosure.revoked",
          g.practiceId,
          p.brokerageId,
          b,
          s,
        );
        return { revoked: true };
      }),
    );
  }),
);
documents.get(
  "/practices/:id/documents",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    const base: any = { practiceId: String(p._id), state: { $ne: "deleted" } };
    if (!manages(req, p)) {
      if (owns(req, p)) base.classification = { $ne: "internal" };
      else {
        const scopes = await currentScopes(req, p);
        const ids = Array.from(scopes)
          .filter((scope) => /^document:[a-f0-9]{24}$/.test(scope))
          .map((scope) => scope.slice(9));
        base.$or = [
          {
            _id: { $in: ids },
            state: "released",
            classification: "participant",
          },
          ...(scopes.has("upload")
            ? [{ uploadedBy: uid(req), classification: "participant" }]
            : []),
        ];
      }
    }
    return list(req, res, Document, base, publicDoc);
  }),
);
documents.post(
  "/practices/:id/documents",
  route(async (req, res) => {
    const p = await practice(req, id.parse(req.params.id), true);
    const b = z
      .object({
        name: z
          .string()
          .regex(/^[a-zA-Z0-9 _.-]+\.(pdf|txt)$/)
          .max(120),
        category: z.enum([
          "authority",
          "ownership",
          "consent",
          "financial",
          "licence",
          "equipment",
          "terms",
          "closing",
          "valuation",
          "other",
        ]),
        classification: z.enum(["participant", "owner", "internal"]),
        previousId: id.optional(),
      })
      .strict()
      .parse(req.body);
    if (
      !manages(req, p) &&
      !owns(req, p) &&
      (b.classification !== "participant" ||
        !(await disclosure(req, p, "upload")))
    )
      fail(403, "Explicit current upload permission required");
    if (b.classification === "internal" && !manages(req, p))
      fail(403, "Internal documents require assigned staff");
    if (
      b.previousId &&
      !(await Document.exists({ _id: b.previousId, practiceId: String(p._id) }))
    )
      fail(422, "Prior version not found");
    const doc = await Document.create({
      ...b,
      practiceId: String(p._id),
      uploadedBy: uid(req),
      key: secret(),
      state: "initiated",
    });
    await audit(req, "document.initiated", String(p._id), p.brokerageId, {
      documentId: String(doc._id),
    });
    ok(res, publicDoc(doc), 201);
  }),
);
documents.put(
  "/documents/:id/content",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d) fail(404, "Document not found");
    const p = await practice(req, d.practiceId, true);
    if (
      !manages(req, p) &&
      (d.uploadedBy !== uid(req) || !(await disclosure(req, p, "upload")))
    )
      fail(403, "Authorized uploader or assigned broker required");
    if (d.state !== "initiated") fail(409, "Upload already consumed");
    const b = z
      .object({
        content: z
          .string()
          .min(4)
          .max(2800000)
          .regex(
            /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
          ),
      })
      .strict()
      .parse(req.body);
    const buffer = Buffer.from(b.content, "base64");
    if (buffer.length > 2 * 1024 * 1024)
      fail(422, "Maximum file size is 2 MiB");
    const isPdf = buffer.subarray(0, 5).toString() === "%PDF-";
    const isText =
      !buffer.includes(0) &&
      Buffer.from(buffer.toString("utf8")).equals(buffer) &&
      !/[\x01-\x08\x0e-\x1f]/.test(buffer.toString("utf8"));
    if (d.name.endsWith(".pdf") ? !isPdf : !isText || isPdf)
      fail(422, "File signature does not match extension");
    await documentStore().put(d.key, buffer);
    try {
      d.state = "quarantined";
      d.size = buffer.length;
      d.sha256 = hash(buffer);
      d.mime = isPdf ? "application/pdf" : "text/plain";
      await d.save();
    } catch (e) {
      await documentStore()
        .remove(d.key)
        .catch(() => {});
      throw e;
    }
    await audit(req, "document.quarantined", d.practiceId, p.brokerageId, {
      documentId: String(d._id),
    });
    ok(res, publicDoc(d));
  }),
);
documents.post(
  "/documents/:id/scan",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d) fail(404, "Document not found");
    const p = await practice(req, d.practiceId);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    z.object({}).strict().parse(req.body);
    if (d.state !== "quarantined") fail(409, "Document must be quarantined");
    const bytes = await documentStore().get(d.key);
    const scan = await malwareScanner().scan(bytes);
    const clean = scan.verdict === "clean";
    d.state = scan.verdict;
    d.scan = { adapter: scan.adapter, at: new Date(), hash: scan.contentHash };
    await d.save();
    await audit(req, "document.scanned", d.practiceId, p.brokerageId, {
      documentId: String(d._id),
      clean,
    });
    ok(res, publicDoc(d));
  }),
);
documents.post(
  "/documents/:id/release",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d) fail(404, "Document not found");
    const p = await practice(req, d.practiceId);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const b = z.object({ reason }).strict().parse(req.body);
    ok(
      res,
      await command(req, "document.release", String(d._id), async (s) => {
        const current: any = await Document.findById(d._id).session(s);
        if (current.state !== "clean")
          fail(422, "Clean scan required before review/release");
        const bytes = await documentStore().get(current.key);
        if (
          hash(bytes) !== current.sha256 ||
          current.scan.hash !== current.sha256
        )
          fail(409, "File integrity check failed");
        await Document.updateOne(
          { _id: current._id, state: "clean" },
          { $set: { state: "released", releasedBy: uid(req) } },
          { session: s },
        );
        if (current.previousId)
          await Document.updateOne(
            { _id: current.previousId },
            { $set: { state: "superseded" } },
            { session: s },
          );
        await audit(
          req,
          "document.released",
          current.practiceId,
          p.brokerageId,
          { documentId: String(current._id), reason: b.reason },
          s,
        );
        if (current.classification !== "internal")
          await notify(
            p.ownerId,
            `released:${current._id}`,
            "A practice document was reviewed and released.",
            s,
          );
        return { id: String(current._id), state: "released" };
      }),
    );
  }),
);
documents.get(
  "/documents/:id/download",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d || d.state !== "released") fail(404, "Document not found");
    const p = await practice(req, d.practiceId, true);
    if (
      d.classification === "internal"
        ? !manages(req, p)
        : !manages(req, p) &&
          !owns(req, p) &&
          (d.classification !== "participant" ||
            !(await disclosure(req, p, `document:${d._id}`)))
    )
      fail(404, "Document not found");
    const bytes = await documentStore().get(d.key);
    if (hash(bytes) !== d.sha256) fail(503, "Document integrity failure");
    await audit(req, "document.downloaded", d.practiceId, p.brokerageId, {
      documentId: String(d._id),
    });
    res.setHeader("Content-Disposition", `attachment; filename="${d.name}"`);
    res.type(d.mime).send(bytes);
  }),
);
documents.delete(
  "/documents/:id",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d) fail(404, "Document not found");
    const p = await practice(req, d.practiceId);
    const b = z.object({ reason }).strict().parse(req.body);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    if (d.hold || (d.retainUntil && d.retainUntil > new Date()))
      fail(409, "Retention or legal hold prevents deletion");
    const result = await command(
      req,
      "document.delete",
      String(d._id),
      async (s) => {
        const current: any = await Document.findById(d._id).session(s);
        if (
          current.hold ||
          (current.retainUntil && current.retainUntil > new Date())
        )
          fail(409, "Retention or hold prevents deletion");
        const documentId = String(d._id);
        if (
          (await Snapshot.exists({ evidenceDocumentId: documentId }).session(
            s,
          )) ||
          (await Deal.exists({
            $or: [
              { "closing.evidenceDocumentId": documentId },
              { "participants.authorityDocumentId": documentId },
              { "proposal.transfers.consentDocumentId": documentId },
              { "diligence.evidenceDocumentId": documentId },
            ],
          }).session(s)) ||
          (await Offer.exists({
            $or: [
              { "decision.evidenceDocumentId": documentId },
              { "terms.attachments": documentId },
            ],
          }).session(s)) ||
          (await Valuation.exists({ reportDocumentId: documentId }).session(s))
        )
          fail(
            409,
            "Evidence is referenced by transaction history; retain it or supersede through review",
          );
        current.state = "deleted";
        await current.save({ session: s });
        await audit(req, "document.deleted", d.practiceId, p.brokerageId, b, s);
        return { deleted: true };
      },
    );
    await documentStore().remove(d.key);
    ok(res, result);
  }),
);
documents.post(
  "/documents/:id/retention",
  route(async (req, res) => {
    const d: any = await Document.findById(id.parse(req.params.id));
    if (!d) fail(404, "Document not found");
    const p = await practice(req, d.practiceId);
    if (!manages(req, p)) fail(403, "Assigned reviewer required");
    const b = z
      .object({
        hold: z.boolean(),
        retainUntil: z.string().datetime().nullable(),
        reason,
      })
      .strict()
      .parse(req.body);
    const { hasRole } = await import("./core");
    if (
      ((d.hold && !b.hold) ||
        (d.retainUntil &&
          (!b.retainUntil || new Date(b.retainUntil) < d.retainUntil))) &&
      !hasRole(req, ["manager"], p.brokerageId)
    )
      fail(
        403,
        "Brokerage manager required to release a hold or reduce retention",
      );
    ok(
      res,
      await command(req, "document.retention", String(d._id), async (s) => {
        await Document.updateOne(
          { _id: d._id },
          {
            $set: {
              hold: b.hold,
              retainUntil: b.retainUntil ? new Date(b.retainUntil) : null,
            },
          },
          { session: s },
        );
        await audit(
          req,
          "document.retention",
          d.practiceId,
          p.brokerageId,
          { documentId: String(d._id), ...b },
          s,
        );
        return { id: String(d._id), hold: b.hold, retainUntil: b.retainUntil };
      }),
    );
  }),
);
