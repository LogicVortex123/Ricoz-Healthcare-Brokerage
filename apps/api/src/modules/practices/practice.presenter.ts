import type { IPractice } from './practice.model';

export type PracticeAudience = 'public' | 'owner' | 'admin';

type OwnerShape = { _id: unknown; name?: string; email?: string };

function idOf(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as OwnerShape)._id);
  }
  return String(value ?? '');
}

function readOwner(value: unknown) {
  if (!value || typeof value !== 'object' || !('email' in value)) return null;
  const owner = value as OwnerShape;
  return {
    id: String(owner._id),
    name: owner.name ?? '',
    email: owner.email ?? '',
  };
}

export function presentPractice(practice: IPractice & { _id: unknown; createdAt?: Date; updatedAt?: Date }, audience: PracticeAudience) {
  const showPrice = audience !== 'public' || practice.priceVisibility === 'PUBLIC';
  const base = {
    id: String(practice._id),
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
    askingPrice: showPrice ? practice.askingPrice : null,
    priceVisibility: practice.priceVisibility,
    transitionReason: practice.transitionReason,
    status: practice.status,
    listedAt: practice.reviewedAt,
  };

  if (audience === 'public') return base;

  return {
    ...base,
    rejectionReason: practice.rejectionReason,
    submittedAt: practice.submittedAt,
    reviewedAt: practice.reviewedAt,
    createdAt: practice.createdAt ?? null,
    updatedAt: practice.updatedAt ?? null,
    statusHistory: (practice.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      note: entry.note,
      at: entry.at,
    })),
    ...(audience === 'admin'
      ? { owner: readOwner(practice.ownerId) ?? { id: idOf(practice.ownerId), name: '', email: '' } }
      : {}),
  };
}
