import mongoose, { Schema } from "mongoose";

// Strict command schemas validate every write; flexible persisted payloads permit versioned evidence.
function model(
  name: string,
  fields: Record<string, any>,
  indexes: [Record<string, any>, Record<string, any>?][] = [],
) {
  const schema = new Schema(fields, {
    timestamps: true,
    strict: true,
    optimisticConcurrency: true,
  });
  const required: Record<string, string[]> = {
    users: ["email", "name", "password"],
    organizations: ["name", "kind"],
    memberships: ["userId", "organizationId", "role", "active"],
    sessions: ["hash", "userId", "csrf", "expiresAt"],
    authTokens: ["hash", "userId", "purpose", "expiresAt"],
    practices: ["ownerId", "brokerageId", "intake"],
    documents: [
      "practiceId",
      "uploadedBy",
      "name",
      "classification",
      "category",
      "key",
      "state",
    ],
    deals: ["practiceId", "brokerageId", "purpose", "legalStructure", "stage"],
    offers: ["dealId", "userId", "terms", "status"],
    operations: ["key", "hash", "result"],
    notifications: ["userId", "key", "message"],
  };
  for (const field of required[name] || []) schema.path(field).required(true);
  for (const field of [
    "history",
    "notes",
    "participants",
    "holdings",
    "diligence",
    "scopes",
  ])
    if (schema.path(field))
      schema
        .path(field)
        .validate(
          (values: unknown[]) =>
            values.length <=
            (field === "history" ? 1000 : field === "notes" ? 100 : 50),
          "Bounded collection limit reached",
        );
  if (fields.practiceId) schema.index({ practiceId: 1, _id: 1 });
  if (fields.userId) schema.index({ userId: 1, _id: 1 });
  if (name === "documents") schema.index({ key: 1 }, { unique: true });
  for (const [keys, options] of indexes) schema.index(keys, options || {});
  return mongoose.models[name] || mongoose.model(name, schema, name);
}
const mixed = Schema.Types.Mixed;
export const User = model("users", {
  email: { type: String, required: true, unique: true },
  name: String,
  password: String,
  verified: Boolean,
  developmentVerification: Boolean,
  suspended: Boolean,
  deletionRequestedAt: Date,
  mfaSecret: String,
  mfaEnabled: Boolean,
  mfaLastStep: Number,
});
export const Organization = model("organizations", {
  name: String,
  kind: String,
});
export const Membership = model(
  "memberships",
  { userId: String, organizationId: String, role: String, active: Boolean },
  [[{ userId: 1, organizationId: 1 }, { unique: true }]],
);
export const Session = model(
  "sessions",
  {
    hash: { type: String, unique: true },
    userId: String,
    csrf: String,
    expiresAt: Date,
    mfaVerified: Boolean,
    authMode: String,
    refreshHash: String,
    previousRefreshHash: String,
    refreshRotatedAt: Date,
  },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const AuthToken = model(
  "authTokens",
  {
    hash: { type: String, unique: true },
    userId: String,
    purpose: String,
    payload: mixed,
    expiresAt: Date,
    consumedAt: Date,
  },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const Practice = model(
  "practices",
  {
    ownerId: String,
    brokerageId: String,
    brokerId: String,
    intake: mixed,
    revision: { type: Number, default: 0 },
    ownershipSnapshotId: String,
    exclusiveDealId: String,
  },
  [[{ ownerId: 1 }], [{ brokerageId: 1, brokerId: 1 }]],
);
export const Snapshot = model(
  "ownershipSnapshots",
  {
    practiceId: String,
    holdings: [mixed],
    evidenceDocumentId: String,
    verifiedBy: String,
    previousId: String,
  },
  [[{ practiceId: 1, createdAt: -1 }]],
);
export const Listing = model(
  "listings",
  {
    practiceId: { type: String, unique: true },
    brokerageId: String,
    status: String,
    teaser: mixed,
    reviewerId: String,
  },
  [[{ status: 1, "teaser.category": 1, _id: 1 }]],
);
export const Interest = model(
  "interests",
  {
    listingId: String,
    practiceId: String,
    userId: String,
    readiness: String,
    qualification: mixed,
  },
  [[{ practiceId: 1, userId: 1 }, { unique: true }]],
);
export const Nda = model("ndaRecords", {
  practiceId: String,
  userId: String,
  version: String,
  hash: String,
  actorName: String,
  representedParty: String,
  authority: Boolean,
  scope: String,
  acceptedAt: Date,
});
export const Grant = model(
  "accessGrants",
  {
    practiceId: String,
    userId: String,
    scopes: [String],
    expiresAt: Date,
    revokedAt: Date,
    issuedBy: String,
  },
  [[{ practiceId: 1, userId: 1 }]],
);
export const Document = model("documents", {
  practiceId: String,
  uploadedBy: String,
  name: String,
  classification: String,
  category: String,
  key: String,
  sha256: String,
  size: Number,
  mime: String,
  state: String,
  scan: mixed,
  releasedBy: String,
  previousId: String,
  hold: Boolean,
  retainUntil: Date,
  referenceRevision: { type: Number, default: 0 },
});
export const Lead = model("leads", {
  practiceId: String,
  interestId: String,
  brokerageId: String,
  brokerId: String,
  notes: [mixed],
});
export const Deal = model(
  "deals",
  {
    practiceId: String,
    brokerageId: String,
    brokerId: String,
    participants: [mixed],
    purpose: String,
    legalStructure: String,
    stage: String,
    revision: { type: Number, default: 0 },
    baselineId: String,
    proposal: mixed,
    diligence: [mixed],
    closing: mixed,
    history: [mixed],
  },
  [[{ brokerageId: 1, brokerId: 1 }], [{ "participants.userId": 1 }]],
);
export const Offer = model(
  "offers",
  {
    dealId: String,
    userId: String,
    previousId: String,
    submittedBy: String,
    terms: mixed,
    status: String,
    decision: mixed,
  },
  [
    [
      { dealId: 1, status: 1 },
      { unique: true, partialFilterExpression: { status: "accepted" } },
    ],
  ],
);
export const Task = model("tasks", {
  dealId: String,
  practiceId: String,
  title: String,
  assignedTo: String,
  dueAt: Date,
  mandatory: Boolean,
  kind: String,
  done: Boolean,
  completedBy: String,
});
export const Notification = model("notifications", {
  userId: String,
  key: { type: String, unique: true },
  message: String,
  readAt: Date,
});
export const Audit = model("auditEvents", {
  actorId: String,
  action: String,
  resourceId: String,
  brokerageId: String,
  detail: mixed,
  requestId: String,
});
export const Operation = model("operations", {
  key: { type: String, unique: true },
  hash: String,
  result: mixed,
});
export const Valuation = model(
  "valuationRequests",
  {
    practiceId: String,
    requestedBy: String,
    status: String,
    reviewerId: String,
    reportDocumentId: String,
    reason: String,
    reviewReason: String,
    revision: { type: Number, default: 0 },
    history: [mixed],
  },
  [
    [
      { practiceId: 1 },
      {
        unique: true,
        partialFilterExpression: { status: { $in: ["requested", "inReview"] } },
      },
    ],
  ],
);
export const Outbox = model(
  "outbox",
  { to: String, kind: String, token: String, expiresAt: Date },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const RateLimit = model(
  "rateLimits",
  { key: { type: String, unique: true }, count: Number, expiresAt: Date },
  [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
);
export const Job = model(
  "jobs",
  {
    key: { type: String, unique: true },
    type: String,
    payload: mixed,
    status: String,
    runAt: Date,
    leaseOwner: String,
    leaseUntil: Date,
    attempts: { type: Number, default: 0 },
    lastError: String,
  },
  [[{ status: 1, runAt: 1, leaseUntil: 1 }]],
);
export const models = [
  User,
  Organization,
  Membership,
  Session,
  AuthToken,
  Practice,
  Snapshot,
  Listing,
  Interest,
  Nda,
  Grant,
  Document,
  Lead,
  Deal,
  Offer,
  Task,
  Notification,
  Audit,
  Operation,
  Valuation,
  Outbox,
  RateLimit,
  Job,
];
