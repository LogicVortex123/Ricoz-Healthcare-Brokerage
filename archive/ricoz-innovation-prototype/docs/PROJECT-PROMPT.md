# Project prompt: Healthcare Practice Transition Brokerage

You are the lead full-stack engineer implementing **Healthcare Practice Transition Brokerage**. Build connected, working software incrementally. Inspect the repository and applicable `AGENTS.md` files first. Read `docs/PRD-BASELINE.md` and `docs/PRD.md`; the latter records the unavailable external PRD attachment. Preserve useful existing code and unrelated user changes. Do not represent unresolved business or legal decisions as facts. Keep a decision register and report actual progress and verification.

## Goal and operating model

The problem is “Managing buyouts, partner retirements, and acquisitions of dental, veterinary, and specialist medical clinics.” Support dental, veterinary, and specialist medical practices across geographies. Support full practice acquisitions, partial ownership buyouts, partner retirement, and succession. An internal partner transition must work with no public listing or external buyer. Do not assume a transaction transfers 100% of a legal entity or that the brokerage represents only sellers.

The service is broker-managed: reviewed anonymous public listings, private onboarding and deal workspaces, human buyer qualification, explicit confidentiality and disclosure decisions, broker-managed diligence, legal close recording, and separate handover. A signed/accepted NDA alone does not unlock records. Offer acceptance does not mean legal closing.

## Required stack and structure

- Frontend: Next.js, React, TypeScript.
- Backend: Node.js, Express, TypeScript. Express owns `/api/v1` APIs and business rules; Next route handlers and server actions cannot replace it.
- Primary database: MongoDB with replica-set transactions. Mongoose is allowed.
- Modular monolith in `apps/web`, `apps/api`, `packages/shared`, `tests`, and `docs`. Use maintained compatible packages and checked-in lockfiles.
- Prefer same-origin routing: `/` to Next, `/api/v1` to Express.
- Do not substitute another database or browser storage. Do not add Redis, BullMQ, Kafka, Elasticsearch, GraphQL, Kubernetes, Python services, microservices, production AI, payment custody, or escrow by default.

## Primary user journey and UX

Make the product immediately understandable. On the public page, let a visitor choose **Buy a practice** or **Sell/transition a practice**. Buyer signup leads to reviewed opportunities and a clear expression-of-interest action. Seller signup leads to category-specific practice onboarding and transition setup. Staff sign in to review listings, qualify buyers, manage leads and deals, and advance evidence-backed steps. Keep navigation role-appropriate and the next action obvious. Use a polished, responsive healthcare-business visual system: neutral surfaces, readable dark text, restrained teal/blue accent, clear status, semantic forms, accessible focus, and mobile layouts. Every visible action must work or be explicitly marked deferred. Avoid duplicate marketing sections, decorative buttons, and raw technical IDs in ordinary user flows.

Build public home/listing/detail, authentication/account, practice onboarding, seller and buyer views, qualification/NDA/access status, private document workspace, brokerage CRM, deal/offer/diligence/closing/handover workspaces, administration, metrics, and audit. Reuse application shell, tables, forms, status badges, tasks, activity timeline, document controls, ownership before/after, stage progress, and loading/empty/error states. Target WCAG 2.2 AA and verify keyboard use, labels, contrast, and screen-reader status.

## P0 scope

Implement all twenty feature groups as connected workflows:

1. F01 authentication and sessions.
2. F02 scoped roles, memberships, administration.
3. F03 multi-specialty practice onboarding.
4. F04 ownership snapshots and transfer proposals.
5. F05 seller dashboard.
6. F06 buyer and acquiring-organization dashboard.
7. F07 listing review and discovery.
8. F08 interests and buyer qualification.
9. F09 NDA evidence and disclosure grants.
10. F10 private document management.
11. F11 leads, assignments, internal notes, tasks.
12. F12 guarded transaction pipeline.
13. F13 immutable offer revisions.
14. F14 due-diligence checklists.
15. F15 closing and handover.
16. F16 essential notifications.
17. F17 audit events.
18. F18 basic operational metrics.
19. F19 secure configuration, deployment, recovery foundations.
20. F20 human valuation-request workflow.

Defer automated matching/valuation, AI document analysis, complex bidding, real-time chat, workflow designer, payment processing, third-party e-sign, advanced reporting, and a full advisor portal. Use structured tasks, activity history, and document evidence for the initial release.

