# Agent guide — Healthcare Practice Transition Brokerage

## Purpose and source of truth

Build a working broker-managed application for buying, selling, and transferring dental, veterinary, and specialist medical practices. Read `docs/PROJECT-PROMPT.md` and `docs/PRD-BASELINE.md` before changing product behavior. The supplied project specification is the current baseline; `docs/PRD.md` records that the separately referenced PRD attachment was unavailable. Do not treat open legal or business decisions as approved facts.

## Current state

This is an active development implementation, not a completed or production-ready MVP. The UI has a simple entry path: choose Buyer or Seller, create an account or sign in, then go to opportunities or practice onboarding. Broker workspaces cover review, qualification, disclosure, documents, deals, offers, diligence, closing, handover, and human valuation request/review/report. Some administrative screens still expose technical IDs. Consult `docs/IMPLEMENTATION.md`, `docs/VERIFICATION.md`, and `docs/OPERATIONS.md` for details. The historical 45% checkpoint is an estimate, not a feature completion claim.

## Architecture

- `apps/web`: Next.js 16, React, TypeScript. `components/Platform.tsx` is the active connected UI. `components/LegacyPrototypePage.tsx` and older components are preserved prototype code. Read `apps/web/AGENTS.md` and relevant installed Next documentation before editing web code.
- `apps/api`: Express, TypeScript, MongoDB/Mongoose modular monolith. `src/server.ts` is the actual entry point; `src/platform/` owns authentication, authorization, validation, and business workflows. Do not add Next route handlers for core APIs.
- `packages/shared`: preserved shared package. `docs/API.md` describes the Express `/api/v1` contract.
- MongoDB replica set is required for transactional commands. Development files live in private local storage outside Next `public/`.

## Product rules that must survive changes

- Support full acquisition, partial buyout, partner retirement, and succession. An internal partner transfer must work without a public listing or external buyer.
- Public listings contain only reviewed anonymous teasers. Practice identity, raw financials, private documents, storage keys, and internal notes must never leak through list/detail APIs or rendered page data.
- Every protected Express operation checks active identity, membership, scope, assignment or explicit participation, action permission, workflow state, and disclosure prerequisites. Super administrators do not automatically get confidential business-document access.
- NDA acceptance alone grants nothing. Confidential access also requires current qualification, a named active grant, correct scope, and resource policy.
- Ownership is integer basis points. Verified snapshots total 10,000. Apply equity changes only through authorized, evidence-backed, idempotent closing; asset transfers do not automatically change entity ownership.
- Offers have immutable submitted revisions. Acceptance is separate from legal close. Closing and handover are separate states.
- Files remain quarantined until a scanner result and human release. Synthetic scanning is development-only. No patient-identifiable records, payment custody, production AI, or real email in the development environment.
- Development `DEV_SIMPLE_AUTH=true` allows email/password signup and login without local verification/MFA friction. It is deliberately unavailable in production. Auth uses short-lived JWT access cookies, rotating opaque refresh cookies, MongoDB session revocation, CSRF, and server-side membership checks. Never store tokens in localStorage.

## How to work

1. Inspect the current diff and preserve unrelated changes. Read the prompt, relevant documentation, and affected code before editing.
2. Pick one user journey and implement it end to end, including API policy, UI, and a meaningful behavior check. Keep the UI direct: Buyer browses and expresses interest; Seller adds a practice and starts a transition; Broker reviews and advances evidence-backed work.
3. Do not add decorative controls or technical fields to user flows without a clear purpose. Keep private/internal operations scoped to staff screens.
4. Run relevant checks. Root scripts: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd test`, `npm.cmd run test:e2e`. Local simple-auth browser check: `npm.cmd run test:e2e:simple --prefix apps/web`. Report only checks actually run.
5. Update `docs/VERIFICATION.md` and the decision/implementation register when behavior or limitations change. Never claim legal compliance or production readiness based on synthetic fixtures.

## Local operation

See `README.md` for exact setup. The last local instance used web `http://localhost:3001`, API `http://127.0.0.1:4001`, and Mongo replica set port `27020`; these are runtime observations, not guaranteed free ports. Check listeners before launching another instance. `scripts/start-local.ps1` starts the local stack with explicit ports. Seed only an empty development database using the opt-in seed command; demo credentials are in `README.md` and are never production credentials.

## External dependencies and decisions

Production email transport, private object storage, malware scanning, approved legal text, representation/jurisdiction rules, retention policy, and deployment controls remain unresolved. Build local functionality with explicit development adapters, but keep production startup fail-closed until the needed integrations and approvals exist.
