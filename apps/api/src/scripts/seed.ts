import { connectDb, disconnectDb } from '../config/db';
import { loadEnv } from '../config/env';
import { Inquiry } from '../modules/inquiries/inquiry.model';
import { Practice, type ListingStatus } from '../modules/practices/practice.model';
import { User } from '../modules/users/user.model';
import { hashPassword } from '../utils/password';

type SeedUser = {
  email: string;
  name: string;
  role: 'SELLER' | 'BUYER';
  organization: string;
  city: string;
  state: string;
  phone: string;
};

type SeedPractice = {
  seedKey: string;
  ownerEmail: string;
  name: string;
  category: 'DENTAL' | 'VETERINARY' | 'SPECIALIST_MEDICAL';
  specialty: string;
  city: string;
  state: string;
  description: string;
  yearsInOperation: number;
  practitionerCount: number;
  facilityInfo: string;
  ownershipType: 'SOLE_OWNER' | 'PARTNERSHIP' | 'PROFESSIONAL_CORPORATION' | 'LLC' | 'OTHER';
  transactionType: 'COMPLETE_ACQUISITION' | 'PARTIAL_BUYOUT' | 'PARTNER_RETIREMENT' | 'OWNERSHIP_TRANSITION';
  ownershipPercentage: number | null;
  askingPrice: number | null;
  priceVisibility: 'PUBLIC' | 'ON_REQUEST';
  transitionReason: string;
  status: ListingStatus;
  rejectionReason: string;
  ageDays: number;
};

type SeedInquiry = {
  practiceSeedKey: string;
  buyerEmail: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
};

const users: SeedUser[] = [
  {
    email: 'elena.vasquez@example.com',
    name: 'Elena Vasquez',
    role: 'SELLER',
    organization: 'Vasquez Practice Advisory',
    city: 'Portland',
    state: 'Oregon',
    phone: '503-555-0148',
  },
  {
    email: 'priya.shah@example.com',
    name: 'Priya Shah',
    role: 'SELLER',
    organization: 'Shah Specialty Group',
    city: 'Austin',
    state: 'Texas',
    phone: '512-555-0172',
  },
  {
    email: 'marcus.hale@example.com',
    name: 'Marcus Hale',
    role: 'SELLER',
    organization: 'Hale Veterinary Holdings',
    city: 'Sacramento',
    state: 'California',
    phone: '916-555-0194',
  },
  {
    email: 'james.okonkwo@example.com',
    name: 'James Okonkwo',
    role: 'BUYER',
    organization: 'Okonkwo Dental Group',
    city: 'Seattle',
    state: 'Washington',
    phone: '206-555-0116',
  },
  {
    email: 'amira.hassan@example.com',
    name: 'Amira Hassan',
    role: 'BUYER',
    organization: 'Hassan Clinic Partners',
    city: 'Chicago',
    state: 'Illinois',
    phone: '312-555-0188',
  },
  {
    email: 'owen.clarke@example.com',
    name: 'Owen Clarke',
    role: 'BUYER',
    organization: 'Clarke Companion Practices',
    city: 'Denver',
    state: 'Colorado',
    phone: '303-555-0160',
  },
];

const fictional = 'Fictional demonstration record. It does not describe a real clinic, client, or patient.';

