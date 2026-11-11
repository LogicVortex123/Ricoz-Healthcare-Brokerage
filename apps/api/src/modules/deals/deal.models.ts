import { Schema, model } from 'mongoose';

const ndaSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    statementVersion: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
ndaSchema.index({ practiceId: 1, buyerId: 1 }, { unique: true });

const noteSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, required: true, enum: ['FINANCIAL', 'LEASE', 'STAFFING', 'OTHER'] },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
  },
  { timestamps: true },
);

const messageSchema = new Schema(
  {
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Inquiry', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const offerSchema = new Schema(
  {
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Inquiry', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    kind: { type: String, required: true, enum: ['OFFER', 'COUNTER', 'ACCEPTED', 'DECLINED'] },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const savedSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
savedSchema.index({ practiceId: 1, buyerId: 1 }, { unique: true });
savedSchema.index({ buyerId: 1, createdAt: -1 });

const assignmentSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true, unique: true },
    brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

const worksheetSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true, unique: true },
    revenue: { type: Number, required: true, min: 0 },
    operatingExpenses: { type: Number, required: true, min: 0 },
    ownerAddBack: { type: Number, required: true, min: 0 },
    multipleLow: { type: Number, required: true },
    multipleHigh: { type: Number, required: true },
  },
  { timestamps: true },
);

const commissionSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const taskSchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 160 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Nda = model('Nda', ndaSchema);
export const RoomNote = model('RoomNote', noteSchema);
export const ThreadMessage = model('ThreadMessage', messageSchema);
export const Offer = model('Offer', offerSchema);
export const SavedPractice = model('SavedPractice', savedSchema);
export const Assignment = model('Assignment', assignmentSchema);
export const Worksheet = model('Worksheet', worksheetSchema);
export const Commission = model('Commission', commissionSchema);
export const ClosingTask = model('ClosingTask', taskSchema);

export const NDA_VERSION = '2026-11';
export const NDA_STATEMENT =
  'I will use the confidential materials of this practice only to evaluate a possible transition. I will not share them, and I will not include patient information in any message. This record is an acknowledgement inside PracticeBridge. It is not a lawyer-prepared contract.';

export const WORKSHEET_FORMULA =
  'Earnings = revenue − operating expenses + owner add-back. The range multiplies those earnings by the multiples entered on this worksheet.';

export const WORKSHEET_DISCLAIMER =
  'This worksheet uses only the figures entered here. It is not an appraisal and it does not report what other practices have sold for.';

export const COMMISSION_NOTICE = 'This entry records an agreed figure. No card is charged.';
