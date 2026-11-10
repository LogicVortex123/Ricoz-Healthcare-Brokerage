import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'SA', // Super Admin
  'PA', // Platform Admin
  'BM', // Brokerage Manager
  'BR', // Broker
  'SE', // Seller
  'BU', // Buyer
  'IN', // Investor / Acquisition Group
  'LA', // Legal Advisor
  'FA', // Financial Advisor
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const TransitionTypeEnum = z.enum([
  'complete_sale',
  'partial_sale',
  'partnership_transition',
]);
export type TransitionType = z.infer<typeof TransitionTypeEnum>;

export const DentalSpecialtyEnum = z.enum([
  'general',
  'orthodontics',
  'endodontics',
  'prosthodontics',
  'periodontics',
  'pedodontics',
  'oral_surgery',
  'implantology',
  'multi_specialty',
]);
export type DentalSpecialty = z.infer<typeof DentalSpecialtyEnum>;

export const RevenueBandEnum = z.enum([
  '<25L',
  '25L-50L',
  '50L-1Cr',
  '1Cr-2Cr',
  '2Cr-5Cr',
  '>5Cr',
]);
export type RevenueBand = z.infer<typeof RevenueBandEnum>;

export const PipelineStageIdEnum = z.enum([
  'new_lead',
  'buyer_qualified',
  'nda',
  'info_disclosure',
  'due_diligence',
  'initial_offer',
  'negotiation',
  'loi',
  'legal_review',
  'final_agreement',
  'closing',
  'ownership_transition',
  'post_sale_handover',
  'lost',
  'withdrawn',
]);
export type PipelineStageId = z.infer<typeof PipelineStageIdEnum>;

export const ListingStatusEnum = z.enum([
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'rejected',
  'approved',
  'listed',
  'under_offer',
  'sold',
  'withdrawn',
]);
export type ListingStatus = z.infer<typeof ListingStatusEnum>;

export const DocumentCategoryEnum = z.enum([
  'financial_statements',
  'tax_records',
  'licences_registrations',
  'equipment_inventory',
  'property_lease',
  'employment_agreements',
  'insurance',
  'operational_reports',
  'acquisition_agreements',
]);
export type DocumentCategory = z.infer<typeof DocumentCategoryEnum>;

export const DisclosureTierEnum = z.enum(['0_teaser', '1_verified_buyer', '2_nda_cleared', '3_data_room']);
export type DisclosureTier = z.infer<typeof DisclosureTierEnum>;

// Format INR nicely
export function formatINR(valInLakhsOrRupees: number, isRupees = false): string {
  if (isRupees) {
    if (valInLakhsOrRupees >= 10000000) {
      return `₹${(valInLakhsOrRupees / 10000000).toFixed(2)} Cr`;
    }
    if (valInLakhsOrRupees >= 100000) {
      return `₹${(valInLakhsOrRupees / 100000).toFixed(2)} Lakh`;
    }
    return `₹${valInLakhsOrRupees.toLocaleString('en-IN')}`;
  }
  return `₹${valInLakhsOrRupees} Lakh`;
}

// Zod Schemas
export const PracticeSaleRequestSchema = z.object({
  specialty: DentalSpecialtyEnum,
  name: z.string().min(3, 'Clinic name is required (confidential)'),
  address: z.object({
    line: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    zone: z.string().min(2, 'City zone (e.g. South Bengaluru) is required'),
    state: z.string().min(2, 'State is required'),
    pin: z.string().regex(/^\d{6}$/, '6-digit PIN code required'),
  }),
  yearsInOperation: z.number().int().min(1, 'Years in operation required'),
  practitioners: z.number().int().min(1),
  chairs: z.number().int().min(1, 'Number of dental chairs required'),
  locations: z.number().int().default(1),
  staffCounts: z.object({
    dentists: z.number().int().default(1),
    hygienists: z.number().int().default(1),
    assistants: z.number().int().default(1),
    frontDesk: z.number().int().default(1),
  }),
  equipmentSummary: z.string().min(10, 'Summarize primary equipment (e.g. RVG, OPG, CBCT, autoclave)'),
  transitionType: TransitionTypeEnum,
  confidentiality: z.object({
    showAskingPrice: z.boolean().default(false),
  }),
  askingPrice: z.number().optional(),
});

export const FinancialYearRecordSchema = z.object({
  fiscalYear: z.string(), // e.g. "2024-25"
  revenue: z.number().min(0),
  expenses: z.number().min(0),
  ebitda: z.number(),
  source: z.string().default('Audited P&L / ITR-V'),
});

export const NDATemplateSchema = z.object({
  version: z.string(),
  title: z.string(),
  bodyText: z.string(),
  governingLaw: z.string().default('Arbitration & Conciliation Act 1996, India'),
  jurisdiction: z.string().default('Courts of Bengaluru, India'),
});