const practices: SeedPractice[] = [
  {
    seedKey: 'demo-northwind-dental',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Northwind Family Dental',
    category: 'DENTAL',
    specialty: 'General dentistry',
    city: 'Portland',
    state: 'Oregon',
    description: `${fictional} A family dentistry practice with a stable hygiene program and room for an associate.`,
    yearsInOperation: 18,
    practitionerCount: 3,
    facilityInfo: 'Four operatories in a professional building. No street address is stored.',
    ownershipType: 'LLC',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 850000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The owner is planning a full retirement over the next year.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 12,
  },
  {
    seedKey: 'demo-brightwater-pediatric',
    ownerEmail: 'priya.shah@example.com',
    name: 'Brightwater Pediatric Dental',
    category: 'DENTAL',
    specialty: 'Pediatric dentistry',
    city: 'Austin',
    state: 'Texas',
    description: `${fictional} A pediatric practice with two dentists and a recall system built around school schedules.`,
    yearsInOperation: 9,
    practitionerCount: 2,
    facilityInfo: 'Six chairs, a quiet recovery bay, and a separate consultation room.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 640000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The founding dentist is relocating and wants a local successor.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 9,
  },
  {
    seedKey: 'demo-mesa-oral-surgery',
    ownerEmail: 'priya.shah@example.com',
    name: 'Mesa View Oral Surgery',
    category: 'DENTAL',
    specialty: 'Oral surgery',
    city: 'Phoenix',
    state: 'Arizona',
    description: `${fictional} A referral-based oral surgery practice with hospital privileges already in place.`,
    yearsInOperation: 22,
    practitionerCount: 4,
    facilityInfo: 'Two surgical suites and a recovery area. Equipment list is available after inquiry.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'OWNERSHIP_TRANSITION',
    ownershipPercentage: null,
    askingPrice: 2100000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'A senior surgeon is stepping back from ownership while remaining available to consult.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 4,
  },
  {
    seedKey: 'demo-willow-ortho',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Willow Creek Orthodontics',
    category: 'DENTAL',
    specialty: 'Orthodontics',
    city: 'Ann Arbor',
    state: 'Michigan',
    description: `${fictional} An orthodontic practice with a long treatment backlog and a digital scanner.`,
    yearsInOperation: 14,
    practitionerCount: 2,
    facilityInfo: 'Eight chairs and a records room. No patient files are included here.',
    ownershipType: 'PARTNERSHIP',
    transactionType: 'PARTNER_RETIREMENT',
    ownershipPercentage: 45,
    askingPrice: 975000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'One partner is retiring. The remaining partner plans to stay.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 7,
  },
  {
    seedKey: 'demo-capitol-endo',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Capitol Endodontics',
    category: 'DENTAL',
    specialty: 'Endodontics',
    city: 'Richmond',
    state: 'Virginia',
    description: `${fictional} A specialist endodontic practice that takes referrals from general dentists in the region.`,
    yearsInOperation: 16,
    practitionerCount: 3,
    facilityInfo: 'Microscopes in each operatory and a small sterilization center.',
    ownershipType: 'LLC',
    transactionType: 'OWNERSHIP_TRANSITION',
    ownershipPercentage: null,
    askingPrice: 1100000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The owners want a staged handover to a younger specialist.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 2,
  },
  {
    seedKey: 'demo-redwood-vet',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Redwood Companion Veterinary',
    category: 'VETERINARY',
    specialty: 'Small animal',
    city: 'Sacramento',
    state: 'California',
    description: `${fictional} A companion-animal clinic with wellness, dentistry, and a modest surgery day.`,
    yearsInOperation: 13,
    practitionerCount: 5,
    facilityInfo: 'Four exam rooms, a treatment area, and a dental station.',
    ownershipType: 'LLC',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 980000,
    priceVisibility: 'ON_REQUEST',
    transitionReason: 'The owner is leaving clinical work and prefers to discuss price after an introduction.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 11,
  },
  {
    seedKey: 'demo-foothill-mixed',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Foothill Mixed Animal Clinic',
    category: 'VETERINARY',
    specialty: 'Mixed animal',
    city: 'Boulder',
    state: 'Colorado',
    description: `${fictional} A mixed practice split between companion animals and a small ambulatory large-animal book.`,
    yearsInOperation: 27,
    practitionerCount: 3,
    facilityInfo: 'Clinic building plus a covered loading area. No client list is attached.',
    ownershipType: 'PARTNERSHIP',
    transactionType: 'PARTIAL_BUYOUT',
    ownershipPercentage: 35,
    askingPrice: 540000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'A junior partner wants to buy a larger share. The senior partner will remain.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 6,
  },
  {
    seedKey: 'demo-harborline-exotic',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Harborline Avian and Exotic',
    category: 'VETERINARY',
    specialty: 'Avian and exotic',
    city: 'Seattle',
    state: 'Washington',
    description: `${fictional} A niche clinic focused on birds, rabbits, and other exotic companion animals.`,
    yearsInOperation: 8,
    practitionerCount: 2,
    facilityInfo: 'Species-separated wards and a quiet hospitalization room.',
    ownershipType: 'SOLE_OWNER',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 780000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The sole owner is moving out of the region.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 3,
  },
  {
    seedKey: 'demo-bayou-family-vet',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Bayou Family Veterinary',
    category: 'VETERINARY',
    specialty: 'Small animal',
    city: 'Baton Rouge',
    state: 'Louisiana',
    description: `${fictional} A neighborhood veterinary clinic with a high share of preventive visits.`,
    yearsInOperation: 19,
    practitionerCount: 4,
    facilityInfo: 'Five exam rooms and an in-house laboratory corner.',
    ownershipType: 'LLC',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 690000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'Retirement, with a willingness to stay for a short clinical overlap.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 15,
  },
  {
    seedKey: 'demo-northstar-cardio',
    ownerEmail: 'priya.shah@example.com',
    name: 'Northstar Cardiology',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Cardiology',
    city: 'Minneapolis',
    state: 'Minnesota',
    description: `${fictional} A physician-owned cardiology clinic with diagnostic testing on site.`,
    yearsInOperation: 21,
    practitionerCount: 6,
    facilityInfo: 'Testing suites and consultation rooms. No clinical records are stored in this listing.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'PARTNER_RETIREMENT',
    ownershipPercentage: 60,
    askingPrice: 3400000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'Two partners are retiring together and offering their combined share.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 5,
  },
  {
    seedKey: 'demo-clearfield-derm',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Clearfield Dermatology',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Dermatology',
    city: 'Raleigh',
    state: 'North Carolina',
    description: `${fictional} A dermatology clinic with medical and procedural visits in the same location.`,
    yearsInOperation: 12,
    practitionerCount: 4,
    facilityInfo: 'Procedure rooms and a pathology handoff with an outside lab.',
    ownershipType: 'LLC',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 1250000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The owner wants a full sale and a six-month introduction period.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 8,
  },
  {
    seedKey: 'demo-summit-eye',
    ownerEmail: 'priya.shah@example.com',
    name: 'Summit Eye Specialists',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Ophthalmology',
    city: 'Denver',
    state: 'Colorado',
    description: `${fictional} An ophthalmology practice offering clinics and a limited procedure schedule.`,
    yearsInOperation: 17,
    practitionerCount: 5,
    facilityInfo: 'Lanes for exams and one procedure room. Price is discussed after an inquiry.',
    ownershipType: 'PARTNERSHIP',
    transactionType: 'PARTIAL_BUYOUT',
    ownershipPercentage: 25,
    askingPrice: 1600000,
    priceVisibility: 'ON_REQUEST',
    transitionReason: 'A partner is selling a minority share and will continue to practice.',
    status: 'APPROVED',
    rejectionReason: '',
    ageDays: 1,
  },
  {
    seedKey: 'demo-cedar-veterinary',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Cedar and Pine Veterinary',
    category: 'VETERINARY',
    specialty: 'Small animal',
    city: 'Burlington',
    state: 'Vermont',
    description: `${fictional} A small-animal clinic prepared as a partial buyout and waiting for review.`,
    yearsInOperation: 11,
    practitionerCount: 4,
    facilityInfo: 'Exam rooms, a treatment area, and a separate dental suite.',
    ownershipType: 'PARTNERSHIP',
    transactionType: 'PARTIAL_BUYOUT',
    ownershipPercentage: 40,
    askingPrice: 1200000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'A partner is reducing ownership and staying on during a handover.',
    status: 'PENDING_REVIEW',
    rejectionReason: '',
    ageDays: 1,
  },
  {
    seedKey: 'demo-glasshouse-im',
    ownerEmail: 'priya.shah@example.com',
    name: 'Glasshouse Internal Medicine',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Internal medicine',
    city: 'Chicago',
    state: 'Illinois',
    description: `${fictional} A consultative internal medicine practice submitted for administrator review.`,
    yearsInOperation: 15,
    practitionerCount: 3,
    facilityInfo: 'Consultation rooms only. Procedures are referred out.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 890000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The group wants a buyer before two physicians retire next year.',
    status: 'PENDING_REVIEW',
    rejectionReason: '',
    ageDays: 0,
  },
  {
    seedKey: 'demo-sable-ridge-dental',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Sable Ridge Dental',
    category: 'DENTAL',
    specialty: 'General dentistry',
    city: 'Boise',
    state: 'Idaho',
    description: `${fictional} A general practice submitted this week and not yet visible to buyers.`,
    yearsInOperation: 7,
    practitionerCount: 2,
    facilityInfo: 'Five operatories and a small lab bench.',
    ownershipType: 'SOLE_OWNER',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 475000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The owner is selling to return to associateship.',
    status: 'PENDING_REVIEW',
    rejectionReason: '',
    ageDays: 0,
  },
  {
    seedKey: 'demo-lakeshore-ortho',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Lakeshore Orthopedic Clinic',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Orthopedics',
    city: 'Madison',
    state: 'Wisconsin',
    description: `${fictional} A specialty clinic still in draft. Buyers cannot see it.`,
    yearsInOperation: 9,
    practitionerCount: 2,
    facilityInfo: 'Consultation rooms and an imaging suite.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'PARTNER_RETIREMENT',
    ownershipPercentage: 50,
    askingPrice: null,
    priceVisibility: 'ON_REQUEST',
    transitionReason: 'A founding partner plans to retire from clinical ownership.',
    status: 'DRAFT',
    rejectionReason: '',
    ageDays: 3,
  },
  {
    seedKey: 'demo-kinship-emergency',
    ownerEmail: 'marcus.hale@example.com',
    name: 'Kinship Emergency Veterinary',
    category: 'VETERINARY',
    specialty: 'Emergency',
    city: 'Nashville',
    state: 'Tennessee',
    description: `${fictional} An after-hours emergency clinic saved as a draft while the seller finishes the asking price.`,
    yearsInOperation: 6,
    practitionerCount: 8,
    facilityInfo: 'Triage, a surgery room, and overnight cages.',
    ownershipType: 'LLC',
    transactionType: 'PARTIAL_BUYOUT',
    ownershipPercentage: 20,
    askingPrice: null,
    priceVisibility: 'ON_REQUEST',
    transitionReason: 'The group is still deciding how large a share to offer.',
    status: 'DRAFT',
    rejectionReason: '',
    ageDays: 2,
  },
  {
    seedKey: 'demo-westbridge-ent',
    ownerEmail: 'priya.shah@example.com',
    name: 'Westbridge ENT',
    category: 'SPECIALIST_MEDICAL',
    specialty: 'Otolaryngology',
    city: 'Salt Lake City',
    state: 'Utah',
    description: `${fictional} A specialty listing returned to the seller because the transition description was too thin.`,
    yearsInOperation: 10,
    practitionerCount: 2,
    facilityInfo: 'Exam rooms and a procedure room shared with another tenant.',
    ownershipType: 'PROFESSIONAL_CORPORATION',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 720000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'Sale.',
    status: 'REJECTED',
    rejectionReason: 'Please describe the transition timeline and whether the physicians will stay after a sale.',
    ageDays: 6,
  },
  {
    seedKey: 'demo-old-mill-dental',
    ownerEmail: 'elena.vasquez@example.com',
    name: 'Old Mill Dental',
    category: 'DENTAL',
    specialty: 'General dentistry',
    city: 'Providence',
    state: 'Rhode Island',
    description: `${fictional} A listing the seller withdrew after deciding to wait another season.`,
    yearsInOperation: 31,
    practitionerCount: 2,
    facilityInfo: 'Three operatories. The seller has paused the process.',
    ownershipType: 'SOLE_OWNER',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 410000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'Retirement, currently postponed.',
    status: 'WITHDRAWN',
    rejectionReason: '',
    ageDays: 20,
  },
];

