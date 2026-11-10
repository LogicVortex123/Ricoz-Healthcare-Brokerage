export interface Deal {
  id: string;
  code: string; // e.g. HPT-BLR-01
  sector: 'dental' | 'veterinary' | 'specialist_medical';
  title: string;
  specialty: string;
  city: string;
  zone: string;
  chairs: number;
  operatoriesLabel?: string;
  revenueBand: string;
  exactRevenue?: string;
  ebitda?: string;
  askingPrice?: string;
  transitionType: string;
  stageId: string;
  sellerName: string;
  buyerName?: string;
  brokerName: string;
  daysInStage: number;
  checklistProgress: { completed: number; total: number };
  verifiedDocuments: number;
  totalDocuments: number;
  notesCount: number;
  nextTaskDue: string;
  hasHardGateWarning?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  type: 'seller' | 'buyer' | 'valuation';
  city: string;
  phone: string;
  email: string;
  specialty: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  assignedTo: string;
  budgetOrRevenue: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dealCode: string;
  dueAt: string;
  isOverdue: boolean;
  status: 'pending' | 'completed';
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AuditLogItem {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  ip: string;
}

export interface AccessRequest {
  id: string;
  buyerName: string;
  buyerRegNo: string;
  practiceTitle: string;
  practiceId: string;
  status: 'requested' | 'nda_signed' | 'approved' | 'vetoed' | 'revoked';
  requestedAt: string;
  ndaSignedAt?: string;
  tier: number;
}

export const PIPELINE_STAGES = [
  { id: 'new_lead', name: 'New Lead', gate: 'Contact verified' },
  { id: 'buyer_qualified', name: 'Buyer Qualified', gate: 'DCI Reg & Proof of Funds' },
  { id: 'nda', name: 'NDA Acceptance', gate: 'Clickwrap executed' },
  { id: 'info_disclosure', name: 'Information Disclosure', gate: 'Broker grant approved' },
  { id: 'due_diligence', name: 'Due Diligence', gate: 'Data room checklist complete (Hard Gate)' },
  { id: 'initial_offer', name: 'Initial Offer', gate: 'Written LOI submitted' },
  { id: 'negotiation', name: 'Negotiation', gate: 'Commercial terms agreed' },
  { id: 'loi', name: 'Letter of Intent', gate: 'Signed by both parties' },
  { id: 'legal_review', name: 'Legal Review', gate: 'Draft transfer deed ready' },
  { id: 'final_agreement', name: 'Final Agreement', gate: 'Definitive agreement executed' },
  { id: 'closing', name: 'Closing', gate: 'Funds escrowed & fee settled' },
  { id: 'ownership_transition', name: 'Ownership Transition', gate: 'Licence & lease transferred' },
  { id: 'post_sale_handover', name: 'Post-Sale Handover', gate: 'Patient records transition' },
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'dl-101',
    code: 'HPT-BLR-01',
    sector: 'dental',
    title: 'High-Grossing Dental Center, South Bengaluru',
    specialty: 'General Dentistry & Orthodontics',
    city: 'Bengaluru',
    zone: 'Jayanagar / JP Nagar',
    chairs: 4,
    operatoriesLabel: '4 Dental Operatories',
    revenueBand: '₹50L - ₹1Cr',
    exactRevenue: '₹84,50,000 / yr',
    ebitda: '₹31,20,000 (37%)',
    askingPrice: '₹1.15 Cr',
    transitionType: 'Partner Retirement & Succession',
    stageId: 'due_diligence',
    sellerName: 'Dr. Ramesh Rao (BDS, MDS - 24 yrs exp)',
    buyerName: 'Dr. Priya V. Sharma',
    brokerName: 'Anand Kumar (Sr. Healthcare Broker)',
    daysInStage: 4,
    checklistProgress: { completed: 6, total: 8 },
    verifiedDocuments: 7,
    totalDocuments: 8,
    notesCount: 14,
    nextTaskDue: 'Today, 4:00 PM (Audit lease agreement)',
    hasHardGateWarning: true,
  },
  {
    id: 'dl-102',
    code: 'HPT-MUM-04',
    sector: 'veterinary',
    title: 'Premier Companion Animal Hospital & Surgery, Bandra West',
    specialty: 'Small Animal Medicine & Orthopedic Surgery',
    city: 'Mumbai',
    zone: 'Bandra West (Waterfield Rd)',
    chairs: 2,
    operatoriesLabel: '2 OTs, 12 Kennels & Diagnostics',
    revenueBand: '₹1Cr - ₹2Cr',
    exactRevenue: '₹1,58,00,000 / yr',
    ebitda: '₹62,00,000 (39%)',
    askingPrice: '₹2.45 Cr',
    transitionType: 'Buyout (100% Acquisition)',
    stageId: 'initial_offer',
    sellerName: 'Dr. Cyrus Bharucha (BVSc & AH, MVSc Surgery)',
    buyerName: 'Apex Veterinary Ventures LLP',
    brokerName: 'Neha Mehta (Director, Healthcare M&A)',
    daysInStage: 3,
    checklistProgress: { completed: 8, total: 8 },
    verifiedDocuments: 9,
    totalDocuments: 9,
    notesCount: 22,
    nextTaskDue: 'Tomorrow, 11:30 AM (Counter-offer review)',
  },
  {
    id: 'dl-103',
    code: 'HPT-DEL-09',
    sector: 'specialist_medical',
    title: 'Aesthetic Dermatology & Day-Care Laser Clinic, South Delhi',
    specialty: 'Dermatology, Trichology & Aesthetics',
    city: 'Delhi NCR',
    zone: 'Greater Kailash 1',
    chairs: 5,
    operatoriesLabel: '5 Laser Procedure Suites & Minor OT',
    revenueBand: '₹2Cr - ₹5Cr',
    exactRevenue: '₹2,85,00,000 / yr',
    ebitda: '₹1,18,00,000 (41%)',
    askingPrice: '₹4.20 Cr',
    transitionType: 'Partnership Transition (Partial Equity)',
    stageId: 'info_disclosure',
    sellerName: 'Dr. Sanjana Malhotra (MD Dermatology, DNB)',
    buyerName: 'Dr. Kabir Khanna',
    brokerName: 'Anand Kumar (Sr. Healthcare Broker)',
    daysInStage: 2,
    checklistProgress: { completed: 5, total: 7 },
    verifiedDocuments: 6,
    totalDocuments: 7,
    notesCount: 8,
    nextTaskDue: '9 Nov, 2:00 PM (Approve Tier 2 Grant)',
  },
  {
    id: 'dl-104',
    code: 'HPT-HYD-12',
    sector: 'specialist_medical',
    title: 'Cataract & Refractive Eye Care Hospital, Jubilee Hills',
    specialty: 'Ophthalmology & Day-Care Cataract Surgery',
    city: 'Hyderabad',
    zone: 'Road No. 36 Jubilee Hills',
    chairs: 6,
    operatoriesLabel: '2 Laminar Modular OTs, 6 Day-Care Beds',
    revenueBand: '₹2Cr - ₹5Cr',
    exactRevenue: '₹3,40,00,000 / yr',
    ebitda: '₹1,32,00,000 (39%)',
    askingPrice: '₹5.10 Cr',
    transitionType: 'Partner Retirement & Succession',
    stageId: 'due_diligence',
    sellerName: 'Dr. Srinivas Reddy (MS Ophthalmology)',
    buyerName: 'Dr. Arjun K. Rao (Ophthalmic Surgeon)',
    brokerName: 'Neha Mehta (Director, Healthcare M&A)',
    daysInStage: 5,
    checklistProgress: { completed: 7, total: 8 },
    verifiedDocuments: 8,
    totalDocuments: 8,
    notesCount: 16,
    nextTaskDue: 'Today, 6:00 PM (Countersign NDA)',
  },
  {
    id: 'dl-105',
    code: 'HPT-PUN-02',
    sector: 'veterinary',
    title: 'Full-Service Veterinary Clinic & Pet Boarding, Koregaon Park',
    specialty: 'General Veterinary Medicine & Surgery',
    city: 'Pune',
    zone: 'Koregaon Park Lane 7',
    chairs: 2,
    operatoriesLabel: '1 OT, 2 Consult Rooms, 8 Boarding',
    revenueBand: '₹50L - ₹1Cr',
    exactRevenue: '₹68,00,000 / yr',
    ebitda: '₹27,00,000 (40%)',
    askingPrice: '₹98 Lakh',
    transitionType: 'Buyout (100% Acquisition)',
    stageId: 'new_lead',
    sellerName: 'Dr. Ananya Joshi (BVSc)',
    buyerName: 'Unassigned',
    brokerName: 'Rohan Shinde (Transition Consultant)',
    daysInStage: 1,
    checklistProgress: { completed: 3, total: 5 },
    verifiedDocuments: 4,
    totalDocuments: 5,
    notesCount: 4,
    nextTaskDue: 'Today, 3:30 PM (Lead intake qualification)',
  },
  {
    id: 'dl-106',
    code: 'HPT-CHE-07',
    sector: 'dental',
    title: 'Boutique Implant & Cosmetic Dental Studio, Alwarpet',
    specialty: 'Implantology & Prosthodontics',
    city: 'Chennai',
    zone: 'TTK Road, Alwarpet',
    chairs: 3,
    operatoriesLabel: '3 Treatment Operatories',
    revenueBand: '₹50L - ₹1Cr',
    exactRevenue: '₹76,00,000 / yr',
    ebitda: '₹29,00,000 (38%)',
    askingPrice: '₹1.10 Cr',
    transitionType: 'Buyout (100% Acquisition)',
    stageId: 'legal_review',
    sellerName: 'Dr. Murali Krishnan (MDS Prostho)',
    buyerName: 'Dr. Kavita Shenoy',
    brokerName: 'Anand Kumar (Sr. Healthcare Broker)',
    daysInStage: 6,
    checklistProgress: { completed: 7, total: 7 },
    verifiedDocuments: 8,
    totalDocuments: 8,
    notesCount: 19,
    nextTaskDue: 'Tomorrow, 10:00 AM (Clinic transfer deed)',
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'ld-01',
    name: 'Dr. Rajesh Nambiar',
    type: 'seller',
    city: 'Bengaluru (Koramangala)',
    phone: '+91 98450 12891',
    email: 'dr.rnambiar@gmail.com',
    specialty: 'General & Implants',
    status: 'new',
    assignedTo: 'Anand Kumar',
    budgetOrRevenue: 'Est. ₹75L Rev',
    createdAt: '2 hours ago',
  },
  {
    id: 'ld-02',
    name: 'Dr. Sneha Hegde (MDS Ortho)',
    type: 'buyer',
    city: 'Bengaluru',
    phone: '+91 97412 88201',
    email: 'sneha.ortho@yahoo.com',
    specialty: 'Orthodontics',
    status: 'qualified',
    assignedTo: 'Anand Kumar',
    budgetOrRevenue: 'Budget: ₹1.0 - ₹1.5 Cr',
    createdAt: 'Yesterday',
  },
  {
    id: 'ld-03',
    name: 'Dr. Farhan Merchant',
    type: 'seller',
    city: 'Mumbai (Andheri West)',
    phone: '+91 98201 44510',
    email: 'farhan.dental@merchantcare.in',
    specialty: 'Periodontics',
    status: 'contacted',
    assignedTo: 'Neha Mehta',
    budgetOrRevenue: 'Est. ₹1.2 Cr Rev',
    createdAt: '2 days ago',
  },
  {
    id: 'ld-04',
    name: 'Aarav Healthcare Ventures',
    type: 'buyer',
    city: 'Delhi NCR, Mumbai',
    phone: '+91 99100 23489',
    email: 'acquisitions@aaravhc.com',
    specialty: 'Multi-Specialty Chains',
    status: 'qualified',
    assignedTo: 'Neha Mehta',
    budgetOrRevenue: 'Budget: ₹5 - ₹10 Cr',
    createdAt: '3 days ago',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk-01',
    title: 'Audit commercial lease agreement for 5-yr lock-in clause',
    dealCode: 'DPT-BLR-01',
    dueAt: 'Today, 4:00 PM',
    isOverdue: true,
    status: 'pending',
    assignedTo: 'Anand Kumar',
    priority: 'high',
  },
  {
    id: 'tsk-02',
    title: 'Verify DCI state council registration badge for Dr. Priya Sharma',
    dealCode: 'DPT-BLR-01',
    dueAt: 'Today, 5:30 PM',
    isOverdue: false,
    status: 'pending',
    assignedTo: 'Anand Kumar',
    priority: 'high',
  },
  {
    id: 'tsk-03',
    title: 'Review counter-offer revised payment milestone structure',
    dealCode: 'DPT-MUM-04',
    dueAt: 'Tomorrow, 11:30 AM',
    isOverdue: false,
    status: 'pending',
    assignedTo: 'Neha Mehta',
    priority: 'medium',
  },
  {
    id: 'tsk-04',
    title: 'Execute NDA clickwrap verification token & issue 60s signed URL',
    dealCode: 'DPT-HYD-12',
    dueAt: 'Today, 6:00 PM',
    isOverdue: false,
    status: 'pending',
    assignedTo: 'Neha Mehta',
    priority: 'high',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-991',
    actor: 'Anand Kumar (Broker)',
    role: 'BR',
    action: 'APPROVED_ACCESS_GRANT',
    entity: 'Listing Tier 2 Access',
    entityId: 'DPT-BLR-01 -> Dr. Priya Sharma',
    timestamp: '2026-11-07 18:24 IST',
    ip: '103.21.144.62 (Bengaluru, KA)',
  },
  {
    id: 'aud-992',
    actor: 'Dr. Priya V. Sharma (Buyer)',
    role: 'BU',
    action: 'CLICKWRAP_NDA_ACCEPTED',
    entity: 'NDA Template v2.4 (KA Legal)',
    entityId: 'SHA-256: 8a4b2c89...e3f',
    timestamp: '2026-11-07 17:50 IST',
    ip: '49.207.210.15 (Bengaluru, KA)',
  },
  {
    id: 'aud-993',
    actor: 'Dr. Ramesh Rao (Seller)',
    role: 'SE',
    action: 'UPLOADED_FINANCIAL_DOC',
    entity: 'FY 2024-25 Audited P&L.pdf',
    entityId: 'enc_doc_9871 (AES-256-GCM)',
    timestamp: '2026-11-07 14:12 IST',
    ip: '157.48.91.102 (Bengaluru, KA)',
  },
  {
    id: 'aud-994',
    actor: 'Admin Anushka',
    role: 'SA',
    action: 'LISTING_APPROVED_TO_DISCOVERY',
    entity: 'Practice Listing',
    entityId: 'DPT-DEL-09',
    timestamp: '2026-11-07 11:05 IST',
    ip: '14.139.241.2 (Delhi, DL)',
  },
  {
    id: 'aud-995',
    actor: 'Broker Neha Mehta',
    role: 'BR',
    action: 'STAGE_MOVED_WITH_GATE_OVERRIDE',
    entity: 'Deal DPT-MUM-04',
    entityId: 'Due Diligence -> Initial Offer',
    timestamp: '2026-11-06 16:40 IST',
    ip: '115.112.89.20 (Mumbai, MH)',
  },
];

