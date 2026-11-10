import mongoose, { Schema, Document } from 'mongoose';

export interface IPractice extends Document {
  code: string;
  sector: 'dental' | 'veterinary' | 'specialist_medical';
  title: string;
  confidentialName: string;
  specialty: string;
  transitionType: 'Buyout (100% Acquisition)' | 'Partner Retirement & Succession' | 'Partnership Transition (Partial Equity)';
  city: string;
  zone: string;
  addressLine: string;
  pincode: string;
  state: string;
  operatoriesOrBeds: string;
  yearsInOperation: number;
  revenueBand: string;
  exactRevenue: string;
  ebitda: string;
  askingPrice: string;
  sellerName: string;
  brokerName: string;
  stageId: string;
  daysInStage: number;
  checklistProgress: { completed: number; total: number };
  verifiedDocuments: number;
  totalDocuments: number;
  equipmentSummary: string[];
  statutoryLicences: string[];
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'listed' | 'under_offer' | 'sold' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

const PracticeSchema = new Schema<IPractice>(
  {
    code: { type: String, required: true, unique: true, index: true },
    sector: { type: String, enum: ['dental', 'veterinary', 'specialist_medical'], required: true, index: true },
    title: { type: String, required: true },
    confidentialName: { type: String, required: true },
    specialty: { type: String, required: true },
    transitionType: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    zone: { type: String, required: true },
    addressLine: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    operatoriesOrBeds: { type: String, required: true },
    yearsInOperation: { type: Number, required: true },
    revenueBand: { type: String, required: true },
    exactRevenue: { type: String, required: true },
    ebitda: { type: String, required: true },
    askingPrice: { type: String, required: true },
    sellerName: { type: String, required: true },
    brokerName: { type: String, required: true },
    stageId: { type: String, required: true, index: true },
    daysInStage: { type: Number, default: 1 },
    checklistProgress: {
      completed: { type: Number, default: 0 },
      total: { type: Number, default: 8 },
    },
    verifiedDocuments: { type: Number, default: 0 },
    totalDocuments: { type: Number, default: 8 },
    equipmentSummary: [{ type: String }],
    statutoryLicences: [{ type: String }],
    status: { type: String, default: 'listed', index: true },
  },
  { timestamps: true }
);

export const PracticeModel = mongoose.models.Practice || mongoose.model<IPractice>('Practice', PracticeSchema);