const inquiries: SeedInquiry[] = [
  {
    practiceSeedKey: 'demo-northwind-dental',
    buyerEmail: 'james.okonkwo@example.com',
    message: 'I am a general dentist looking at a complete acquisition in Oregon. I would like to understand the handover timeline.',
    status: 'OPEN',
  },
  {
    practiceSeedKey: 'demo-clearfield-derm',
    buyerEmail: 'amira.hassan@example.com',
    message: 'Our group is comparing dermatology practices in the Southeast. Please let me know a suitable time to discuss the six-month introduction.',
    status: 'ACKNOWLEDGED',
  },
  {
    practiceSeedKey: 'demo-foothill-mixed',
    buyerEmail: 'owen.clarke@example.com',
    message: 'I am interested in the 35 percent share and whether the senior partner expects to remain in the clinic.',
    status: 'OPEN',
  },
  {
    practiceSeedKey: 'demo-northstar-cardio',
    buyerEmail: 'james.okonkwo@example.com',
    message: 'We reviewed the cardiology listing and decided it is outside our current focus. Thank you for the description.',
    status: 'CLOSED',
  },
  {
    practiceSeedKey: 'demo-harborline-exotic',
    buyerEmail: 'owen.clarke@example.com',
    message: 'Exotic companion medicine is our specialty. I would like to introduce our group and ask about the seller timeline.',
    status: 'OPEN',
  },
  {
    practiceSeedKey: 'demo-summit-eye',
    buyerEmail: 'amira.hassan@example.com',
    message: 'We are looking at a minority ophthalmology share in Colorado. The public listing does not show a price, so I am asking for a conversation.',
    status: 'ACKNOWLEDGED',
  },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function historyFor(practice: SeedPractice) {
  const created = daysAgo(practice.ageDays + 2);
  const submitted = daysAgo(practice.ageDays + 1);
  const reviewed = daysAgo(practice.ageDays);
  const base = [{ status: 'DRAFT' as const, note: 'Created by the demo seed.', at: created }];
  if (practice.status === 'DRAFT') return base;
  const submittedEntry = { status: 'PENDING_REVIEW' as const, note: 'Submitted for review.', at: submitted };
  if (practice.status === 'PENDING_REVIEW') return [...base, submittedEntry];
  if (practice.status === 'REJECTED') {
    return [...base, submittedEntry, { status: 'REJECTED' as const, note: practice.rejectionReason, at: reviewed }];
  }
  if (practice.status === 'WITHDRAWN') {
    return [...base, submittedEntry, { status: 'WITHDRAWN' as const, note: 'Seller withdrew the listing.', at: reviewed }];
  }
  return [...base, submittedEntry, { status: 'APPROVED' as const, note: 'Approved for the marketplace.', at: reviewed }];
}

async function main() {
  if (process.env.SEED_CONFIRM !== 'yes') {
    console.error('[practicebridge] Refusing to seed. Set SEED_CONFIRM=yes and SEED_PASSWORD when you intentionally want fictional demo records.');
    process.exit(1);
  }
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('[practicebridge] Set SEED_PASSWORD to at least 10 characters with a letter and a number.');
    process.exit(1);
  }

  const env = loadEnv();
  await connectDb(env.mongodbUri);
  const indexes = await Practice.collection.indexes();
  if (indexes.some((index) => index.name === 'code_1')) {
    await Practice.collection.dropIndex('code_1');
    console.log('[practicebridge] Removed leftover unique index code_1. Practices do not use a code field.');
  }
  const passwordHash = await hashPassword(password);
  const ids = new Map<string, string>();

  for (const user of users) {
    const saved = await User.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          name: user.name,
          role: user.role,
          organization: user.organization,
          city: user.city,
          state: user.state,
          phone: user.phone,
        },
        $setOnInsert: { email: user.email, passwordHash },
      },
      { upsert: true, new: true },
    );
    ids.set(user.email, String(saved._id));
  }

  const practiceIds = new Map<string, string>();
  for (const practice of practices) {
    const ownerId = ids.get(practice.ownerEmail);
    if (!ownerId) throw new Error(`Missing seed user ${practice.ownerEmail}`);
    const reviewed = practice.status === 'APPROVED' || practice.status === 'REJECTED' || practice.status === 'WITHDRAWN';
    const submitted = practice.status !== 'DRAFT';
    const saved = await Practice.findOneAndUpdate(
      { seedKey: practice.seedKey },
      {
        $set: {
          ...practice,
          ownerId,
          submittedAt: submitted ? daysAgo(practice.ageDays + 1) : null,
          reviewedAt: reviewed ? daysAgo(practice.ageDays) : null,
          statusHistory: historyFor(practice),
        },
      },
      { upsert: true, new: true },
    );
    practiceIds.set(practice.seedKey, String(saved._id));
  }

  for (const inquiry of inquiries) {
    const practiceId = practiceIds.get(inquiry.practiceSeedKey);
    const buyerId = ids.get(inquiry.buyerEmail);
    const practice = practices.find((item) => item.seedKey === inquiry.practiceSeedKey);
    const sellerId = practice ? ids.get(practice.ownerEmail) : undefined;
    if (!practiceId || !buyerId || !sellerId) throw new Error(`Missing inquiry link for ${inquiry.practiceSeedKey}`);
    await Inquiry.findOneAndUpdate(
      { practiceId, buyerId },
      { $set: { sellerId, message: inquiry.message, status: inquiry.status } },
      { upsert: true },
    );
  }

  const approved = practices.filter((practice) => practice.status === 'APPROVED').length;
  console.log(`[practicebridge] Seeded ${users.length} fictional users, ${practices.length} practices (${approved} approved), and ${inquiries.length} inquiries.`);
  console.log('[practicebridge] Sellers: elena.vasquez@example.com, priya.shah@example.com, marcus.hale@example.com');
  console.log('[practicebridge] Buyers: james.okonkwo@example.com, amira.hassan@example.com, owen.clarke@example.com');
  await disconnectDb();
}

void main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, 'mongodb://[redacted]') : 'Unknown error';
  console.error(`[practicebridge] ${message}`);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
