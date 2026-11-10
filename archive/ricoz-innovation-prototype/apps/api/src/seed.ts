import "dotenv/config";
import mongoose from "mongoose";
import { diligenceTemplate } from "./platform/templates";
import argon2 from "argon2";
import fs from "node:fs/promises";
import path from "node:path";
import {
  models,
  User,
  Organization,
  Membership,
  Practice,
  Snapshot,
  Listing,
  Interest,
  Deal,
  Grant,
  Nda,
  Document,
  Offer,
  Task,
  Lead,
  Notification,
  Audit,
  Valuation,
} from "./platform/models";
import { hash, secret } from "./platform/core";
import { storageRoot } from "./platform/documents";
export async function seed() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_DEMO_SEED !== "true"
  )
    throw new Error("Set ALLOW_DEMO_SEED=true in development only");
  if (await User.exists({}))
    throw new Error(
      "Seed requires an empty database. Use a new development database name; existing data is preserved.",
    );
  await Promise.all(models.map((m) => m.init()));
  const password = await argon2.hash("DevelopmentOnly!2026");
  const orgs = await Organization.create([
    { name: "Fictional Meridian Brokerage", kind: "brokerage" },
    { name: "Fictional Harbor Brokerage", kind: "brokerage" },
    { name: "Fictional Acquiring Group", kind: "acquirer" },
  ]);
  const definitions = [
    ["seller", "seller", 0],
    ["buyer", "buyer", 2],
    ["buyer2", "buyer", 2],
    ["broker", "broker", 0],
    ["broker2", "broker", 0],
    ["manager", "manager", 0],
    ["foreignbroker", "broker", 1],
    ["foreignmanager", "manager", 1],
    ["admin", "superAdmin", 1],
    ["partner", "seller", 0],
    ["acquirer", "acquirer", 2],
  ] as const;
  const actors: Record<string, any> = {};
  const memberships: Record<string, any> = {};
  for (const [name, role, scope] of definitions) {
    const u = await User.create({
      email: `${name}@example.test`,
      name: `Fictional ${name}`,
      password,
      verified: true,
      mfaEnabled: false,
    });
    actors[name] = u;
    memberships[name] = await Membership.create({
      userId: String(u._id),
      organizationId: String(orgs[scope]._id),
      role,
      active: true,
    });
  }
  await fs.mkdir(storageRoot(), { recursive: true });
  const purposes = [
    "fullAcquisition",
    "partialBuyout",
    "partnerRetirement",
    "succession",
  ];
  const categories = ["dental", "veterinary", "specialistMedical", "dental"];
  for (let i = 0; i < purposes.length; i++) {
    const category = categories[i];
    const purpose = purposes[i];
    const p = await Practice.create({
      ownerId: String(actors.seller._id),
      brokerageId: String(orgs[0]._id),
      brokerId: String(actors.broker._id),
      intake: {
        category,
        legalName: `Fictional ${category} Entity ${i + 1}`,
        displayName: `Fictional ${category} Practice ${i + 1}`,
        country: ["GB", "CA", "AU", "US"][i],
        region: [
          "Northern region",
          "Lake region",
          "Western region",
          "Eastern region",
        ][i],
        address: `${10 + i} Example Road`,
        ownershipStructure: "Partnership",
        yearsOperating: 15,
        facility: "Synthetic leased facility",
        staffCount: 8,
        financials: [
          {
            period: "2025",
            currency: ["GBP", "CAD", "AUD", "USD"][i],
            revenueMinor: 50000000,
            expensesMinor: 35000000,
          },
        ],
        transitionReason: "Planned ownership transition",
        transitionPurpose: purpose,
        legalStructure: i === 0 ? "assetTransfer" : "equityTransfer",
        timeline: "Within 12 months",
        equipment: "Synthetic equipment only",
        ...(category === "veterinary"
          ? { species: ["Companion animals"], services: ["General care"] }
          : category === "specialistMedical"
            ? {
                specialty: "Cardiology",
                consultationFacilities: "Three rooms",
                procedureFacilities: "Procedure room",
              }
            : { specialty: "General dentistry", operatories: 4 }),
      },
    });
    const documentIds: Record<string, string> = {};
    for (const docCategory of [
      "ownership",
      "authority",
      "consent",
      "financial",
      "licence",
      "equipment",
      "terms",
      "closing",
      "other",
    ]) {
      const key = secret();
      const bytes = Buffer.from(
        `SYNTHETIC DEVELOPMENT ${docCategory} evidence for fictional practice ${i + 1}. No clinical records.`,
      );
      await fs.writeFile(path.join(storageRoot(), key), bytes, { mode: 0o600 });
      const released = docCategory !== "other";
      const d = await Document.create({
        practiceId: String(p._id),
        uploadedBy: String(actors.seller._id),
        name: `${docCategory}-synthetic.txt`,
        category: docCategory,
        classification: "participant",
        key,
        sha256: hash(bytes),
        size: bytes.length,
        mime: "text/plain",
        state: released ? "released" : "quarantined",
        scan: released
          ? {
              adapter: "DEVELOPMENT SYNTHETIC ONLY",
              hash: hash(bytes),
              at: new Date(),
            }
          : undefined,
        releasedBy: released ? String(actors.broker._id) : undefined,
      });
      documentIds[docCategory] = String(d._id);
    }
    const snapshot = await Snapshot.create({
      practiceId: String(p._id),
      holdings: [
        {
          ownerId: "partner-a",
          legalName: "Fictional Partner A",
          basisPoints: 6000,
        },
        {
          ownerId: "partner-b",
          legalName: "Fictional Partner B",
          basisPoints: 4000,
        },
      ],
      evidenceDocumentId: documentIds.ownership,
      verifiedBy: String(actors.broker._id),
    });
    p.ownershipSnapshotId = String(snapshot._id);
    await p.save();
    let listing: any;
    if (i !== 2)
      listing = await Listing.create({
        practiceId: String(p._id),
        brokerageId: String(orgs[0]._id),
        status: "published",
        reviewerId: String(actors.broker._id),
        teaser: {
          headline: `${titleCategory(category)} ownership opportunity`,
          category,
          country: p.intake.country,
          region: p.intake.region,
          summary:
            "Fictional demonstration opportunity. Established team and a planned, broker-managed ownership transition.",
          transitionPurpose: purpose,
        },
      });
    const participant = i === 2 ? "partner" : "buyer";
    const interest = await Interest.create({
      practiceId: String(p._id),
      listingId: listing ? String(listing._id) : undefined,
      userId: String(actors[participant]._id),
      readiness: "Synthetic human readiness review",
      qualification: {
        status: "approved",
        expiresAt: new Date(Date.now() + 30 * 86400000),
        reviewerId: String(actors.broker._id),
        reason: "Synthetic qualification evidence",
      },
    });
    await Lead.create({
      practiceId: String(p._id),
      interestId: String(interest._id),
      brokerageId: String(orgs[0]._id),
      brokerId: String(actors.broker._id),
      notes: [
        {
          text: "Synthetic internal note: never participant-facing.",
          actorId: String(actors.broker._id),
          at: new Date(),
        },
      ],
    });
    const deal = await Deal.create({
      practiceId: String(p._id),
      brokerageId: String(orgs[0]._id),
      brokerId: String(actors.broker._id),
      purpose,
      legalStructure: p.intake.legalStructure,
      stage: i === 3 ? "closed" : "preparation",
      baselineId: String(snapshot._id),
      participants: [
        {
          userId: String(actors[participant]._id),
          membershipId: String(memberships[participant]._id),
          capacity: i === 2 ? "remainingPartner" : "buyer",
          active: true,
          authorityDocumentId: documentIds.authority,
        },
      ],
      proposal:
        i > 0
          ? {
              baselineId: String(snapshot._id),
              disputed: false,
              transfers: [
                {
                  fromOwnerId: "partner-a",
                  toOwnerId: i === 2 ? "partner-b" : "buyer-c",
                  toLegalName:
                    i === 2 ? "Fictional Partner B" : "Fictional Buyer C",
                  basisPoints: i === 2 ? 6000 : 3000,
                  consentDocumentId: documentIds.consent,
                },
              ],
            }
          : undefined,
      diligence: diligenceTemplate(
        category,
        purpose,
        p.intake.legalStructure,
      ).map((item) => ({
        ...item,
        status: i === 3 ? "accepted" : "open",
        evidenceDocumentId: documentIds[item.evidenceCategory],
      })),
      history: [
        {
          stage: i === 3 ? "closed" : "preparation",
          actorId: String(actors.broker._id),
          at: new Date(),
          reason: "Synthetic fixture state",
        },
      ],
      closing:
        i === 3
          ? {
              at: new Date(),
              evidenceDocumentId: documentIds.closing,
              actorId: String(actors.broker._id),
              ownershipApplied: true,
              snapshotId: String(snapshot._id),
              syntheticFixture: true,
            }
          : undefined,
    });
    if (i === 3) {
      const final = await Snapshot.create({
        practiceId: String(p._id),
        previousId: String(snapshot._id),
        holdings: [
          {
            ownerId: "partner-a",
            legalName: "Fictional Partner A",
            basisPoints: 3000,
          },
          {
            ownerId: "partner-b",
            legalName: "Fictional Partner B",
            basisPoints: 4000,
          },
          {
            ownerId: "buyer-c",
            legalName: "Fictional Buyer C",
            basisPoints: 3000,
          },
        ],
        evidenceDocumentId: documentIds.closing,
        verifiedBy: String(actors.broker._id),
      });
      p.ownershipSnapshotId = String(final._id);
      await p.save();
      deal.closing.snapshotId = String(final._id);
      deal.markModified("closing");
      await deal.save();
    }
    if (process.env.NDA_TEXT && process.env.NDA_VERSION)
      await Nda.create({
        practiceId: String(p._id),
        userId: String(actors[participant]._id),
        version: process.env.NDA_VERSION,
        hash: hash(process.env.NDA_TEXT),
        actorName: actors[participant].name,
        representedParty: "Fictional represented party",
        authority: true,
        scope: "practice",
        acceptedAt: new Date(),
      });
    await Grant.create({
      practiceId: String(p._id),
      userId: String(actors[participant]._id),
      scopes: ["identity", `document:${documentIds.financial}`],
      expiresAt: new Date(Date.now() + (i === 1 ? -1 : 30) * 86400000),
      issuedBy: String(actors.broker._id),
    });
    const terms = {
      amountMinor: 15000000,
      currency: p.intake.financials[0].currency,
      stakeBasisPoints: i === 0 ? 10000 : 3000,
      legalStructure: p.intake.legalStructure,
      conditions: "Synthetic terms only, subject to external legal close",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      attachments: [],
    };
    const old = await Offer.create({
      dealId: String(deal._id),
      userId: String(actors[participant]._id),
      terms,
      status: "superseded",
    });
    await Offer.create({
      dealId: String(deal._id),
      userId: String(actors[participant]._id),
      previousId: String(old._id),
      terms: { ...terms, amountMinor: 16000000 },
      status: i === 3 ? "accepted" : "submitted",
      decision:
        i === 3
          ? {
              evidenceDocumentId: documentIds.terms,
              reason: "Synthetic terms accepted",
            }
          : undefined,
    });
    await Task.create({
      dealId: String(deal._id),
      practiceId: String(p._id),
      title:
        i === 3
          ? "Complete post-close operational handover"
          : "Follow up with named participants",
      assignedTo: String(actors[participant]._id),
      dueAt: new Date(Date.now() - 86400000),
      mandatory: true,
      kind: i === 3 ? "handover" : "followUp",
      done: false,
    });
    await Audit.create({
      actorId: String(actors.broker._id),
      resourceId: String(deal._id),
      brokerageId: String(orgs[0]._id),
      action: "demo.seeded",
      detail: { synthetic: true },
    });
    if (i === 0) {
      await Valuation.create({
        practiceId: String(p._id),
        requestedBy: String(actors.seller._id),
        status: "requested",
        reason: "Synthetic human valuation request for demonstration only",
        revision: 0,
        history: [
          {
            status: "requested",
            actorId: String(actors.seller._id),
            reason: "Synthetic human valuation request for demonstration only",
            at: new Date(),
          },
        ],
      });
    }
  }
  await Notification.create({
    userId: String(actors.seller._id),
    key: "demo:welcome",
    message: "Fictional demonstration data loaded. No real practice records.",
  });
  console.log(
    "Synthetic demo created. Accounts: seller, buyer, buyer2, broker, broker2, manager, foreignbroker, foreignmanager, admin, partner, acquirer @example.test. Development password: DevelopmentOnly!2026. Staff must enroll MFA.",
  );
}
const titleCategory = (s: string) =>
  s === "specialistMedical"
    ? "Specialist medical"
    : s[0].toUpperCase() + s.slice(1);
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || "")
    .then(seed)
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
