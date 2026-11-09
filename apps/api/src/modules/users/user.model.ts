import { Schema, model, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['SELLER', 'BUYER', 'ADMIN', 'BROKER'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const PUBLIC_ROLES = ['SELLER', 'BUYER'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: USER_ROLES },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    organization: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
