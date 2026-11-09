import { z } from 'zod';
import { categories, ownershipTypes, transactionTypes } from '@/lib/constants';

const categoryValues = categories.map((item) => item.value) as [string, ...string[]];
const ownershipValues = ownershipTypes.map((item) => item.value) as [string, ...string[]];
const transactionValues = transactionTypes.map((item) => item.value) as [string, ...string[]];

export type PracticeFormValues = {
  name: string;
  category: string;
  specialty: string;
  city: string;
  state: string;
  description: string;
  yearsInOperation: string;
  practitionerCount: string;
  facilityInfo: string;
  ownershipType: string;
  transactionType: string;
  ownershipPercentage: string;
  askingPrice: string;
  priceVisibility: 'PUBLIC' | 'ON_REQUEST';
  transitionReason: string;
};

export const emptyPracticeForm: PracticeFormValues = {
  name: '',
  category: '',
  specialty: '',
  city: '',
  state: '',
  description: '',
  yearsInOperation: '',
  practitionerCount: '',
  facilityInfo: '',
  ownershipType: '',
  transactionType: '',
  ownershipPercentage: '',
  askingPrice: '',
  priceVisibility: 'ON_REQUEST',
  transitionReason: '',
};

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

export function toPracticePayload(values: PracticeFormValues) {
  const needsShare = values.transactionType === 'PARTIAL_BUYOUT' || values.transactionType === 'PARTNER_RETIREMENT';
  return {
    name: values.name,
    category: values.category,
    specialty: values.specialty,
    city: values.city,
    state: values.state,
    description: values.description,
    yearsInOperation: numberOrNull(values.yearsInOperation),
    practitionerCount: numberOrNull(values.practitionerCount),
    facilityInfo: values.facilityInfo,
    ownershipType: values.ownershipType || null,
    transactionType: values.transactionType || null,
    ownershipPercentage: needsShare || values.transactionType === 'OWNERSHIP_TRANSITION' ? numberOrNull(values.ownershipPercentage) : null,
    askingPrice: values.priceVisibility === 'PUBLIC' ? numberOrNull(values.askingPrice) : numberOrNull(values.askingPrice),
    priceVisibility: values.priceVisibility,
    transitionReason: values.transitionReason,
  };
}

const payloadShape = {
  name: z.string().trim().min(2, 'Enter the practice name.').max(120),
  category: z.enum(categoryValues, { errorMap: () => ({ message: 'Choose a practice category.' }) }),
  specialty: z.string().trim().max(80),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  description: z.string().trim().max(4000),
  yearsInOperation: z.number().int().min(0).max(200).nullable(),
  practitionerCount: z.number().int().min(1).max(500).nullable(),
  facilityInfo: z.string().trim().max(2000),
  ownershipType: z.enum(ownershipValues).nullable(),
  transactionType: z.enum(transactionValues).nullable(),
  ownershipPercentage: z.number().int().min(1).max(99).nullable(),
  askingPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
  priceVisibility: z.enum(['PUBLIC', 'ON_REQUEST']),
  transitionReason: z.string().trim().max(2000),
};

export const draftPayloadSchema = z.object(payloadShape);

export const submitPayloadSchema = draftPayloadSchema.superRefine((data, ctx) => {
  const required: [keyof typeof data, string, number][] = [
    ['specialty', 'Enter the specialty.', 2],
    ['city', 'Enter the city.', 2],
    ['state', 'Enter the state or region.', 2],
    ['description', 'Describe the practice in at least 40 characters.', 40],
    ['facilityInfo', 'Add a short facility description.', 10],
    ['transitionReason', 'Explain the reason for the transition.', 10],
  ];
  required.forEach(([key, message, min]) => {
    if (String(data[key] ?? '').trim().length < min) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
    }
  });
  if (data.yearsInOperation == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['yearsInOperation'], message: 'Enter the years in operation.' });
  if (data.practitionerCount == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['practitionerCount'], message: 'Enter the number of practitioners.' });
  if (!data.ownershipType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownershipType'], message: 'Choose an ownership type.' });
  if (!data.transactionType) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['transactionType'], message: 'Choose a transaction type.' });
  const needsShare = data.transactionType === 'PARTIAL_BUYOUT' || data.transactionType === 'PARTNER_RETIREMENT';
  if (needsShare && data.ownershipPercentage == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownershipPercentage'], message: 'Enter the ownership percentage being transferred (1–99).' });
  }
  if (data.transactionType === 'COMPLETE_ACQUISITION' && data.ownershipPercentage != null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownershipPercentage'], message: 'Leave the ownership percentage empty for a complete acquisition.' });
  }
  if (data.priceVisibility === 'PUBLIC' && data.askingPrice == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['askingPrice'], message: 'Enter an asking price, or mark the price as on request.' });
  }
});
