import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  practiceId: string;
  publicTitle: string;
  teaser: {
    specialty: string;
    city: string;
    zone: string;
    revenueBand: string;
    chairs: number;
    transitionType: string;
  };
  tier1: {
    years: number;
    practitioners: number;
    locations: number;
    equipmentSummary: string;
    staffAggregate: number;
  };
  approvedBy?: string;
  approvedAt?: Date;
  status: 'draft' | 'approved' | 'listed' | 'under_offer' | 'sold' | 'withdrawn';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    practiceId: { type: String, required: true, unique: true, index: true },
    publicTitle: { type: String, required: true },
    teaser: {
      specialty: { type: String, required: true },
      city: { type: String, required: true },
      zone: { type: String, required: true },
      revenueBand: { type: String, required: true },
      chairs: { type: Number, required: true },
      transitionType: { type: String, required: true },
    },
    tier1: {
      years: { type: Number, required: true },
      practitioners: { type: Number, required: true },
      locations: { type: Number, default: 1 },
      equipmentSummary: { type: String, required: true },
      staffAggregate: { type: Number, required: true },
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'approved', 'listed', 'under_offer', 'sold', 'withdrawn'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

ListingSchema.index({ status: 1, 'teaser.city': 1, 'teaser.specialty': 1 });
ListingSchema.index({ publicTitle: 'text' });

export const Listing = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);

