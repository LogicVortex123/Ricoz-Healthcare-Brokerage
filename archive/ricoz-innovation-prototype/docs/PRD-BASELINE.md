# Healthcare Practice Transition Brokerage — implementation baseline

Source: the full task specification supplied 2026-11-09. The original attached PRD was not present. The pre-existing `docs/PRD.md` recorded only a truncated earlier prompt. This baseline supersedes dental-only, India-first and Redis/token architecture assumptions in older prototype documentation.

Problem: managing buyouts, partner retirements and acquisitions of dental, veterinary and specialist medical clinics. Support full acquisition, partial buyout, partner retirement and succession, including internal transitions without a listing or external buyer. Broker-managed hybrid: approved anonymized public discovery, private intake/workspaces, human readiness review, explicit disclosure, diligence, external legal-close evidence and separate handover.

Required stack: Next/React/TypeScript, Express owning all business APIs, MongoDB primary database, modular monolith. No replacement browser storage, static backend, Next business API, production AI, payment custody or default queue/microservice infrastructure.

P0 scope: authentication/sessions; scoped memberships/admin; multi-category onboarding; historical ownership snapshots/proposals; seller and buyer dashboards; moderated listings; interests/readiness review; versioned NDA evidence/named disclosure; private documents; leads/assignments/internal notes/tasks; guarded deals; immutable offer revisions; diligence; closing/handover; durable essential notifications; audit; scoped metrics; configuration/recovery; human valuation requests/reports.

Authorization intersects active session, current membership, brokerage scope, ownership/assignment or explicit participation, permitted action, workflow stage, classification and current disclosure prerequisites. Super admin does not receive business-document access automatically. Partner capacities are deal-specific. List/count/metric policies match detail access. No internal notes in participant DTOs.

Auth: public seller/buyer registration, verified email, Argon2id, opaque Mongo sessions in host-only HttpOnly cookies, CSRF, rotation/revocation, hashed expiring single-use tokens, resistant recovery responses, bounded rate limits, staff invitations/roles, MFA for privileged users, profile/suspension/deletion review. Development outbox sends no real email.

Practice: category-discriminated common private identity/location/facility/staff/financial periods/currency/reason/purpose/structure/timeline; dental operatories/equipment; veterinary species/services/facilities/equipment; specialist specialty/consultation/procedure/equipment. All geography is explicit; no assumed jurisdiction or representation.

Ownership: independent legal owners, integer basis points totaling 10,000, historical reviewed snapshots, transferors/transferees, absolute percentage-point transfers, evidence/consent, disputed/over-transfer/stale/concurrent guards. Equity ownership applies only through evidence-backed transactional idempotent closing. Asset close never automatically replaces entity ownership.

Listing states: draft/review/published/paused/underOffer/withdrawn/closed. Only approved teaser fields may leave the public API; no identity/address/financial raw values/owner names/keys/documents/cache leakage. Indexed bounded filtering/sorting/cursors.

Disclosure requires current opportunity qualification, immutable current-version agreement acceptance with actor/party/authority/hash/time/scope, explicit named grant with scope/expiry/revocation, relationship/membership and resource authorization. Acceptance is not validated legal e-signature. NDA alone never unlocks access.

Documents: initiate/upload/quarantine/scan/review-release/supersede/delete; private storage, opaque keys, bounded size/extensions/signatures/MIME, malware boundary, classification, versions, authorized audited download, recovery/orphan cleanup, retention/holds. No patient or clinical records. No production scanner means quarantine; unsafe development adapters must fail production startup.

Deal stages: initiated/preparation/diligence/termsAgreed/closing/closed/handover/completed/onHold/cancelled. Evidence gates cover authority/current ownership/disclosure/diligence/consents/terms/closing/handover. Backward moves require reason; closed cannot casually revert; cancellation retains history and revokes future access. Offers use immutable revisions, money in integer minor units/currency, stake basis points, conditions/expiry/attachments and exclusive acceptance. Accepted offer is not closing.

Diligence copies a versioned category/transaction template, records evidence/responsibility/review, and supports open/submitted/accepted/changesRequested/waived; waiver requires reason and authority. Valuation is human request/review/report, with no invented multiple or automated estimator.

Mongo: expected named collections, indexes, validated references, bounded arrays, UTC timestamps, concurrency and logical expiry, replica-set transactions for critical related updates/audit/notifications, canonical actor/action/resource idempotency hashes and permanent closing guards. No fake database success.

UX: coherent teal/neutral responsive application, keyboard/focus/semantic forms/errors/status/confirmation, core public/account/intake/dashboards/CRM/disclosure/document/deal/offer/diligence/closing/admin/audit/metrics screens; every exposed action works or states a genuine deferred dependency.

Delivery milestones M0 setup; M1 auth/policy/audit/CI; M2 seller→review→discovery→interest→CRM→deal; M3 ownership/qualification/NDA/grants/documents; M4 offers/diligence/stages; M5 closing/handover/notifications/metrics; M6 hardening/accessibility/recovery/UAT/deployment docs. Must verify with real disposable Mongo replica sets, behavior tests, builds, types, lint, browser journeys and accessibility. Never claim unrun checks passed.

Seed must be explicit development-only, fictional example.test identities, all categories/purposes, two brokerages/multiple buyers/brokers, valid/expired grants, quarantined/released evidence, overdue tasks, offer revisions and closed/incomplete handover. Production adapters/legal review, backups/restores, access-revocation runbook, TLS/trusted proxy, log redaction and separate credentials/storage must be documented. No public deployment or real external communications are authorized.

Completion requires the fifteen acceptance outcomes in the supplied task, including all core workflows, authorization isolation, real scoped dashboards, duplicate-safe ownership, executed tests and documented dependencies. Implementation status is maintained separately; this document does not imply completion.
