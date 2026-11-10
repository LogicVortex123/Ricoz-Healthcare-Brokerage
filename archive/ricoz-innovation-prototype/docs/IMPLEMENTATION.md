# Implementation register

The repository PRD was a partial placeholder. The full user specification supplied on 2026-11-09 is the implementation baseline. No separate PRD attachment or `/workspace/work/pdf-conversion/prd.md` was available. Older India/dental-only architecture documents describe the prototype and are superseded where they conflict with this specification.

## Plan
1. M0/M1: retain prototype files; introduce modular Express application, shared validation, MongoDB sessions, memberships, MFA, audit, development outbox, and tests.
2. M2: connect public discovery, practice intake, moderation, interests, and broker deal creation to actual APIs.
3. M3: ownership, opportunity qualification, immutable agreement evidence, named grants, private quarantine/release/download controls.
4. M4/M5: immutable offer revisions, diligence, stage gates, transactional/idempotent closing, handover, notifications, metrics, human valuation.
5. M6: execute build/tests, document operations and actual remaining gaps.

## Decisions and open questions
- Keep `packages/shared` for compatibility with existing components; new contracts may be added there.
- Preserve existing modified prototype components; the connected entry point replaces the role-switching demo.
- Single origin Next.js rewrite to Express `/api/v1`; server-side opaque cookie sessions and CSRF tokens. No browser-stored credentials.
- Global administration alone confers no confidential practice/document access. Active assigned membership is checked on every request.
- Legal templates, retention periods, brokerage representation and jurisdiction requirements require business/legal review. Development sample NDA is explicitly not a validated signature.
- No automated valuation, payment handling, production AI, Redis or external communications.
- Document scanner defaults to quarantine; deterministic synthetic scanning requires explicit development mode.
- MongoDB replica-set transactions are required; unavailable database operations return errors rather than simulated success.

## Paused checkpoint — 9 November 2026

Follow-up authorized by the user: simplify authentication for the current local demo. Implemented explicit development-only password login and immediate registration, with a two-option authentication screen and deferred local email/MFA checks. The standard flow is retained. This follow-up does not expand the rest of the paused product scope.

At the user's request, the current work is finalized as an estimated 45% planning checkpoint and further feature implementation is paused. Working development paths span the authentication/scoping foundation, connected discovery/intake/CRM workflow, development disclosure/documents, offers/diligence, and transactional closing/handover. This does not mean all M0–M6/P0 requirements are production-complete. See CHECKPOINT-HANDOFF.md for the shareable completed-work list, VERIFICATION.md for actual final checks, and OPERATIONS.md for the remaining production and usability work.

## Authentication priority follow-up
JWT access credentials and rotating MongoDB-backed refresh sessions are implemented, with the refreshed authentication UI. The temporary local simple-login flag remains explicit.

## Human valuation follow-up
F20 human valuation is now a connected vertical slice: sellers/staff request from the practice workspace; assigned staff start review, decline, or publish a released valuation report selected from practice documents (no raw document IDs in the ordinary flow); sellers see status, history and can download the released report; list/detail APIs stay scoped by practice access. Automated valuation remains explicitly out of scope.

## Express API completion follow-up
`apps/api/src/server.ts` + `src/platform/*` remains the authoritative `/api/v1` modular monolith. Legacy `src/index.ts` / `workflow.ts` are historical only. Exclusive accepted offers move published listings to `underOffer`; cancelling that exclusive deal restores `published`; legal close sets eligible listings to `closed`. Demo seed includes an open synthetic valuation request. `.env.example` aligns with the development replica-set profile. Production email, object storage, malware scanning, and legal-template approvals remain external gaps.

## UI goal clarity follow-up
Compared public brokerage sites (Practice Transition Partners, Wicklow, The Practice Market, Henry Schein Dental Practice Transitions, Simmons, Total Practice Solutions). Their common pattern is one sentence of purpose, then a buy-or-sell choice, then anonymous listings. The home screen now leads with that goal and three steps. Existing Express workflows are unchanged. Buyer journey selectors in `apps/web/tests/journeys.spec.ts` were updated to the new labels.
User-authorized redesign of the connected Platform shell for clearer, less complicated use while preserving the existing 45% API workflows. Changes: grouped navigation labels, Ricoz brand-led home hero with a single Buy / Sell CTA group, calmer teal/neutral visual system with Manrope + Fraunces, mobile drawer navigation, simpler account summary, and AuthPanel copy polish. No Express contract changes. Local auth verified: buyer email/password sign-in, role-scoped nav, express-interest controls, and sign-out.
