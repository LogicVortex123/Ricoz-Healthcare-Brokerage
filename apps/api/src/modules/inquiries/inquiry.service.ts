import type { FilterQuery } from 'mongoose';
import { HttpError } from '../../utils/errors';
import { recordAudit } from '../audit/audit.service';
import { Practice } from '../practices/practice.model';
import { Inquiry, type IInquiry, type InquiryStatus } from './inquiry.model';

export type InquiryAudience = 'buyer' | 'seller' | 'admin';

type Person = {
  _id: unknown;
  name?: string;
  email?: string;
  organization?: string;
  city?: string;
  state?: string;
  phone?: string;
};

function person(value: unknown): Person | null {
  if (!value || typeof value !== 'object' || !('_id' in value) || !('email' in value)) return null;
  return value as Person;
}

function practiceSummary(value: unknown) {
  if (value && typeof value === 'object' && 'name' in value) {
    const practice = value as { _id: unknown; name?: string; category?: string; city?: string; state?: string };
    return {
      id: String(practice._id),
      name: practice.name ?? '',
      category: practice.category ?? '',
      city: practice.city ?? '',
      state: practice.state ?? '',
    };
  }
  return { id: String(value ?? ''), name: '', category: '', city: '', state: '' };
}

export function presentInquiry(
  inquiry: {
    _id: unknown;
    message: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
    practiceId: unknown;
    buyerId: unknown;
    sellerId: unknown;
  },
  audience: InquiryAudience,
) {
  const buyer = person(inquiry.buyerId);
  const seller = person(inquiry.sellerId);
  return {
    id: String(inquiry._id),
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt ?? null,
    updatedAt: inquiry.updatedAt ?? null,
    practice: practiceSummary(inquiry.practiceId),
    ...(audience !== 'buyer' && buyer
      ? {
          buyer: {
            id: String(buyer._id),
            name: buyer.name ?? '',
            email: buyer.email ?? '',
            organization: buyer.organization ?? '',
            city: buyer.city ?? '',
            state: buyer.state ?? '',
            phone: buyer.phone ?? '',
          },
        }
      : {}),
    ...(audience === 'admin' && seller
      ? { seller: { id: String(seller._id), name: seller.name ?? '', email: seller.email ?? '' } }
      : {}),
  };
}

function loadInquiry(id: unknown) {
  return Inquiry.findById(id)
    .populate('practiceId', 'name category city state')
    .populate('buyerId', 'name email organization city state phone')
    .populate('sellerId', 'name email');
}

const NEXT_STATUS: Record<InquiryStatus, InquiryStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'CLOSED'],
  ACKNOWLEDGED: ['CLOSED'],
  CLOSED: [],
};

export async function createInquiry(buyerId: string, practiceId: string, message: string) {
  const practice = await Practice.findById(practiceId);
  if (!practice || practice.status !== 'APPROVED') {
    throw new HttpError(404, 'That listing is not available.', 'NOT_FOUND');
  }
  if (String(practice.ownerId) === buyerId) {
    throw new HttpError(403, 'You cannot inquire on your own practice.', 'FORBIDDEN');
  }
  try {
    const inquiry = await Inquiry.create({
      practiceId,
      buyerId,
      sellerId: practice.ownerId,
      message,
      status: 'OPEN',
    });
    await recordAudit({
      actorId: buyerId,
      action: 'INQUIRY_CREATE',
      entityType: 'inquiry',
      entityId: String(inquiry._id),
      metadata: { practiceId },
    });
    return (await loadInquiry(inquiry._id)) ?? inquiry;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new HttpError(409, 'You already have an active inquiry for this practice.', 'DUPLICATE_INQUIRY');
    }
    throw error;
  }
}

export async function listInquiries(user: { id: string; role: string }, practiceId?: string) {
  const filter: FilterQuery<IInquiry> = {};
  if (user.role === 'BUYER') filter.buyerId = user.id;
  else if (user.role === 'SELLER') filter.sellerId = user.id;
  else if (user.role !== 'ADMIN') throw new HttpError(403, 'You do not have access to inquiries.', 'FORBIDDEN');
  if (practiceId) filter.practiceId = practiceId;
  return Inquiry.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('practiceId', 'name category city state')
    .populate('buyerId', 'name email organization city state phone')
    .populate('sellerId', 'name email');
}

export async function getInquiryForUser(user: { id: string; role: string }, inquiryId: string) {
  const inquiry = await loadInquiry(inquiryId);
  if (!inquiry) throw new HttpError(404, 'Inquiry not found.', 'NOT_FOUND');
  const buyerId = String((inquiry.buyerId as { _id?: unknown })?._id ?? inquiry.buyerId);
  const sellerId = String((inquiry.sellerId as { _id?: unknown })?._id ?? inquiry.sellerId);
  const allowed = user.role === 'ADMIN' || buyerId === user.id || sellerId === user.id;
  if (!allowed) throw new HttpError(403, 'You do not have access to this inquiry.', 'FORBIDDEN');
  const audience: InquiryAudience = user.role === 'ADMIN' ? 'admin' : buyerId === user.id ? 'buyer' : 'seller';
  return { inquiry, audience };
}

export async function updateInquiryStatus(sellerId: string, inquiryId: string, status: InquiryStatus) {
  const inquiry = await Inquiry.findById(inquiryId);
  if (!inquiry) throw new HttpError(404, 'Inquiry not found.', 'NOT_FOUND');
  if (String(inquiry.sellerId) !== sellerId) {
    throw new HttpError(403, 'You can only update inquiries for your own practices.', 'FORBIDDEN');
  }
  if (!NEXT_STATUS[inquiry.status].includes(status)) {
    throw new HttpError(409, 'That inquiry status change is not available.', 'INVALID_TRANSITION');
  }
  inquiry.status = status;
  await inquiry.save();
  await recordAudit({
    actorId: sellerId,
    action: 'INQUIRY_UPDATE',
    entityType: 'inquiry',
    entityId: inquiryId,
    metadata: { status },
  });
  return (await loadInquiry(inquiry._id)) ?? inquiry;
}
