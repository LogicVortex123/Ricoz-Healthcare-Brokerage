import { Schema, model, type InferSchemaType, Types } from 'mongoose';

export const PRACTICE_CATEGORIES = ['DENTAL', 'VETERINARY', 'SPECIALIST_MEDICAL'] as const;
export const OWNERSHIP_TYPES = ['SOLE_OWNER', 'PARTNERSHIP', 'PROFESSIONAL_CORPORATION', 'LLC', 'OTHER'] as const;
export const TRANSACTION_TYPES = ['COMPLETE_ACQUISITION', 'PARTIAL_BUYOUT', 'PARTNER_RETIREMENT', 'OWNERSHIP_TRANSITION'] as const;
export const LISTING_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const;
export const PRICE_VISIBILITIES = ['PUBLIC', 'ON_REQUEST'] as const;

const historySchema = new Schema(
  {
    status: { type: String, required: true, enum: LISTING_STATUSES },
    note: { type: String, maxlength: 500, default: '' },
    at: { type: Date, required: true },
  },
  { _id: false },
);

const practiceSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: PRACTICE_CATEGORIES },
    specialty: { type: String, trim: true, maxlength: 80, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    yearsInOperation: { type: Number, default: null },
    practitionerCount: { type: Number, default: null },
    facilityInfo: { type: String, trim: true, maxlength: 2000, default: '' },
    ownershipType: { type: String, default: null },
    transactionType: { type: String, default: null },
    ownershipPercentage: { type: Number, default: null },
    askingPrice: { type: Number, default: null },
    priceVisibility: { type: String, enum: PRICE_VISIBILITIES, default: 'ON_REQUEST' },
    transitionReason: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: LISTING_STATUSES, default: 'DRAFT', index: true },
    rejectionReason: { type: String, trim: true, maxlength: 1000, default: '' },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    statusHistory: { type: [historySchema], default: [] },
    seedKey: { type: String },
  },
  { timestamps: true },
);

practiceSchema.index({ ownerId: 1, status: 1 });
practiceSchema.index({ status: 1, reviewedAt: -1 });
practiceSchema.index({ status: 1, category: 1, state: 1 });
practiceSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

export type IPractice = InferSchemaType<typeof practiceSchema>;
export type PracticeCategory = (typeof PRACTICE_CATEGORIES)[number];
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type PriceVisibility = (typeof PRICE_VISIBILITIES)[number];
export const Practice = model('Practice', practiceSchema);

export function asObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return new Types.ObjectId(id);
}
