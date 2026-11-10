import { z } from "zod";
const text = z.string().trim().min(2).max(300);
export const purpose = z.enum([
  "fullAcquisition",
  "partialBuyout",
  "partnerRetirement",
  "succession",
]);
export const structure = z.enum([
  "equityTransfer",
  "assetTransfer",
  "otherReviewed",
]);
const common = {
  legalName: text,
  displayName: text,
  country: z.string().length(2),
  region: text,
  address: text,
  ownershipStructure: text,
  yearsOperating: z.number().int().min(0).max(250),
  facility: text,
  staffCount: z.number().int().min(0).max(100000),
  financials: z
    .array(
      z
        .object({
          period: text,
          currency: z.string().regex(/^[A-Z]{3}$/),
          revenueMinor: z.number().int().nonnegative().safe(),
          expensesMinor: z.number().int().nonnegative().safe(),
        })
        .strict(),
    )
    .min(1)
    .max(10),
  transitionReason: text,
  transitionPurpose: purpose,
  legalStructure: structure,
  timeline: text,
  equipment: text,
};
export const intake = z.discriminatedUnion("category", [
  z
    .object({
      ...common,
      category: z.literal("dental"),
      specialty: text,
      operatories: z.number().int().positive().max(1000),
    })
    .strict(),
  z
    .object({
      ...common,
      category: z.literal("veterinary"),
      species: z.array(text).min(1).max(20),
      services: z.array(text).min(1).max(30),
    })
    .strict(),
  z
    .object({
      ...common,
      category: z.literal("specialistMedical"),
      specialty: text,
      consultationFacilities: text,
      procedureFacilities: text,
    })
    .strict(),
]);
export const teaser = z
  .object({
    headline: z.string().min(10).max(140),
    category: z.enum(["dental", "veterinary", "specialistMedical"]),
    country: z.string().length(2),
    region: text,
    summary: z.string().min(20).max(600),
    transitionPurpose: purpose,
  })
  .strict();
export const holding = z
  .object({
    ownerId: z.string().min(2).max(100),
    legalName: text,
    basisPoints: z.number().int().positive().max(10000),
  })
  .strict();
export const holdings = z
  .array(holding)
  .min(1)
  .max(50)
  .superRefine((a, ctx) => {
    if (
      a.reduce((s, x) => s + x.basisPoints, 0) !== 10000 ||
      new Set(a.map((x) => x.ownerId)).size !== a.length
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Unique ownership holdings must total exactly 10,000 basis points",
      });
  });
export const transfers = z
  .array(
    z
      .object({
        fromOwnerId: text,
        toOwnerId: text,
        toLegalName: text,
        basisPoints: z.number().int().positive().max(10000),
        consentDocumentId: z.string().regex(/^[a-f\d]{24}$/i),
      })
      .strict(),
  )
  .min(1)
  .max(50);
export function applyTransfers(
  before: z.infer<typeof holdings>,
  changes: z.infer<typeof transfers>,
) {
  holdings.parse(before);
  const after = before.map((x) => ({ ...x }));
  // All outgoing transfers are against the baseline, never against newly received holdings.
  for (const owner of before)
    if (
      changes
        .filter((t) => t.fromOwnerId === owner.ownerId)
        .reduce((s, t) => s + t.basisPoints, 0) > owner.basisPoints
    )
      throw Object.assign(new Error("Transfer exceeds baseline holding"), {
        status: 422,
      });
  for (const t of changes) {
    const from = after.find((x) => x.ownerId === t.fromOwnerId);
    if (!from || t.fromOwnerId === t.toOwnerId)
      throw Object.assign(new Error("Invalid transferor/transferee"), {
        status: 422,
      });
    from.basisPoints -= t.basisPoints;
    const to = after.find((x) => x.ownerId === t.toOwnerId);
    if (to) to.basisPoints += t.basisPoints;
    else
      after.push({
        ownerId: t.toOwnerId,
        legalName: t.toLegalName,
        basisPoints: t.basisPoints,
      });
  }
  return holdings.parse(after.filter((x) => x.basisPoints > 0));
}
export const page = z.object({
  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const id = z.string().regex(/^[a-f\d]{24}$/i);
export const reason = z.string().min(5).max(1000);
export const collectionPage = page
  .extend({ sort: z.enum(["oldest", "newest"]).default("newest") })
  .strict();
export const offerTerms = z
  .object({
    amountMinor: z.number().int().positive().safe(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    stakeBasisPoints: z.number().int().min(1).max(10000),
    legalStructure: structure,
    exclusive: z.boolean().default(false),
    conditions: z.string().min(5).max(4000),
    expiresAt: z.string().datetime(),
    attachments: z.array(id).max(10),
  })
  .strict();
