import type { FilterQuery } from 'mongoose';
import { HttpError } from '../../utils/errors';
import { escapeRegex } from '../../utils/regex';
import { recordAudit } from '../audit/audit.service';
import { Practice, type IPractice, type ListingStatus } from './practice.model';
import { assertReadyToSubmit, type ListingQuery, type PracticeInput } from './practice.schema';

const EDITABLE = new Set<ListingStatus>(['DRAFT', 'REJECTED', 'WITHDRAWN']);

async function findOrThrow(practiceId: string) {
  const practice = await Practice.findById(practiceId);
  if (!practice) throw new HttpError(404, 'Practice not found.', 'NOT_FOUND');
  return practice;
}

function assertOwner(practice: { ownerId: unknown }, ownerId: string) {
  if (String(practice.ownerId) !== ownerId) {
    throw new HttpError(403, 'You can only change your own practices.', 'FORBIDDEN');
  }
}

function pushHistory(practice: { statusHistory: IPractice['statusHistory'] }, status: ListingStatus, note: string) {
  practice.statusHistory.push({ status, note, at: new Date() });
}

export async function createPractice(ownerId: string, input: PracticeInput) {
  const practice = await Practice.create({
    ...input,
    ownerId,
    status: 'DRAFT',
    statusHistory: [{ status: 'DRAFT', note: 'Draft created', at: new Date() }],
  });
  await recordAudit({ actorId: ownerId, action: 'PRACTICE_CREATE', entityType: 'practice', entityId: String(practice._id) });
  return practice;
}

export async function updatePractice(ownerId: string, practiceId: string, input: PracticeInput) {
  const practice = await findOrThrow(practiceId);
  assertOwner(practice, ownerId);
  if (!EDITABLE.has(practice.status)) {
    throw new HttpError(409, 'Withdraw the listing before editing it. Pending and approved listings are locked.', 'LISTING_LOCKED');
  }
  practice.set(input);
  if (practice.status === 'WITHDRAWN') {
    practice.status = 'DRAFT';
    pushHistory(practice, 'DRAFT', 'Editing a withdrawn listing returned it to draft.');
  }
  await practice.save();
  await recordAudit({ actorId: ownerId, action: 'PRACTICE_UPDATE', entityType: 'practice', entityId: practiceId });
  return practice;
}

export async function submitPractice(ownerId: string, practiceId: string) {
  const practice = await findOrThrow(practiceId);
  assertOwner(practice, ownerId);
  if (!EDITABLE.has(practice.status)) {
    throw new HttpError(409, 'This listing has already been submitted.', 'INVALID_TRANSITION');
  }
  assertReadyToSubmit({
    name: practice.name,
    category: practice.category,
    specialty: practice.specialty,
    city: practice.city,
    state: practice.state,
    description: practice.description,
    yearsInOperation: practice.yearsInOperation,
    practitionerCount: practice.practitionerCount,
    facilityInfo: practice.facilityInfo,
    ownershipType: practice.ownershipType,
    transactionType: practice.transactionType,
    ownershipPercentage: practice.ownershipPercentage,
    askingPrice: practice.askingPrice,
    priceVisibility: practice.priceVisibility,
    transitionReason: practice.transitionReason,
  });
  practice.status = 'PENDING_REVIEW';
  practice.rejectionReason = '';
  practice.submittedAt = new Date();
  pushHistory(practice, 'PENDING_REVIEW', 'Submitted for review.');
  await practice.save();
  await recordAudit({ actorId: ownerId, action: 'PRACTICE_SUBMIT', entityType: 'practice', entityId: practiceId });
  return practice;
}

export async function withdrawPractice(ownerId: string, practiceId: string) {
  const practice = await findOrThrow(practiceId);
  assertOwner(practice, ownerId);
  if (practice.status !== 'PENDING_REVIEW' && practice.status !== 'APPROVED') {
    throw new HttpError(409, 'Only pending or approved listings can be withdrawn.', 'INVALID_TRANSITION');
  }
  practice.status = 'WITHDRAWN';
  pushHistory(practice, 'WITHDRAWN', 'Withdrawn by the seller.');
  await practice.save();
  await recordAudit({ actorId: ownerId, action: 'PRACTICE_WITHDRAW', entityType: 'practice', entityId: practiceId });
  return practice;
}