## Identity, roles, and authorization

Support super administrator, brokerage manager, assigned broker, seller/authorized practice representative, buyer, and named acquiring-organization members. Retiring and remaining partners are explicit **deal capacities**, not broad global roles. Every protected Express operation checks active session, active membership, organization/brokerage scope, record ownership or assignment, named deal participation, action permission, workflow state, resource classification, and current disclosure prerequisites. Reassignment or revoked membership must remove access promptly. Apply the same scoping to lists, counts, metrics, and exports. Sellers cannot view unrelated practices; brokers cannot open unassigned confidential records without authority; buyers cannot view each other's offers or documents; internal notes never appear in participant DTOs; super administrators do not automatically receive business-document access. Use separate public and private response DTOs.

Implement registration, verification, login/logout, password reset, profile, suspension, deletion request, staff invitation/role assignment, and mandatory privileged MFA in the strict flow. Public signup may select only buyer or seller. Use Argon2id, short-lived JWT access credentials backed by revocable MongoDB sessions, rotating opaque refresh credentials, secure HttpOnly host-only cookies, appropriate SameSite, CSRF protection, single-use hashed expiring verification/reset tokens, enumeration-resistant recovery, and rate limits. No credentials in localStorage. The existing `DEV_SIMPLE_AUTH` password-only shortcut is for explicit local development/test only; production must reject unsafe configuration. Use a local outbox when no email provider exists and never send real test mail.

## Practice and ownership

Capture category/specialty, private legal/display identity, country/region/private address, ownership, years operating, facilities, aggregate staffing, financial periods/currency, transition reason/type/timeline. Validate category-specific fields: dental chairs/operatories/equipment; veterinary species/services/facilities/equipment; specialist medical specialty/consultation/procedure facilities/equipment.

Store ownership percentages as integer basis points, with 10,000 = 100%. Verified snapshots total exactly 10,000. Separate legal owners from login identities, preserve history, track transferors/transferees/proposed absolute holdings, evidence and consent. Prevent disputed/invalid, stale-baseline, over-transfer, and concurrent transfers. If A has 60%, B has 40%, and A transfers 30 percentage points to C, the result is A 30%, B 40%, C 30%. Separate `transitionPurpose` (`fullAcquisition`, `partialBuyout`, `partnerRetirement`, `succession`) from `legalStructure` (`equityTransfer`, `assetTransfer`, `otherReviewed`). Asset deals never automatically replace entity ownership. Apply ownership only by authorized evidence-backed closing.

## Listing, interest, qualification, and disclosure

Listing states: draft, review, published, paused, under offer, withdrawn, closed. A public teaser must not reveal legal names, precise addresses, owner/staff names, raw financials, document keys, private files, identifying metadata, or private values through source, metadata, SSR payloads, and caches. Provide indexed, allowlisted filtering/sorting and bounded cursor pagination.

Buyers provide a minimal profile, then opportunity-specific readiness evidence if needed. Staff approve/reject with reason, expiry, and revocation. Agreement records are immutable and versioned: actor, represented party, authority declaration, template/content hash, timestamp, scope. Distinguish electronic acceptance evidence from legally validated e-signature. Confidential access requires all of: active identity/membership, valid opportunity/deal relationship, current approved qualification, applicable NDA evidence, explicit named-user grant, requested scope, unexpired/unrevoked grant, and resource-specific policy. NDA alone grants nothing.

## Private documents

Lifecycle: initiated → uploaded → quarantined → scan clean/rejected → reviewed/released → superseded/deleted when allowed. Validate size, extension, detected MIME, signature, classification, version, and review. Authorized downloads go through Express and are audited; never expose permanent URLs or keys. Support failed-upload recovery, orphan cleanup, and hold-aware retention/deletion. Store nothing confidential in `public/`, Git, or browser storage. Local private filesystem is a development adapter; define a production object-storage boundary. Without production scanning, files remain quarantined. A deterministic synthetic scanner is allowed only in explicitly labeled development/demo mode; production readiness must reject it. Patient-identifiable clinical records are outside MVP.

## Deals, offers, diligence, closing, valuation

Deal stages: initiated, preparation, diligence, terms agreed, closing, closed, handover, completed, on hold, cancelled. Enforce a server transition map with gates for authority/ownership baseline, confidentiality, mandatory diligence, partner consent, current terms, closing evidence, and handover. Backward transitions require reason. Cancellation preserves history and revokes future disclosure as appropriate. Closed deals cannot be casually reverted.

