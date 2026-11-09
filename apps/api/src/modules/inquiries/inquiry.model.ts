import { Schema, model, type InferSchemaType } from 'mongoose';

export const INQUIRY_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'CLOSED'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

const inquirySchema = new Schema(
  {
    practiceId: { type: Schema.Types.ObjectId, ref: 'Practice', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    status: { type: String, enum: INQUIRY_STATUSES, default: 'OPEN' },
  },
  { timestamps: true },
);

inquirySchema.index(
  { practiceId: 1, buyerId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['OPEN', 'ACKNOWLEDGED'] } } },
);
inquirySchema.index({ buyerId: 1, createdAt: -1 });
inquirySchema.index({ sellerId: 1, createdAt: -1 });

export type IInquiry = InferSchemaType<typeof inquirySchema>;
export const Inquiry = model('Inquiry', inquirySchema);
