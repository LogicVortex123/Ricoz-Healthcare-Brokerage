import { z } from 'zod';
import { HttpError } from '../../utils/errors';
import { formatZod } from '../../middleware/validate';
import {
  OWNERSHIP_TYPES,
  PRACTICE_CATEGORIES,
  PRICE_VISIBILITIES,
  TRANSACTION_TYPES,
  type OwnershipType,
  type PracticeCategory,
  type PriceVisibility,
  type TransactionType,
} from './practice.model';

const SHARE_TRANSACTIONS = new Set<TransactionType>(['PARTIAL_BUYOUT', 'PARTNER_RETIREMENT']);

function optionalNumber(min: number, max: number, label: string) {
  return z.preprocess(
    (value) => {
      if (value === '' || value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() !== '') return Number(value);
      return value;
    },
    z
      .number({ invalid_type_error: `Enter a valid ${label}.` })
      .int(`Enter ${label} as a whole number.`)
      .min(min, `${label} must be at least ${min}.`)
      .max(max, `${label} must be ${max} or less.`)
      .nullable(),
  );
}

export const practiceDraftSchema = z.object({
  name: z.string().trim().min(2, 'Enter the practice name.').max(120, 'Practice name must be 120 characters or less.'),
  category: z.enum(PRACTICE_CATEGORIES, { errorMap: () => ({ message: 'Choose a practice category.' }) }),
  specialty: z.string().trim().max(80, 'Specialty must be 80 characters or less.').optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  description: z.string().trim().max(4000).optional().default(''),
  yearsInOperation: optionalNumber(0, 200, 'years in operation'),
  practitionerCount: optionalNumber(1, 500, 'practitioner count'),
  facilityInfo: z.string().trim().max(2000).optional().default(''),
  ownershipType: z.union([z.enum(OWNERSHIP_TYPES), z.literal('')]).optional(),
  transactionType: z.union([z.enum(TRANSACTION_TYPES), z.literal('')]).optional(),
  ownershipPercentage: optionalNumber(1, 99, 'ownership percentage'),
  askingPrice: optionalNumber(0, 1_000_000_000, 'asking price'),
  priceVisibility: z.enum(PRICE_VISIBILITIES).optional().default('ON_REQUEST'),
  transitionReason: z.string().trim().max(2000).optional().default(''),
});

export type PracticeInput = {
  name: string;
  category: PracticeCategory;
  specialty: string;
  city: string;
  state: string;
  description: string;
  yearsInOperation: number | null;
  practitionerCount: number | null;
  facilityInfo: string;
  ownershipType: OwnershipType | null;
  transactionType: TransactionType | null;
  ownershipPercentage: number | null;
  askingPrice: number | null;
  priceVisibility: PriceVisibility;
  transitionReason: string;
};

function enumOrNull<T extends string>(value: T | '' | undefined): T | null {
  return value ? value : null;
}

export function toPracticeInput(data: z.infer<typeof practiceDraftSchema>): PracticeInput {
  const priceVisibility = data.priceVisibility;
  return {
    name: data.name,
    category: data.category,
    specialty: data.specialty,
    city: data.city,
    state: data.state,
    description: data.description,
    yearsInOperation: data.yearsInOperation,
    practitionerCount: data.practitionerCount,
    facilityInfo: data.facilityInfo,
    ownershipType: enumOrNull(data.ownershipType),
    transactionType: enumOrNull(data.transactionType),
    ownershipPercentage: data.ownershipPercentage,
    askingPrice: data.askingPrice,
    priceVisibility,
    transitionReason: data.transitionReason,
  };
}

export function parsePracticeDraft(body: unknown): PracticeInput {
  const parsed = practiceDraftSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'Check the highlighted fields.', 'VALIDATION_ERROR', formatZod(parsed.error));
  }
  return toPracticeInput(parsed.data);
}

export const practiceSubmitSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    category: z.enum(PRACTICE_CATEGORIES),
    specialty: z.string().trim().min(2, 'Enter the specialty.'),
    city: z.string().trim().min(2, 'Enter the city.'),
    state: z.string().trim().min(2, 'Enter the state or region.'),
    description: z.string().trim().min(40, 'Describe the practice in at least 40 characters.').max(4000),
    yearsInOperation: z.number({ invalid_type_error: 'Enter the years in operation.' }).int().min(0).max(200),
    practitionerCount: z.number({ invalid_type_error: 'Enter the number of practitioners.' }).int().min(1).max(500),
    facilityInfo: z.string().trim().min(10, 'Add a short facility description.').max(2000),
    ownershipType: z.enum(OWNERSHIP_TYPES, { errorMap: () => ({ message: 'Choose an ownership type.' }) }),
    transactionType: z.enum(TRANSACTION_TYPES, { errorMap: () => ({ message: 'Choose a transaction type.' }) }),
    ownershipPercentage: z.number().int().min(1).max(99).nullable(),
    askingPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
    priceVisibility: z.enum(PRICE_VISIBILITIES),
    transitionReason: z.string().trim().min(10, 'Explain the reason for the transition.').max(2000),
  })
  .superRefine((data, ctx) => {
    const needsShare = SHARE_TRANSACTIONS.has(data.transactionType);
    if (needsShare && data.ownershipPercentage == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownershipPercentage'],
        message: 'Enter the ownership percentage being transferred (1–99).',
      });
    }
    if (!needsShare && data.transactionType === 'COMPLETE_ACQUISITION' && data.ownershipPercentage != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownershipPercentage'],
        message: 'Leave the ownership percentage empty for a complete acquisition.',
      });
    }
    if (data.priceVisibility === 'PUBLIC' && data.askingPrice == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['askingPrice'],
        message: 'Enter an asking price, or mark the price as on request.',
      });
    }
  });

export function assertReadyToSubmit(input: unknown) {
  const parsed = practiceSubmitSchema.safeParse(input);
  if (!parsed.success) {
    throw new HttpError(400, 'Complete the required fields before submitting.', 'VALIDATION_ERROR', formatZod(parsed.error));
  }
  return parsed.data;
}

export const rejectionSchema = z.object({
  reason: z.string().trim().min(10, 'Explain the rejection in at least 10 characters.').max(1000),
});

function blankToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export const listingQuerySchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(120).optional()),
  category: z.preprocess(blankToUndefined, z.enum(PRACTICE_CATEGORIES).optional()),
  specialty: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  state: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  city: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  minPrice: optionalNumber(0, 1_000_000_000, 'minimum price'),
  maxPrice: optionalNumber(0, 1_000_000_000, 'maximum price'),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).optional().default('newest'),
  page: z.preprocess(
    (value) => (value === undefined || value === '' ? 1 : value),
    z.coerce.number().int().min(1).max(10000),
  ),
  limit: z.preprocess(
    (value) => (value === undefined || value === '' ? 12 : value),
    z.coerce.number().int().min(1).max(24),
  ),
});

export type ListingQuery = z.infer<typeof listingQuerySchema>;

export function singleQuery(query: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}
