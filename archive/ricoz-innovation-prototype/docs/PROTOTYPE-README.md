# Recoz Dental Practice Transition Brokerage Platform (India-First)

A confidential, broker-led transaction management and discovery platform for Indian dental practice sales, partner buy-outs, and associate transitions.

## Overview
Built strictly following the **Dental Practice Transition Brokerage Platform (India-first): Research & PRD (Nov 7, 2026)**.

The system addresses the fragmented Indian dental market where owners lack confidential, structured exit pathways. It enforces server-side 4-tier confidentiality, an internal broker-driven CRM with 13 transition pipeline stages and stage gates, seller practice intake with financial records, buyer discovery with teaser masking, NDA clickwrap verification, and audit logs.

## Monorepo Architecture
```
├── apps/
│   ├── web/               # Next.js (App Router), React, Tailwind CSS, TypeScript
│   └── api/               # Express.js REST API (/api/v1), TypeScript, Zod
├── packages/
│   └── shared/            # Shared Zod schemas, Enums, DTOs, and India formatting utils
└── docs/
    ├── PRD.md             # Complete Research & PRD Specification
    ├── ARCHITECTURE.md    # System Architecture & Disclosure Flow
    ├── DATABASE.md        # 21 MongoDB Collection Schemas & Access Matrix
    ├── API.md             # API Endpoints & Authorization Rules
    └── DECISIONS.md       # Architectural Decision Log (TD-01 to TD-12)
```

## Core Design Tokens & UI Guidelines (PRD Section 15)
- **Primary**: `#0F4C5C` (Deep Teal)
- **Primary Hover**: `#0B3A47`
- **Ink**: `#1B2430`
- **Muted Text**: `#5B6573`
- **Surface**: `#F7F8FA`
- **Border**: `#E1E5EB`
- **Success**: `#1F7A4D`
- **Warning**: `#8A5A00`
- **Danger**: `#B42318`
- **Info**: `#2457A6`

## Role Dashboards Implemented
1. **Broker CRM & Manager Dashboard**:
   - Kanban deal pipeline across 13 stages with requirement gates
   - Deal workspace & stage transition controls with reason logging
   - Lead management & assignment (Sellers, Buyers, Inquiries)
   - Today's tasks & overdue follow-up alerts
2. **Seller Dashboard**:
   - Sale status timeline (Draft → Submitted → In Review → Approved → Listed → Under Offer → Sold)
   - Practice intake wizard & 3-year financial disclosure (Revenue, Expenses, EBITDA)
   - 4-Tier disclosure preview (what buyers see before and after NDA)
   - Buyer access requests management with seller veto capability
   - Due diligence document upload checklist
3. **Buyer Discovery Portal**:
   - Tier 0 & 1 anonymized practice search (e.g., "General dental practice, South Bengaluru", ₹50L-1Cr, 4 chairs)
   - Dynamic filters (Specialty, City, Revenue Band, Chairs, Transition Type)
   - Tier 2 locked field placeholders ("Available after NDA & Broker Approval")
   - Clickwrap NDA acceptance modal with legal hashing and IP timestamping
4. **Admin Platform & Governance**:
   - Listing moderation queue (Approve, Request Changes, Reject)
   - Doctor & business verification queue (DCI Registration Number & Council)
   - Immutable audit log viewer for all role actions, grants, and downloads