export async function getOwnedPractice(ownerId: string, practiceId: string) {
  const practice = await findOrThrow(practiceId);
  assertOwner(practice, ownerId);
  return practice;
}

export async function listOwnedPractices(ownerId: string, status?: ListingStatus) {
  const filter: FilterQuery<IPractice> = { ownerId };
  if (status) filter.status = status;
  return Practice.find(filter).sort({ updatedAt: -1 }).limit(100);
}

export async function approvePractice(adminId: string, practiceId: string) {
  const practice = await findOrThrow(practiceId);
  if (practice.status !== 'PENDING_REVIEW') {
    throw new HttpError(409, 'Only listings pending review can be approved.', 'INVALID_TRANSITION');
  }
  practice.status = 'APPROVED';
  practice.rejectionReason = '';
  practice.reviewedAt = new Date();
  practice.set('reviewedBy', adminId);
  pushHistory(practice, 'APPROVED', 'Approved for the marketplace.');
  await practice.save();
  await recordAudit({ actorId: adminId, action: 'LISTING_APPROVE', entityType: 'practice', entityId: practiceId });
  return practice;
}

export async function rejectPractice(adminId: string, practiceId: string, reason: string) {
  const practice = await findOrThrow(practiceId);
  if (practice.status !== 'PENDING_REVIEW') {
    throw new HttpError(409, 'Only listings pending review can be rejected.', 'INVALID_TRANSITION');
  }
  practice.status = 'REJECTED';
  practice.rejectionReason = reason;
  practice.reviewedAt = new Date();
  practice.set('reviewedBy', adminId);
  pushHistory(practice, 'REJECTED', 'Rejected. The seller can correct and resubmit.');
  await practice.save();
  await recordAudit({ actorId: adminId, action: 'LISTING_REJECT', entityType: 'practice', entityId: practiceId, metadata: { reason } });
  return practice;
}

export async function searchApproved(query: ListingQuery) {
  const filter: FilterQuery<IPractice> = { status: 'APPROVED' };
  if (query.category) filter.category = query.category;
  if (query.specialty) filter.specialty = new RegExp(escapeRegex(query.specialty), 'i');
  if (query.state) filter.state = new RegExp(`^${escapeRegex(query.state)}$`, 'i');
  if (query.city) filter.city = new RegExp(escapeRegex(query.city), 'i');
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: regex }, { specialty: regex }, { city: regex }, { state: regex }, { description: regex }];
  }
  if (query.minPrice != null || query.maxPrice != null) {
    filter.priceVisibility = 'PUBLIC';
    const price: { $gte?: number; $lte?: number } = {};
    if (query.minPrice != null) price.$gte = query.minPrice;
    if (query.maxPrice != null) price.$lte = query.maxPrice;
    filter.askingPrice = price;
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'price_asc'
      ? { priceVisibility: -1, askingPrice: 1 }
      : query.sort === 'price_desc'
        ? { priceVisibility: -1, askingPrice: -1 }
        : query.sort === 'name'
          ? { name: 1 }
          : { reviewedAt: -1, createdAt: -1 };

  const page = query.page;
  const limit = query.limit;
  const [total, items] = await Promise.all([
    Practice.countDocuments(filter),
    Practice.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getApprovedPractice(practiceId: string) {
  const practice = await Practice.findOne({ _id: practiceId, status: 'APPROVED' });
  if (!practice) throw new HttpError(404, 'Listing not found.', 'NOT_FOUND');
  return practice;
}

export async function listForAdmin(status?: ListingStatus, page = 1, limit = 20) {
  const filter: FilterQuery<IPractice> = {};
  if (status) filter.status = status;
  const [total, items] = await Promise.all([
    Practice.countDocuments(filter),
    Practice.find(filter)
      .sort({ submittedAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('ownerId', 'name email'),
  ]);
  return { items, meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) } };
}

export async function getForAdmin(practiceId: string) {
  const practice = await Practice.findById(practiceId).populate('ownerId', 'name email');
  if (!practice) throw new HttpError(404, 'Practice not found.', 'NOT_FOUND');
  return practice;
}
