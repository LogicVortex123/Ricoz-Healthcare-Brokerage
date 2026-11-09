export type Role = 'SELLER' | 'BUYER' | 'ADMIN' | 'BROKER';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  organization: string;
  city: string;
  state: string;
  bio: string;
  createdAt?: string | null;
};

export type Practice = {
  id: string;
  name: string;
  category: 'DENTAL' | 'VETERINARY' | 'SPECIALIST_MEDICAL';
  specialty: string;
  city: string;
  state: string;
  description: string;
  yearsInOperation: number | null;
  practitionerCount: number | null;
  facilityInfo: string;
  ownershipType: string | null;
  transactionType: string | null;
  ownershipPercentage: number | null;
  askingPrice: number | null;
  priceVisibility: 'PUBLIC' | 'ON_REQUEST';
  transitionReason: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  rejectionReason?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  listedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  statusHistory?: { status: string; note: string; at: string }[];
  owner?: { id: string; name: string; email: string } | null;
};

export type Inquiry = {
  id: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
  createdAt: string | null;
  updatedAt: string | null;
  practice: { id: string; name: string; category: string; city: string; state: string };
  buyer?: { id: string; name: string; email: string; organization: string; city: string; state: string; phone: string };
  seller?: { id: string; name: string; email: string };
};

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export type SellerDashboard = {
  role: 'SELLER';
  totalPractices: number;
  drafts: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  inquiries: number;
  recentPractices: Practice[];
};

export type BuyerDashboard = {
  role: 'BUYER';
  availableListings: number;
  inquiries: number;
  openInquiries: number;
  acknowledgedInquiries: number;
  closedInquiries: number;
  recentInquiries: Inquiry[];
};

export type AdminDashboard = {
  role: 'ADMIN';
  users: number;
  listings: number;
  pending: number;
  approved: number;
  inquiries: number;
  recentPending: Practice[];
};

export type BrokerDashboard = { role: 'BROKER'; availableListings: number };
