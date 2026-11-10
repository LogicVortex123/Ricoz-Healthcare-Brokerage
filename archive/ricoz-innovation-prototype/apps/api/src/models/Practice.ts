import mongoose, { Schema, Document } from 'mongoose';

export interface IPractice extends Document {
  ownerId: string;
  brokerId?: string;
  specialty: string;
  name: string; // Encrypted in production (TD-06)
  address: {
    line: string;
    city: string;
    zone: string;
    state: string;
    pin: string;
  };
  yearsInOperation: number;
  practitioners: number;
  chairs: number;
  locations: number;
  staffCounts: {
    dentists: number;
    hygienists: number;
    assistants: number;
    frontDesk: number;
  };
  equipmentSummary: string;
  transitionType: 'complete_sale' | 'partial_sale' | 'partnership_transition';
  confidentiality: {
    showAskingPrice: boolean;
  };
  askingPrice?: number;
  status: 'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'rejected' | 'approved' | 'listed' | 'under_offer' | 'sold' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

const PracticeSchema = new Schema<IPractice>(
  {
    ownerId: { type: String, required: true, index: true },
    brokerId: { type: String, index: true },
    specialty: { type: String, required: true },
    name: { type: String, required: true },
    address: {
      line: { type: String, required: true },
      city: { type: String, required: true, index: true },
      zone: { type: String, required: true },
      state: { type: String, required: true },
      pin: { type: String, required: true },
    },
    yearsInOperation: { type: Number, required: true },
    practitioners: { type: Number, default: 1 },
    chairs: { type: Number, required: true },
    locations: { type: Number, default: 1 },
    staffCounts: {
      dentists: { type: Number, default: 1 },
      hygienists: { type: Number, default: 1 },
      assistants: { type: Number, default: 1 },
      frontDesk: { type: Number, default: 1 },
    },
    equipmentSummary: { type: String, required: true },
    transitionType: {
      type: String,
      enum: ['complete_sale', 'partial_sale', 'partnership_transition'],
      required: true,
    },
    confidentiality: {
      showAskingPrice: { type: Boolean, default: false },
    },
    askingPrice: { type: Number },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'in_review', 'changes_requested', 'rejected', 'approved', 'listed', 'under_offer', 'sold', 'withdrawn'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

PracticeSchema.index({ 'address.city': 1, specialty: 1, status: 1 });

export const Practice = mongoose.models.Practice || mongoose.model<IPractice>('Practice', PracticeSchema);