Offers have immutable submitted revisions; counters create new revisions. Store money in minor units plus currency, stake in basis points, structure, conditions, expiry, and attachments. States include submitted, accepted, rejected, withdrawn, expired, superseded. Buyers see only their own offers. Acceptance records communication/evidence, prevents conflicting exclusive acceptance, and is separate from legal close.

Copy versioned diligence templates into each deal; track evidence, responsible actor/reviewer, open/submitted/accepted/changes requested/waived states. Waivers need authority and reason. Closing requires external legal-close evidence and authorized confirmation; apply relevant ownership changes transactionally and idempotently. Handover tasks and pending obligations are separate; completion waits for mandatory handover. Valuation is a human request/review/report workflow only: no invented multiples or automated estimate, and asking prices are not appraisals.

## Database, API, and operations

Expected collections include users, organizations, memberships, sessions, authTokens, practices, ownershipSnapshots, listings, interests, ndaRecords, accessGrants, documents, leads, deals, offers, tasks, notifications, auditEvents, and operations. Add a valuation collection where required. Use bounded arrays, required fields, unique/compound/partial indexes, reference validation, optimistic concurrency, logical expiry, integer money/basis points, UTC time. Transactions are justified for closing/ownership/audit, disclosure/audit, exclusive acceptance, assignments, and critical state plus durable notification intent. Critical commands require actor/action/resource scoped idempotency keys, request-hash comparison, identical retry replay, different-payload conflict, and permanent duplicate-closing guards. MongoDB leased jobs are enough; no separate queue.

Expose versioned `/api/v1` REST endpoints for every P0 group, plus health/readiness. Use consistent success/error envelopes and request IDs; strict schemas and unknown-field rejection; safe Mongo queries; allowlisted filters/sorts and cursor paging; rate limits; meaningful 401/403/404/409/422/429/503. Errors and caches must not leak confidential data. Keep API documentation aligned with implementation.

Provide `.env.example` without secrets, exact README startup/seed/test instructions, replica-set setup, architecture/API/authorization notes, assumptions register, production checklist, backup/restore, deployment/rollback, and incident/access-revocation procedure. Production requires separate credentials/storage, TLS, correct trusted proxy/CORS, log redaction, health/readiness, fail-closed documents, and no development adapters/default credentials/frontend secrets. Do not claim legal compliance, verified ownership, enforceable signatures, or production readiness from code fields or synthetic tests.

## Seed, milestones, and verification

Seed only on explicit development command with fictional `example.test` identities. Include all three specialties, all four transition purposes, multiple buyers and brokers, two brokerage scopes, approved/expired grants, quarantined/released synthetic documents, overdue tasks, offer revisions, and a closed deal with incomplete handover. Never seed production automatically.

Work in vertical slices: M0 setup/contracts/config/fixtures; M1 auth/scoped authorization/audit/CI; M2 seller intake → teaser review → buyer interest → broker lead → initial deal; M3 ownership/qualification/NDA/grants/documents; M4 offers/diligence/guarded pipeline; M5 closing/ownership/handover/notifications/metrics; M6 hardening/accessibility/recovery/UAT/deployment docs. Do not disclose confidential files before M3 controls exist.

Run meaningful API tests against a disposable real Mongo replica set, browser journeys, accessibility checks, lint, typecheck, and production builds. Cover registration/reset/session revocation/MFA, cross-scope denial, mass assignment, teaser privacy, category validation, ownership conservation/staleness, NDA+qualification+grant combinations and revocation, quarantine/scanner failure, buyer isolation, reassignment, offer immutability/exclusivity, stage/diligence gates, idempotent closing, asset-versus-equity behavior, handover, notifications, and exact metrics. State commands and blockers if a check cannot run; never fabricate a pass.

The MVP is complete only when each category can be onboarded, a reviewer can publish a safe teaser, a buyer can express interest and be qualified, agreement evidence and named grants can be recorded/revoked, authorized parties can exchange reviewed files, brokers can manage offers/diligence/stages, all four transition purposes work, closing cannot duplicate ownership changes, handover completes separately, dashboards use scoped database data, unrelated users are denied, critical checks pass, and external production dependencies are documented. At handoff, report implemented features, milestone status, startup/test commands, actual results, gaps, security/operational limits, and the next concrete action. Do not call incomplete features complete.
