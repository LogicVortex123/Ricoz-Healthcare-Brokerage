import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import argon2 from "argon2";
import { TOTP, Secret } from "otpauth";
import fs from "node:fs/promises";
import path from "node:path";
import { app } from "./app";
import { applyTransfers, holdings, intake } from "./contracts";
import {
  models,
  User,
  Organization,
  Membership,
  Session,
  Outbox,
  Practice,
  Listing,
  Document,
  Deal,
  Interest,
  Snapshot,
  Offer,
  Task,
  Grant,
  Notification,
  Job,
} from "./models";
import { hash, secret } from "./core";
import { planReminders, workOnce, schedule } from "./jobs";
import { consume } from "./limits";
import { authConfiguration } from "./auth-mode";
import {
  createJwtSession,
  signAccessToken,
  verifyAccessToken,
} from "./jwt-session";
let mongo: MongoMemoryReplSet;
let seller: any,
  buyer: any,
  otherBuyer: any,
  broker: any,
  manager: any,
  foreignBroker: any,
  superAdmin: any;
let brokerage: any, foreign: any, p: any, dealId: string, baseline: any;
const pass = "SyntheticPassword!2026";
const until = () => new Date(Date.now() + 86400000).toISOString();
const validIntake = {
  category: "dental",
  legalName: "PRIVATE NAME NEVER PUBLIC",
  displayName: "Fictional Dental",
  country: "GB",
  region: "North region",
  address: "SECRET 17 Fictional Road",
  ownershipStructure: "Partnership",
  yearsOperating: 15,
  facility: "Leased facility",
  staffCount: 7,
  financials: [
    {
      period: "2025",
      currency: "GBP",
      revenueMinor: 40000000,
      expensesMinor: 20000000,
    },
  ],
  transitionReason: "Partner retiring",
  transitionPurpose: "partialBuyout",
  legalStructure: "equityTransfer",
  timeline: "Twelve months",
  equipment: "Synthetic equipment",
  specialty: "General dentistry",
  operatories: 4,
};
async function actor(role: string, org: any) {
  const u = await User.create({
    email: `${role}-${secret().slice(0, 6)}@example.test`,
    name: `Fictional ${role}`,
    password: await argon2.hash(pass),
    verified: true,
  });
  const m = await Membership.create({
    userId: String(u._id),
    organizationId: String(org._id),
    role,
    active: true,
  });
  const pair = await createJwtSession(String(u._id), "standard", true);
  return {
    ...pair,
    user: u,
    membership: m,
    cookie: `hpt_session=${pair.accessToken}`,
    csrf: pair.csrf,
  };
}
function get(a: any, endpoint: string) {
  return request(app)
    .get("/api/v1" + endpoint)
    .set("Cookie", a.cookie);
}
function send(
  a: any,
  endpoint: string,
  body: any,
  method = "post",
  key = secret(),
) {
  return (request(app) as any)
    [method]("/api/v1" + endpoint)
    .set("Cookie", a.cookie)
    .set("X-CSRF-Token", a.csrf)
    .set("Idempotency-Key", key)
    .send(body);
}
async function doc(
  category: string,
  content = "Synthetic nonclinical text",
  classification = "participant",
) {
  const initiated = await send(seller, `/practices/${p._id}/documents`, {
    name: `${category}.txt`,
    category,
    classification,
  });
  expect(initiated.status).toBe(201);
  const id = initiated.body.data.id;
  expect(
    (
      await send(
        seller,
        `/documents/${id}/content`,
        { content: Buffer.from(content).toString("base64") },
        "put",
      )
    ).status,
  ).toBe(200);
  return id;
}
async function released(category: string) {
  const id = await doc(category);
  expect((await send(broker, `/documents/${id}/scan`, {})).status).toBe(200);
  expect(
    (
      await send(broker, `/documents/${id}/release`, {
        reason: "Synthetic evidence reviewed",
      })
    ).status,
  ).toBe(200);
  return id;
}
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = secret() + secret();
  process.env.DEV_EMAIL_OUTBOX = "true";
  process.env.DEV_SCANNER = "synthetic";
  process.env.NDA_VERSION = "dev-v1";
  process.env.NDA_TEXT =
    "DEVELOPMENT ONLY synthetic confidentiality agreement, not legally reviewed.";
  process.env.MONGOMS_DOWNLOAD_DIR = path.resolve("../../.mongodb-binaries");
  process.env.PRIVATE_STORAGE_PATH = path.resolve(
    ".test-private-" + Date.now(),
  );
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    binary: { version: "8.0.17" },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all(models.map((m) => m.init()));
  brokerage = await Organization.create({
    name: "Fictional North Brokerage",
    kind: "brokerage",
  });
  foreign = await Organization.create({
    name: "Fictional South Brokerage",
    kind: "brokerage",
  });
  seller = await actor("seller", brokerage);
  buyer = await actor("buyer", brokerage);
  otherBuyer = await actor("buyer", brokerage);
  broker = await actor("broker", brokerage);
  manager = await actor("manager", brokerage);
  foreignBroker = await actor("manager", foreign);
  superAdmin = await actor("superAdmin", foreign);
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  if (process.env.PRIVATE_STORAGE_PATH)
    await fs.rm(process.env.PRIVATE_STORAGE_PATH, {
      recursive: true,
      force: true,
    });
});
describe("domain invariants", () => {
  it("conserves absolute ownership percentage points and rejects over-transfer", () => {
    const before = [
      { ownerId: "partner-a", legalName: "Partner A", basisPoints: 6000 },
      { ownerId: "partner-b", legalName: "Partner B", basisPoints: 4000 },
    ];
    const transfer = [
      {
        fromOwnerId: "partner-a",
        toOwnerId: "buyer-c",
        toLegalName: "Buyer C",
        basisPoints: 3000,
        consentDocumentId: "a".repeat(24),
      },
    ];
    expect(applyTransfers(before, transfer).map((x) => x.basisPoints)).toEqual([
      3000, 4000, 3000,
    ]);
    expect(() =>
      applyTransfers(before, [{ ...transfer[0], basisPoints: 7000 }]),
    ).toThrow();
    expect(
      holdings.safeParse([{ ...before[0], basisPoints: 9000 }]).success,
    ).toBe(false);
  });
  it("validates category extensions and rejects mass assignment", () => {
    expect(intake.safeParse(validIntake).success).toBe(true);
    expect(
      intake.safeParse({ ...validIntake, brokerId: "injected" }).success,
    ).toBe(false);
    expect(
      intake.safeParse({ ...validIntake, category: "veterinary" }).success,
    ).toBe(false);
    const { operatories, specialty, ...base } = validIntake;
    expect(
      intake.safeParse({
        ...base,
        category: "veterinary",
        species: ["Companion"],
        services: ["General care"],
      }).success,
    ).toBe(true);
    expect(
      intake.safeParse({
        ...base,
        category: "specialistMedical",
        specialty: "Cardiology",
        consultationFacilities: "Consultation rooms",
        procedureFacilities: "Procedure room",
      }).success,
    ).toBe(true);
  });
});
describe("real replica-set API journeys", () => {
  it("registers, verifies, logs in, resets and revokes sessions without exposing tokens", async () => {
    const body = {
      email: "new@example.test",
      name: "Fictional New Account",
      password: pass,
      capacity: "buyer",
    };
    expect(
      (
        await request(app)
          .post("/api/v1/auth/register")
          .send({ ...body, role: "superAdmin" })
      ).status,
    ).toBe(422);
    expect(
      (await request(app).post("/api/v1/auth/register").send(body)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/login")
          .send({ email: body.email, password: pass })
      ).status,
    ).toBe(403);
    const out: any = await Outbox.findOne({ to: body.email, kind: "verify" });
    expect(out.token).toHaveLength(64);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/verify")
          .send({ token: out.token })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/verify")
          .send({ token: out.token })
      ).status,
    ).toBe(422);
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: body.email, password: pass });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(login.body.data.token).toBeUndefined();
    const before = await request(app)
      .post("/api/v1/auth/recovery")
      .send({ email: "unknown@example.test" });
    const known = await request(app)
      .post("/api/v1/auth/recovery")
      .send({ email: body.email });
    expect(known.body.data).toEqual(before.body.data);
    const reset: any = await Outbox.findOne({ to: body.email, kind: "reset" });
    expect(
      (
        await request(app)
          .post("/api/v1/auth/reset")
          .send({ token: reset.token, password: pass + "Changed" })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/v1/account")
          .set("Cookie", login.headers["set-cookie"][0])
      ).status,
    ).toBe(401);
  });
  it("requires privileged MFA and CSRF; rotation invalidates old session", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: broker.user.email, password: pass });
    const a = {
      cookie: login.headers["set-cookie"][0],
      csrf: login.body.data.csrf,
    };
    expect(login.body.data.mfaSetupRequired).toBe(true);
    expect((await get(a, "/practices")).status).toBe(403);
    const setup = await send(a, "/account/mfa/setup", {});
    const code = new TOTP({
      secret: Secret.fromBase32(setup.body.data.secret),
    }).generate();
    const confirm = await send(a, "/account/mfa/confirm", { code });
    expect(confirm.status).toBe(200);
    expect((await get(a, "/account")).status).toBe(401);
    const noCsrf = await request(app)
      .patch("/api/v1/account")
      .set("Cookie", confirm.headers["set-cookie"][0])
      .send({ name: "Changed" });
    expect(noCsrf.status).toBe(403);
    // Refresh test actor session after mandatory enrollment revoked all earlier sessions.
    const pair = await createJwtSession(
      String(broker.user._id),
      "standard",
      true,
    );
    broker.csrf = pair.csrf;
    broker.cookie = `hpt_session=${pair.accessToken}`;
  });
  it("creates and assigns a private practice transactionally and isolates scopes", async () => {
    const key = secret();
    const b = { brokerageId: String(brokerage._id), intake: validIntake };
    const first = await send(seller, "/practices", b, "post", key);
    expect(first.status).toBe(201);
    p = first.body.data;
    const retry = await send(seller, "/practices", b, "post", key);
    expect(retry.body.data._id).toBe(p._id);
    expect(await Practice.countDocuments()).toBe(1);
    expect(
      (
        await send(
          seller,
          "/practices",
          { ...b, intake: { ...validIntake, displayName: "Changed" } },
          "post",
          key,
        )
      ).status,
    ).toBe(409);
    expect((await get(broker, `/practices/${p._id}`)).status).toBe(404);
    expect((await get(superAdmin, `/practices/${p._id}`)).status).toBe(404);
    expect((await get(foreignBroker, "/practices")).body.data.items).toEqual(
      [],
    );
    expect(
      (
        await send(manager, `/practices/${p._id}/assign`, {
          brokerId: String(broker.user._id),
          reason: "Assign synthetic broker",
        })
      ).status,
    ).toBe(200);
    expect((await get(broker, `/practices/${p._id}`)).status).toBe(200);
  });
  it("publishes a safe teaser and records an interest and scoped lead", async () => {
    const b = {
      teaser: {
        headline: "Fictional regional dental opportunity",
        category: "dental",
        country: "GB",
        region: "Northern region",
        summary:
          "Synthetic approved opportunity for a partial ownership transition.",
        transitionPurpose: "partialBuyout",
      },
      status: "published",
      reason: "Anonymization manually reviewed",
    };
    expect((await send(seller, `/practices/${p._id}/listing`, b)).status).toBe(
      403,
    );
    expect((await send(broker, `/practices/${p._id}/listing`, b)).status).toBe(
      200,
    );
    const listing = await request(app).get("/api/v1/listings");
    const raw = JSON.stringify(listing.body);
    expect(raw).not.toContain("PRIVATE");
    expect(raw).not.toContain("address");
    expect(raw).not.toContain("revenueMinor");
    const l = listing.body.data.items[0];
    expect(
      (
        await send(buyer, `/listings/${l.id}/interests`, {
          readiness: "Synthetic ready buyer with finance review pending",
        })
      ).status,
    ).toBe(201);
    expect((await get(foreignBroker, "/leads")).body.data).toEqual([]);
    expect(
      (await request(app).get("/api/v1/listings?limit=10000")).status,
    ).toBe(422);
  });
  it("quarantines, validates signatures, scans and reviews private documents", async () => {
    const id = await doc("financial");
    expect((await get(seller, `/documents/${id}/download`)).status).toBe(404);
    expect(
      (
        await send(broker, `/documents/${id}/release`, {
          reason: "Review pending scan",
        })
      ).status,
    ).toBe(422);
    delete process.env.DEV_SCANNER;
    expect((await send(broker, `/documents/${id}/scan`, {})).status).toBe(503);
    expect((await Document.findById(id))!.state).toBe("quarantined");
    process.env.DEV_SCANNER = "synthetic";
    expect(
      (await send(broker, `/documents/${id}/scan`, {})).body.data.state,
    ).toBe("clean");
    expect(
      (
        await send(broker, `/documents/${id}/release`, {
          reason: "Synthetic reviewed financial",
        })
      ).status,
    ).toBe(200);
    const infected = await doc("other", "EICAR synthetic rejected file");
    expect(
      (await send(broker, `/documents/${infected}/scan`, {})).body.data.state,
    ).toBe("rejected");
    const bad = await send(seller, `/practices/${p._id}/documents`, {
      name: "fake.pdf",
      category: "other",
      classification: "participant",
    });
    expect(
      (
        await send(
          seller,
          `/documents/${bad.body.data.id}/content`,
          { content: Buffer.from("not a PDF").toString("base64") },
          "put",
        )
      ).status,
    ).toBe(422);
    expect((await get(otherBuyer, `/documents/${id}/download`)).status).toBe(
      404,
    );
  });
  it("verifies ownership and creates a private deal with explicit participants", async () => {
    const evidence = await released("ownership");
    const result = await send(broker, `/practices/${p._id}/ownership`, {
      holdings: [
        { ownerId: "partner-a", legalName: "Partner A", basisPoints: 6000 },
        { ownerId: "partner-b", legalName: "Partner B", basisPoints: 4000 },
      ],
      evidenceDocumentId: evidence,
      baselineId: null,
      reason: "Synthetic ownership evidence reviewed",
    });
    expect(result.status).toBe(200);
    baseline = result.body.data;
    expect(
      (
        await send(broker, `/practices/${p._id}/ownership`, {
          holdings: baseline.holdings.map(
            ({ ownerId, legalName, basisPoints }: any) => ({
              ownerId,
              legalName,
              basisPoints,
            }),
          ),
          evidenceDocumentId: evidence,
          baselineId: null,
          reason: "Stale baseline attempt",
        })
      ).status,
    ).toBe(409);
    const authority = await released("authority");
    const result2 = await send(broker, "/deals", {
      practiceId: p._id,
      purpose: "partialBuyout",
      legalStructure: "equityTransfer",
      participants: [
        {
          userId: String(buyer.user._id),
          capacity: "buyer",
          authorityDocumentId: authority,
        },
      ],
      reason: "Create synthetic private deal",
    });
    expect(result2.status).toBe(201);
    dealId = result2.body.data.id;
    expect((await get(buyer, `/deals/${dealId}`)).status).toBe(200);
    expect((await get(otherBuyer, `/deals/${dealId}`)).status).toBe(404);
    expect((await get(buyer, `/practices/${p._id}`)).status).toBe(404);
  });
  it("requires qualification AND NDA AND named scope, rechecks expiry and revocation", async () => {
    const financial: any = await Document.findOne({
      practiceId: p._id,
      category: "financial",
      state: "released",
    });
    const grant = {
      userId: String(buyer.user._id),
      scopes: ["identity", `document:${financial._id}`],
      expiresAt: until(),
      reason: "Explicit named synthetic grant",
    };
    expect(
      (await send(broker, `/practices/${p._id}/grants`, grant)).status,
    ).toBe(422);
    const interest: any = await Interest.findOne({
      practiceId: p._id,
      userId: String(buyer.user._id),
    });
    expect(
      (
        await send(broker, `/interests/${interest._id}/qualification`, {
          status: "approved",
          expiresAt: until(),
          reason: "Synthetic readiness reviewed",
        })
      ).status,
    ).toBe(200);
    const agreement = (await get(buyer, "/agreement")).body.data;
    expect(
      (
        await send(buyer, `/practices/${p._id}/nda`, {
          actorName: buyer.user.name,
          representedParty: "Fictional Buyer Party",
          authority: true,
          hash: agreement.hash,
          version: agreement.version,
        })
      ).status,
    ).toBe(201);
    expect(
      (await get(buyer, `/documents/${financial._id}/download`)).status,
    ).toBe(404);
    const g = await send(broker, `/practices/${p._id}/grants`, grant);
    expect(g.status).toBe(201);
    expect(
      (await get(buyer, `/documents/${financial._id}/download`)).status,
    ).toBe(200);
    expect(
      (await get(otherBuyer, `/documents/${financial._id}/download`)).status,
    ).toBe(404);
    await Grant.updateOne(
      { _id: g.body.data._id },
      { $set: { expiresAt: new Date(0) } },
    );
    expect(
      (await get(buyer, `/documents/${financial._id}/download`)).status,
    ).toBe(404);
    await Grant.updateOne(
      { _id: g.body.data._id },
      { $set: { expiresAt: new Date(until()) } },
    );
    expect(
      (
        await send(broker, `/grants/${g.body.data._id}/revoke`, {
          reason: "Synthetic grant revoked",
        })
      ).status,
    ).toBe(200);
    expect(
      (await get(buyer, `/documents/${financial._id}/download`)).status,
    ).toBe(404);
    expect(
      (await send(broker, `/practices/${p._id}/grants`, grant)).status,
    ).toBe(201);
  });
  it("keeps financial disclosure separate and requires an explicit upload grant", async () => {
    const access = await get(buyer, "/practices/" + p._id + "/access");
    expect(access.body.data.identity.legalName).toBe(validIntake.legalName);
    expect(access.body.data.financialOverview).toBeNull();
    const uploadBody = {
      name: "buyer-evidence.txt",
      category: "financial",
      classification: "participant",
    };
    expect(
      (await send(buyer, "/practices/" + p._id + "/documents", uploadBody))
        .status,
    ).toBe(403);
    expect(
      (
        await send(broker, "/practices/" + p._id + "/grants", {
          userId: String(buyer.user._id),
          scopes: ["financials", "upload"],
          expiresAt: until(),
          reason: "Explicit financial and upload authorization",
        })
      ).status,
    ).toBe(201);
    expect(
      (await get(buyer, "/practices/" + p._id + "/access")).body.data
        .financialOverview[0].revenueMinor,
    ).toBe(validIntake.financials[0].revenueMinor);
    const initiated = await send(
      buyer,
      "/practices/" + p._id + "/documents",
      uploadBody,
    );
    expect(initiated.status).toBe(201);
    const documentId = initiated.body.data.id;
    expect(
      (
        await send(
          buyer,
          "/documents/" + documentId + "/content",
          {
            content: Buffer.from("Synthetic buyer financial evidence").toString(
              "base64",
            ),
          },
          "put",
        )
      ).status,
    ).toBe(200);
    expect(
      (await get(buyer, "/documents/" + documentId + "/download")).status,
    ).toBe(404);
    expect(
      (await send(buyer, "/documents/" + documentId + "/scan", {})).status,
    ).toBe(404);
    const qualification: any = await Interest.findOne({
      practiceId: p._id,
      userId: String(buyer.user._id),
    });
    await Interest.updateOne(
      { _id: qualification._id },
      { $set: { "qualification.expiresAt": new Date(0) } },
    );
    expect(
      (await get(buyer, "/practices/" + p._id + "/access")).body.data
        .financialOverview,
    ).toBeNull();
    await Interest.updateOne(
      { _id: qualification._id },
      { $set: { "qualification.expiresAt": new Date(until()) } },
    );
    const version = process.env.NDA_VERSION;
    process.env.NDA_VERSION = "changed-agreement";
    expect(
      (await get(buyer, "/practices/" + p._id + "/access")).body.data.identity,
    ).toBeNull();
    process.env.NDA_VERSION = version;
  });
  it("isolates and versions offers; concurrent acceptance is exclusive", async () => {
    const offer = {
      amountMinor: 12000000,
      currency: "GBP",
      stakeBasisPoints: 3000,
      legalStructure: "equityTransfer",
      conditions: "Synthetic terms subject to legal close",
      expiresAt: until(),
      attachments: [],
    };
    const first = await send(buyer, `/deals/${dealId}/offers`, offer);
    expect(first.status).toBe(201);
    let second = await send(buyer, `/deals/${dealId}/offers`, {
      ...offer,
      amountMinor: 13000000,
      previousId: first.body.data._id,
    });
    expect(second.status).toBe(201);
    expect((await Offer.findById(first.body.data._id))!.terms.amountMinor).toBe(
      12000000,
    );
    expect((await Offer.findById(first.body.data._id))!.status).toBe(
      "superseded",
    );
    const beforeCounter = second.body.data;
    const counter = await send(
      seller,
      `/offers/${second.body.data._id}/counter`,
      { ...offer, amountMinor: 13500000 },
    );
    expect(counter.status).toBe(201);
    expect(counter.body.data.userId).toBe(String(buyer.user._id));
    expect(counter.body.data.submittedBy).toBe(String(seller.user._id));
    expect((await Offer.findById(beforeCounter._id))!.terms.amountMinor).toBe(
      13000000,
    );
    expect(
      (
        await send(
          otherBuyer,
          `/offers/${counter.body.data._id}/counter`,
          offer,
        )
      ).status,
    ).toBe(404);
    second = await send(buyer, `/offers/${counter.body.data._id}/counter`, {
      ...offer,
      amountMinor: 13000000,
    });
    expect(second.status).toBe(201);
    const third = await send(buyer, `/deals/${dealId}/offers`, {
      ...offer,
      amountMinor: 14000000,
    });
    const evidence = await released("terms");
    const body = {
      status: "accepted",
      evidenceDocumentId: evidence,
      reason: "Synthetic accepted terms communication",
    };
    const results = await Promise.all([
      send(broker, `/offers/${second.body.data._id}/decision`, body),
      send(broker, `/offers/${third.body.data._id}/decision`, body),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await Offer.countDocuments({ dealId, status: "accepted" })).toBe(1);
    expect((await Deal.findById(dealId))!.stage).toBe("initiated");
  });
  it("guards stage gates, applies closing exactly once, then separates handover", async () => {
    const stage = async (next: string) => {
      const d: any = await Deal.findById(dealId);
      return send(broker, `/deals/${dealId}/stage`, {
        stage: next,
        revision: d.revision,
        reason: "Synthetic stage evidence reviewed",
      });
    };
    expect((await stage("closing")).status).toBe(422);
    expect((await stage("preparation")).status).toBe(200);
    expect((await stage("diligence")).status).toBe(200);
    expect((await stage("termsAgreed")).status).toBe(422);
    const evidence = await released("consent");
    const checklist: any = await Deal.findById(dealId);
    for (const item of checklist.diligence) {
      let doc: any = await Document.findOne({
        practiceId: p._id,
        category: item.evidenceCategory,
        state: "released",
      });
      if (!doc) {
        const newId = await released(item.evidenceCategory);
        doc = await Document.findById(newId);
      }
      expect(
        (
          await send(broker, "/deals/" + dealId + "/diligence/" + item.id, {
            status: "accepted",
            evidenceDocumentId: String(doc._id),
            reason: "Synthetic evidence accepted",
          })
        ).status,
      ).toBe(200);
    }
    expect(
      (
        await send(broker, `/deals/${dealId}/proposal`, {
          baselineId: baseline._id,
          disputed: false,
          transfers: [
            {
              fromOwnerId: "partner-a",
              toOwnerId: "buyer-c",
              toLegalName: "Buyer C",
              basisPoints: 3000,
              consentDocumentId: evidence,
            },
          ],
          reason: "Synthetic proposal reviewed",
        })
      ).status,
    ).toBe(200);
    expect((await stage("termsAgreed")).status).toBe(200);
    expect((await stage("closing")).status).toBe(200);
    const closingEvidence = await released("closing");
    const key = secret();
    const body = {
      baselineId: baseline._id,
      evidenceDocumentId: closingEvidence,
      reason: "External synthetic legal close evidence",
    };
    const closed = await send(
      broker,
      `/deals/${dealId}/close`,
      body,
      "post",
      key,
    );
    expect(closed.status).toBe(200);
    expect(
      (await send(broker, `/deals/${dealId}/close`, body, "post", key)).status,
    ).toBe(200);
    expect((await send(broker, `/deals/${dealId}/close`, body)).status).toBe(
      409,
    );
    expect((await Listing.findOne({ practiceId: p._id }))!.status).toBe(
      "closed",
    );
    expect(await Snapshot.countDocuments({ practiceId: p._id })).toBe(2);
    const current: any = await Practice.findById(p._id);
    const snap: any = await Snapshot.findById(current.ownershipSnapshotId);
    expect(snap.holdings.map((h: any) => h.basisPoints)).toEqual([
      3000, 4000, 3000,
    ]);
    expect((await stage("preparation")).status).toBe(422);
    expect((await stage("handover")).status).toBe(200);
    expect((await stage("completed")).status).toBe(422);
    const task = await send(broker, `/deals/${dealId}/tasks`, {
      title: "Synthetic keys and access handover",
      assignedTo: String(buyer.user._id),
      dueAt: new Date(0).toISOString(),
      mandatory: true,
      kind: "handover",
    });
    expect(task.status).toBe(201);
    const metrics = (await get(broker, "/metrics")).body.data;
    expect(metrics).toMatchObject({
      practices: 1,
      activeDeals: 1,
      overdueTasks: 1,
      closedAwaitingHandover: 1,
      interests: 1,
    });
    expect(
      (await send(buyer, `/tasks/${task.body.data._id}/complete`, {})).status,
    ).toBe(200);
    expect((await stage("completed")).status).toBe(200);
    expect(await Notification.countDocuments({ key: `closed:${dealId}` })).toBe(
      1,
    );
  });
  it("closes an internal asset transition without changing entity ownership", async () => {
    const privatePractice: any = await Practice.create({
      ownerId: String(seller.user._id),
      brokerageId: String(brokerage._id),
      brokerId: String(broker.user._id),
      intake: {
        ...validIntake,
        transitionPurpose: "partnerRetirement",
        legalStructure: "assetTransfer",
      },
    });
    const snap = await Snapshot.create({
      practiceId: String(privatePractice._id),
      holdings: [
        {
          ownerId: "partner-a",
          legalName: "Fictional Partner A",
          basisPoints: 10000,
        },
      ],
      verifiedBy: String(broker.user._id),
    });
    privatePractice.ownershipSnapshotId = String(snap._id);
    await privatePractice.save();
    const oldPractice = p;
    p = privatePractice;
    const authorityId = await released("authority");
    const evidenceId = await released("closing");
    const termsId = await released("terms");
    p = oldPractice;
    const created = await send(broker, "/deals", {
      practiceId: String(privatePractice._id),
      purpose: "partnerRetirement",
      legalStructure: "assetTransfer",
      participants: [
        {
          userId: String(seller.user._id),
          capacity: "remainingPartner",
          authorityDocumentId: authorityId,
        },
      ],
      reason: "Internal transition without listing or external buyer",
    });
    expect(created.status).toBe(201);
    const internalId = created.body.data.id;
    expect(
      await Listing.countDocuments({ practiceId: String(privatePractice._id) }),
    ).toBe(0);
    expect(
      (
        await send(broker, `/practices/${privatePractice._id}/qualification`, {
          userId: String(seller.user._id),
          status: "approved",
          expiresAt: until(),
          reason: "Private remaining partner authority reviewed",
        })
      ).status,
    ).toBe(200);
    // Fixture isolates closing behavior; the full public-to-close gate journey is tested above.
    await Deal.updateOne(
      { _id: internalId },
      {
        $set: {
          stage: "closing",
          diligence: [
            {
              id: "authority",
              mandatory: true,
              status: "accepted",
              evidenceDocumentId: authorityId,
            },
          ],
        },
      },
    );
    await Offer.create({
      dealId: internalId,
      userId: String(seller.user._id),
      status: "accepted",
      terms: { legalStructure: "assetTransfer" },
      decision: { evidenceDocumentId: termsId },
    });
    const closed = await send(broker, `/deals/${internalId}/close`, {
      evidenceDocumentId: evidenceId,
      baselineId: String(snap._id),
      reason: "Synthetic external asset close evidence",
    });
    expect(closed.status).toBe(200);
    expect(closed.body.data.closing.ownershipApplied).toBe(false);
    expect(
      (await Practice.findById(privatePractice._id))!.ownershipSnapshotId,
    ).toBe(String(snap._id));
    expect(
      await Snapshot.countDocuments({
        practiceId: String(privatePractice._id),
      }),
    ).toBe(1);
  });
  it("honors document retention and legal hold during deletion", async () => {
    const d: any = await Document.findOne({
      practiceId: p._id,
      state: "released",
    });
    await Document.updateOne({ _id: d._id }, { $set: { hold: true } });
    expect(
      (
        await send(
          broker,
          `/documents/${d._id}`,
          { reason: "Attempt deletion while under hold" },
          "delete",
        )
      ).status,
    ).toBe(409);
    expect((await Document.findById(d._id))!.state).toBe("released");
  });
  it("pages private work queues with the same scope as details", async () => {
    const first = await get(broker, "/deals?limit=1");
    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(1);
    expect(first.body.pagination.nextCursor).toBeTruthy();
    const second = await get(
      broker,
      `/deals?limit=1&cursor=${first.body.pagination.nextCursor}`,
    );
    expect(second.body.data[0].id).not.toBe(first.body.data[0].id);
    expect((await get(foreignBroker, "/deals?limit=1")).body.data).toEqual([]);
    expect((await get(broker, "/deals?unknown=true")).status).toBe(422);
  });
  it("cannot bypass closing by changing an existing ownership snapshot", async () => {
    const current: any = await Practice.findById(p._id);
    const snap: any = await Snapshot.findById(current.ownershipSnapshotId);
    const evidence: any = await Document.findOne({
      practiceId: p._id,
      category: "ownership",
      state: "released",
    });
    const changed = snap.holdings.map((h: any, i: number) => ({
      ownerId: h.ownerId,
      legalName: h.legalName,
      basisPoints: h.basisPoints + (i === 0 ? 100 : i === 1 ? -100 : 0),
    }));
    expect(
      (
        await send(broker, `/practices/${p._id}/ownership`, {
          holdings: changed,
          evidenceDocumentId: String(evidence._id),
          baselineId: String(snap._id),
          reason: "Attempt to bypass legal closing",
        })
      ).status,
    ).toBe(422);
    expect((await Practice.findById(p._id))!.ownershipSnapshotId).toBe(
      String(snap._id),
    );
  });
  it("leases overdue jobs atomically, deduplicates reminders and recovers abandoned leases", async () => {
    const task = await Task.create({
      dealId,
      practiceId: p._id,
      title: "Synthetic overdue notification test",
      assignedTo: String(buyer.user._id),
      dueAt: new Date(0),
      mandatory: false,
      kind: "followUp",
      done: false,
    });
    await planReminders();
    await planReminders();
    const day = new Date().toISOString().slice(0, 10);
    const key = `task:${task._id}:${day}`;
    expect(await Job.countDocuments({ key })).toBe(1);
    await Promise.all([workOnce(), workOnce(), workOnce()]);
    for (let i = 0; i < 10 && (await workOnce()); i++) {
      /* consume any fixture reminders */
    }
    expect(await Notification.countDocuments({ key })).toBe(1);
    await schedule("abandoned-synthetic-lease", "overdueTask", {
      taskId: String(task._id),
      userId: String(buyer.user._id),
    });
    await Job.updateOne(
      { key: "abandoned-synthetic-lease" },
      {
        $set: {
          status: "running",
          leaseOwner: "crashed-worker",
          leaseUntil: new Date(0),
        },
      },
    );
    expect(await workOnce()).toBe(true);
    expect(
      (await Job.findOne({ key: "abandoned-synthetic-lease" }))!.status,
    ).toBe("completed");
  });
  it("persists rate limits and isolates buckets", async () => {
    await consume("behavior-test", "synthetic-actor", 1, 60000);
    await expect(
      consume("behavior-test", "synthetic-actor", 1, 60000),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      consume("behavior-test", "different-actor", 1, 60000),
    ).resolves.toBeUndefined();
  });
  it("invites a verified staff member and revokes the old sessions on acceptance", async () => {
    const invited = await actor("buyer", foreign);
    const invite = await send(manager, "/invitations", {
      email: invited.user.email,
      organizationId: String(brokerage._id),
      role: "broker",
      reason: "Synthetic named staff invitation",
    });
    expect(invite.status).toBe(200);
    expect(
      (
        await send(foreignBroker, "/invitations", {
          email: invited.user.email,
          organizationId: String(brokerage._id),
          role: "broker",
          reason: "Cross brokerage invitation denied",
        })
      ).status,
    ).toBe(403);
    const out: any = await Outbox.findOne({
      to: invited.user.email,
      kind: "invitation",
    });
    const accept = await send(invited, "/invitations/accept", {
      token: out.token,
    });
    expect(accept.status).toBe(200);
    expect((await get(invited, "/account")).status).toBe(401);
    expect(
      await Membership.exists({
        userId: String(invited.user._id),
        organizationId: String(brokerage._id),
        role: "broker",
        active: true,
      }),
    ).toBeTruthy();
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: invited.user.email, password: pass });
    expect(login.body.data.mfaSetupRequired).toBe(true);
  });
  it("does not reveal account existence when email transport is unavailable", async () => {
    delete process.env.DEV_EMAIL_OUTBOX;
    const known = await request(app)
      .post("/api/v1/auth/recovery")
      .send({ email: seller.user.email });
    const unknown = await request(app)
      .post("/api/v1/auth/recovery")
      .send({ email: "unknown-transport@example.test" });
    expect(known.status).toBe(503);
    expect(unknown.status).toBe(503);
    expect(known.body.error).toEqual(unknown.body.error);
    process.env.DEV_EMAIL_OUTBOX = "true";
  });
  it("isolates two buyers within one workspace and prevents conflicting exclusive acceptances", async () => {
    const authority: any = await Document.findOne({
      practiceId: p._id,
      category: "authority",
      state: "released",
    });
    const makeDeal = async (participants: any[]) => {
      const response = await send(broker, "/deals", {
        practiceId: p._id,
        purpose: "partialBuyout",
        legalStructure: "equityTransfer",
        participants: participants.map((a) => ({
          userId: String(a.user._id),
          capacity: "buyer",
          authorityDocumentId: String(authority._id),
        })),
        reason: "Synthetic competing buyer workspace",
      });
      expect(response.status).toBe(201);
      return response.body.data.id;
    };
    const shared = await makeDeal([buyer, otherBuyer]);
    const competing = await makeDeal([otherBuyer]);
    await send(broker, "/practices/" + p._id + "/qualification", {
      userId: String(otherBuyer.user._id),
      status: "approved",
      expiresAt: until(),
      reason: "Synthetic second buyer qualified",
    });
    const nda = (await get(otherBuyer, "/agreement")).body.data;
    expect(
      (
        await send(otherBuyer, "/practices/" + p._id + "/nda", {
          actorName: otherBuyer.user.name,
          representedParty: "Fictional second buyer",
          authority: true,
          hash: nda.hash,
          version: nda.version,
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await send(broker, "/practices/" + p._id + "/grants", {
          userId: String(otherBuyer.user._id),
          scopes: ["identity"],
          expiresAt: until(),
          reason: "Synthetic identity-only named grant",
        })
      ).status,
    ).toBe(201);
    const financial: any = await Document.findOne({
      practiceId: p._id,
      category: "financial",
      state: "released",
    });
    expect(
      (await get(otherBuyer, "/documents/" + financial._id + "/download"))
        .status,
    ).toBe(404);
    const terms = {
      amountMinor: 9000000,
      currency: "GBP",
      stakeBasisPoints: 3000,
      legalStructure: "equityTransfer",
      exclusive: true,
      conditions: "Synthetic exclusive offer terms",
      expiresAt: until(),
      attachments: [],
    };
    const first = await send(buyer, "/deals/" + shared + "/offers", terms);
    const second = await send(otherBuyer, "/deals/" + shared + "/offers", {
      ...terms,
      amountMinor: 9500000,
      exclusive: false,
    });
    const third = await send(otherBuyer, "/deals/" + competing + "/offers", {
      ...terms,
      exclusive: false,
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(third.status).toBe(201);
    const view = await get(otherBuyer, "/deals/" + shared);
    expect(view.body.data.offers).toHaveLength(1);
    expect(view.body.data.offers[0]._id).toBe(second.body.data._id);
    expect(JSON.stringify(view.body)).not.toContain(first.body.data._id);
    const evidence: any = await Document.findOne({
      practiceId: p._id,
      category: "terms",
      state: "released",
    });
    const decision = {
      status: "accepted",
      evidenceDocumentId: String(evidence._id),
      reason: "Recorded synthetic exclusive communication",
    };
    await Listing.updateOne(
      { practiceId: p._id },
      { $set: { status: "published" } },
    );
    expect(
      (
        await send(
          broker,
          "/offers/" + first.body.data._id + "/decision",
          decision,
        )
      ).status,
    ).toBe(200);
    expect((await Listing.findOne({ practiceId: p._id }))!.status).toBe(
      "underOffer",
    );
    expect(
      (
        await send(
          broker,
          "/offers/" + third.body.data._id + "/decision",
          decision,
        )
      ).status,
    ).toBe(409);
    const current: any = await Deal.findById(shared);
    expect(
      (
        await send(broker, "/deals/" + shared + "/stage", {
          stage: "cancelled",
          revision: current.revision,
          reason: "Synthetic cancellation preserves evidence",
        })
      ).status,
    ).toBe(200);
    expect((await Practice.findById(p._id))!.exclusiveDealId).toBeUndefined();
    expect((await Listing.findOne({ practiceId: p._id }))!.status).toBe(
      "published",
    );
    expect(
      await Grant.countDocuments({
        practiceId: p._id,
        userId: String(buyer.user._id),
        revokedAt: null,
      }),
    ).toBe(0);
    expect((await Offer.findById(first.body.data._id))!.status).toBe(
      "accepted",
    );
  });
  it("removes derived access promptly on reassignment and membership revocation", async () => {
    const newBroker = await actor("broker", brokerage);
    expect(
      (
        await send(manager, `/practices/${p._id}/assign`, {
          brokerId: String(newBroker.user._id),
          reason: "Synthetic reassignment",
        })
      ).status,
    ).toBe(200);
    expect((await get(broker, `/practices/${p._id}`)).status).toBe(404);
    expect(
      (await get(broker, "/practices")).body.data.items.some(
        (x: any) => String(x._id) === p._id,
      ),
    ).toBe(false);
    await Membership.create({
      userId: String(buyer.user._id),
      organizationId: String(foreign._id),
      role: "buyer",
      active: true,
    });
    await Membership.updateOne(
      { _id: buyer.membership._id },
      { $set: { active: false } },
    );
    expect((await get(buyer, "/account")).status).toBe(200);
    expect((await get(buyer, `/deals/${dealId}`)).status).toBe(404);
    expect((await get(buyer, "/deals")).body.data).toEqual([]);
  });
  it("supports simple development registration, password login and logout without weakening scopes", async () => {
    const previous = process.env.DEV_SIMPLE_AUTH;
    process.env.DEV_SIMPLE_AUTH = "true";
    try {
      const config = await request(app).get("/api/v1/auth/config");
      expect(config.body.data).toMatchObject({
        mode: "developmentSimple",
        requiresEmailVerification: false,
        requiresStaffMfa: false,
        passwordMinimum: 8,
      });
      const body = {
        email: "simple-new@example.test",
        name: "Fictional Simple Account",
        password: "Simple123!",
        capacity: "buyer",
      };
      const created = await request(app)
        .post("/api/v1/auth/register")
        .send(body);
      expect(created.status).toBe(201);
      expect(created.body.data.authMode).toBe("developmentSimple");
      expect(created.body.data.user.verificationDeferred).toBe(true);
      expect(created.body.data.user.verified).toBe(false);
      expect(created.headers["set-cookie"][0]).toContain("HttpOnly");
      const session = {
        cookie: created.headers["set-cookie"][0],
        csrf: created.body.data.csrf,
      };
      expect((await get(session, "/account")).status).toBe(200);
      expect((await get(session, "/practices/" + p._id)).status).toBe(404);
      expect(
        (
          await request(app)
            .patch("/api/v1/account")
            .set("Cookie", session.cookie)
            .send({ name: "Injected mutation" })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .post("/api/v1/auth/register")
            .send({ ...body, role: "superAdmin" })
        ).status,
      ).toBe(422);
      expect((await send(session, "/auth/logout", {})).status).toBe(200);
      expect((await get(session, "/account")).status).toBe(401);
      const invalid = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: body.email, password: "wrong" });
      expect(invalid.status).toBe(401);
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: body.email, password: body.password });
      expect(login.status).toBe(200);
      expect(login.body.data.mfaSetupRequired).toBe(false);
      delete process.env.DEV_SIMPLE_AUTH;
      expect(
        (
          await request(app)
            .get("/api/v1/account")
            .set("Cookie", login.headers["set-cookie"][0])
        ).status,
      ).toBe(401);
      expect(
        (
          await request(app)
            .post("/api/v1/auth/login")
            .send({ email: body.email, password: body.password })
        ).status,
      ).toBe(403);
    } finally {
      if (previous === undefined) delete process.env.DEV_SIMPLE_AUTH;
      else process.env.DEV_SIMPLE_AUTH = previous;
    }
  });
  it("lets staff use password-only local sessions, blocks suspension and rejects development mode in production", async () => {
    const previous = process.env.DEV_SIMPLE_AUTH;
    const environment = process.env.NODE_ENV;
    process.env.DEV_SIMPLE_AUTH = "true";
    try {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: broker.user.email, password: pass });
      expect(login.status).toBe(200);
      expect(login.body.data.mfaSetupRequired).toBe(false);
      const session = {
        cookie: login.headers["set-cookie"][0],
        csrf: login.body.data.csrf,
      };
      expect((await get(session, "/practices")).status).toBe(200);
      expect((await get(session, "/account")).body.data.authMode).toBe(
        "developmentSimple",
      );
      await User.updateOne(
        { _id: broker.user._id },
        { $set: { suspended: true } },
      );
      expect((await get(session, "/account")).status).toBe(401);
      expect(
        (
          await request(app)
            .post("/api/v1/auth/login")
            .send({ email: broker.user.email, password: pass })
        ).status,
      ).toBe(403);
      await User.updateOne(
        { _id: broker.user._id },
        { $set: { suspended: false } },
      );
      process.env.NODE_ENV = "production";
      expect(authConfiguration().mode).toBe("standard");
      expect((await get(session, "/account")).status).toBe(401);
    } finally {
      process.env.NODE_ENV = environment;
      if (previous === undefined) delete process.env.DEV_SIMPLE_AUTH;
      else process.env.DEV_SIMPLE_AUTH = previous;
    }
  });
  it("verifies JWT signatures, expiry, issuer and algorithm before granting access", async () => {
    const a = await actor("buyer", foreign);
    const decoded: any = jwt.decode(a.accessToken);
    expect(decoded.sub).toBe(String(a.user._id));
    expect(decoded.sid).toBe(a.sid);
    expect(decoded.exp - decoded.iat).toBe(900);
    expect(decoded.role).toBeUndefined();
    expect(verifyAccessToken(a.accessToken).sid).toBe(a.sid);
    const variants = [
      signAccessToken(String(a.user._id), a.sid, -60),
      jwt.sign({ sid: a.sid }, process.env.JWT_SECRET!, {
        algorithm: "HS384",
        subject: String(a.user._id),
        issuer: "healthcare-transition-api",
        audience: "healthcare-transition-web",
        expiresIn: 900,
        jwtid: secret(),
      }),
      jwt.sign({ sid: a.sid }, process.env.JWT_SECRET!, {
        algorithm: "HS256",
        subject: String(a.user._id),
        issuer: "wrong-issuer",
        audience: "healthcare-transition-web",
        expiresIn: 900,
        jwtid: secret(),
      }),
      a.accessToken.slice(0, -6) + "forged",
    ];
    for (const token of variants) {
      await Session.updateOne({ _id: a.sid }, { $set: { hash: hash(token) } });
      expect(
        (
          await request(app)
            .get("/api/v1/account")
            .set("Authorization", "Bearer " + token)
        ).status,
      ).toBe(401);
    }
    await Session.updateOne(
      { _id: a.sid },
      { $set: { hash: hash(a.accessToken) } },
    );
    expect(
      (
        await request(app)
          .get("/api/v1/account")
          .set("Authorization", "Bearer " + a.accessToken)
      ).status,
    ).toBe(200);
  });
  it("rotates JWT refresh sessions, rejects cross-origin refresh and detects refresh reuse", async () => {
    const a = await actor("buyer", foreign);
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: a.user.email, password: pass });
    expect(login.status).toBe(200);
    const cookies = login.headers["set-cookie"] as unknown as string[];
    const access = cookies
      .find((c) => c.startsWith("hpt_session="))!
      .split(";")[0];
    const refresh = cookies
      .find((c) => c.startsWith("hpt_refresh="))!
      .split(";")[0];
    const claims: any = jwt.decode(access.slice("hpt_session=".length));
    expect(cookies.find((c) => c.startsWith("hpt_refresh="))).toContain(
      "HttpOnly",
    );
    expect(cookies.find((c) => c.startsWith("hpt_refresh="))).toContain(
      "Path=/api/v1/auth",
    );
    expect(
      (
        await request(app)
          .post("/api/v1/auth/refresh")
          .set("Cookie", refresh)
          .set("Origin", "https://untrusted.example.test")
          .send({})
      ).status,
    ).toBe(403);
    const expired = signAccessToken(String(a.user._id), claims.sid, -60);
    await Session.updateOne(
      { _id: claims.sid },
      { $set: { hash: hash(expired) } },
    );
    expect(
      (
        await request(app)
          .get("/api/v1/account")
          .set("Cookie", "hpt_session=" + expired)
      ).status,
    ).toBe(401);
    const rotated = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refresh)
      .set("Origin", process.env.WEB_ORIGIN || "http://localhost:3000")
      .send({});
    expect(rotated.status).toBe(200);
    const nextCookies = rotated.headers["set-cookie"] as unknown as string[];
    const nextAccess = nextCookies
      .find((c) => c.startsWith("hpt_session="))!
      .split(";")[0];
    const nextRefresh = nextCookies
      .find((c) => c.startsWith("hpt_refresh="))!
      .split(";")[0];
    expect(nextAccess).not.toBe(access);
    expect(nextRefresh).not.toBe(refresh);
    expect(
      (await request(app).get("/api/v1/account").set("Cookie", nextAccess))
        .status,
    ).toBe(200);
    await Session.updateOne(
      { _id: claims.sid },
      { $set: { refreshRotatedAt: new Date(Date.now() - 10000) } },
    );
    expect(
      (
        await request(app)
          .post("/api/v1/auth/refresh")
          .set("Cookie", refresh)
          .set("Origin", process.env.WEB_ORIGIN || "http://localhost:3000")
          .send({})
      ).status,
    ).toBe(401);
    expect(
      (await request(app).get("/api/v1/account").set("Cookie", nextAccess))
        .status,
    ).toBe(401);
  });
  it("runs the human valuation request, review and report workflow", async () => {
    // Earlier journey tests reassign the original broker; managers retain brokerage scope.
    const reviewer = manager;
    async function releaseForReview(category: string) {
      const id = await doc(category);
      expect((await send(reviewer, `/documents/${id}/scan`, {})).status).toBe(
        200,
      );
      expect(
        (
          await send(reviewer, `/documents/${id}/release`, {
            reason: "Synthetic valuation evidence reviewed",
          })
        ).status,
      ).toBe(200);
      return id;
    }
    const requested = await send(seller, `/practices/${p._id}/valuation`, {
      reason: "Seller requests a human valuation report for transition planning",
    });
    expect(requested.status).toBe(201);
    expect(requested.body.data.status).toBe("requested");
    const valuationId = requested.body.data.id;
    expect(
      (
        await send(seller, `/practices/${p._id}/valuation`, {
          reason: "Duplicate open request must be rejected",
        })
      ).status,
    ).toBe(409);
    expect((await get(foreignBroker, `/valuations/${valuationId}`)).status).toBe(
      404,
    );
    expect((await get(buyer, "/valuations")).body.data).toEqual([]);
    expect(
      (
        await send(reviewer, `/valuations/${valuationId}/review`, {
          status: "reported",
          reason: "Cannot publish before starting review",
          revision: 0,
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await send(reviewer, `/valuations/${valuationId}/review`, {
          status: "inReview",
          reason: "Assigned staff starts human review",
          revision: 0,
        })
      ).body.data.status,
    ).toBe("inReview");
    expect(
      (
        await send(reviewer, `/valuations/${valuationId}/review`, {
          status: "reported",
          reason: "Report missing",
          revision: 1,
        })
      ).status,
    ).toBe(422);
    const financial = await releaseForReview("financial");
    expect(
      (
        await send(reviewer, `/valuations/${valuationId}/review`, {
          status: "reported",
          reportDocumentId: financial,
          reason: "Wrong evidence category",
          revision: 1,
        })
      ).status,
    ).toBe(422);
    const report = await releaseForReview("valuation");
    const published = await send(reviewer, `/valuations/${valuationId}/review`, {
      status: "reported",
      reportDocumentId: report,
      reason: "Human valuation report released to the practice owner",
      revision: 1,
    });
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe("reported");
    expect(
      (
        await send(reviewer, `/valuations/${valuationId}/review`, {
          status: "declined",
          reason: "Already final",
          revision: 1,
        })
      ).status,
    ).toBe(409);
    const detail = await get(seller, `/valuations/${valuationId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.report.id).toBe(report);
    expect(detail.body.data.history.map((h: any) => h.status)).toEqual([
      "requested",
      "inReview",
      "reported",
    ]);
    const scoped = await get(seller, `/valuations?practiceId=${p._id}`);
    expect(scoped.body.data.some((v: any) => v.id === valuationId)).toBe(true);
    const again = await send(seller, `/practices/${p._id}/valuation`, {
      reason: "Follow-up human valuation after the first report",
    });
    expect(again.status).toBe(201);
    expect(
      (
        await send(reviewer, `/valuations/${again.body.data.id}/review`, {
          status: "declined",
          reason: "Insufficient evidence for another human report",
          revision: 0,
        })
      ).body.data.status,
    ).toBe("declined");
  });
});