export const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'ar-01',
    buyerName: 'Dr. Priya V. Sharma',
    buyerRegNo: 'DCI-KA-19842',
    practiceTitle: 'General Dental Practice, South Bengaluru',
    practiceId: 'dl-101',
    status: 'approved',
    requestedAt: '07 Nov 2026, 10:15 AM',
    ndaSignedAt: '07 Nov 2026, 11:20 AM',
    tier: 2,
  },
  {
    id: 'ar-02',
    buyerName: 'Dr. Siddharth Verma',
    buyerRegNo: 'DCI-KA-24150',
    practiceTitle: 'General Dental Practice, South Bengaluru',
    practiceId: 'dl-101',
    status: 'nda_signed',
    requestedAt: '07 Nov 2026, 02:40 PM',
    ndaSignedAt: '07 Nov 2026, 03:10 PM',
    tier: 1,
  },
  {
    id: 'ar-03',
    buyerName: 'SmileCraft Dental Group LLP',
    buyerRegNo: 'CORP-MH-9810',
    practiceTitle: 'General Dental Practice, South Bengaluru',
    practiceId: 'dl-101',
    status: 'requested',
    requestedAt: '07 Nov 2026, 04:30 PM',
    tier: 0,
  },
];

export const SELLER_PRACTICE_SAMPLE = {
  id: 'pr-my-01',
  code: 'DPT-BLR-01',
  name: 'SmileCare Advanced Dental Clinic',
  specialty: 'General Dentistry & Orthodontics',
  city: 'Bengaluru',
  zone: 'Jayanagar 4th Block',
  addressLine: '#412, 10th Main, Near South End Circle',
  pincode: '560011',
  state: 'Karnataka',
  chairs: 4,
  yearsInOperation: 14,
  practitionersCount: 3,
  staffCounts: {
    dentists: 3,
    hygienists: 2,
    assistants: 3,
    frontDesk: 2,
  },
  equipmentList: [
    'Sirona Intego Dental Treatment Units (x4)',
    'Carestream CS 8100 2D/3D OPG Panoramic X-Ray',
    'Carestream RVG 5200 Digital Sensors (x2)',
    'Euronda Class B Autoclave (24 Litre)',
    'Woodpecker Endomotor & Apex Locator',
    'Silent 2HP Medical Grade Oil-Free Compressor',
  ],
  transitionType: 'Complete Practice Sale (Asset + Goodwill)',
  status: 'listed',
  financials: [
    { year: 'FY 2024-25', revenue: 8450000, expenses: 5330000, ebitda: 3120000, margin: '37%' },
    { year: 'FY 2023-24', revenue: 7600000, expenses: 4940000, ebitda: 2660000, margin: '35%' },
    { year: 'FY 2022-23', revenue: 6900000, expenses: 4620000, ebitda: 2280000, margin: '33%' },
  ],
  documents: [
    { category: 'Financial Statements', name: 'FY 2024-25 Audited P&L and Balance Sheet.pdf', status: 'verified', size: '2.4 MB', date: '04 Nov 2026' },
    { category: 'Tax Records', name: 'ITR-V Acknowledgements (3 Years Consolidated).pdf', status: 'verified', size: '3.1 MB', date: '04 Nov 2026' },
    { category: 'Licences & Regs', name: 'KPME Registration Certificate (Valid till 2029).pdf', status: 'verified', size: '1.2 MB', date: '05 Nov 2026' },
    { category: 'Licences & Regs', name: 'Biomedical Waste Management Authorization (KSPCB).pdf', status: 'verified', size: '980 KB', date: '05 Nov 2026' },
    { category: 'Licences & Regs', name: 'AERB X-Ray Equipment Registration.pdf', status: 'verified', size: '1.4 MB', date: '05 Nov 2026' },
    { category: 'Property Lease', name: 'Commercial Lease Agreement (10 Yr, 4 Yrs remaining).pdf', status: 'pending', size: '4.8 MB', date: '06 Nov 2026' },
    { category: 'Equipment Inventory', name: 'Comprehensive Asset Schedule & Depreciation Sheet.xlsx', status: 'verified', size: '420 KB', date: '06 Nov 2026' },
    { category: 'Employment', name: 'Staff Rosters & Associate Dentist MoUs.pdf', status: 'needs_update', size: '1.8 MB', date: '07 Nov 2026' },
  ]
};

