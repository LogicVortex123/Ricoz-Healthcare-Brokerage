export const categories = [
  { value: 'DENTAL', label: 'Dental', summary: 'General practices and dental specialties changing ownership.' },
  { value: 'VETERINARY', label: 'Veterinary', summary: 'Companion-animal and mixed clinics preparing a transition.' },
  { value: 'SPECIALIST_MEDICAL', label: 'Specialist medical', summary: 'Physician-owned specialty clinics seeking a buyer or partner.' },
] as const;

export const ownershipTypes = [
  { value: 'SOLE_OWNER', label: 'Sole owner' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PROFESSIONAL_CORPORATION', label: 'Professional corporation' },
  { value: 'LLC', label: 'LLC' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const transactionTypes = [
  { value: 'COMPLETE_ACQUISITION', label: 'Complete acquisition' },
  { value: 'PARTIAL_BUYOUT', label: 'Partial buyout' },
  { value: 'PARTNER_RETIREMENT', label: 'Partner retirement' },
  { value: 'OWNERSHIP_TRANSITION', label: 'Ownership transition' },
] as const;

export const listingStatuses = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
] as const;

export const inquiryStatuses = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

export const priceVisibilities = [
  { value: 'PUBLIC', label: 'Show asking price' },
  { value: 'ON_REQUEST', label: 'Price on request' },
] as const;

export type Category = (typeof categories)[number]['value'];
export type TransactionType = (typeof transactionTypes)[number]['value'];
export type ListingStatus = (typeof listingStatuses)[number]['value'];
export type InquiryStatus = (typeof inquiryStatuses)[number]['value'];
export type Role = 'SELLER' | 'BUYER' | 'ADMIN' | 'BROKER';

const labels = new Map<string, string>(
  [...categories, ...ownershipTypes, ...transactionTypes, ...listingStatuses, ...inquiryStatuses].map((item) => [item.value, item.label]),
);

export function labelFor(value?: string | null) {
  if (!value) return '—';
  return labels.get(value) ?? value;
}

export function homeFor(role: Role) {
  switch (role) {
    case 'SELLER':
      return '/dashboard/seller';
    case 'BUYER':
      return '/dashboard/buyer';
    case 'ADMIN':
      return '/dashboard/admin';
    case 'BROKER':
      return '/dashboard/broker';
  }
}

export function profileFor(role: Role) {
  if (role === 'ADMIN') return '/dashboard/admin/profile';
  if (role === 'BUYER') return '/dashboard/buyer/profile';
  if (role === 'BROKER') return '/dashboard/broker';
  return '/dashboard/seller/profile';
}

export function safeNext(value: string | null, role: Role) {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/sign-')) return value;
  return homeFor(role);
}
