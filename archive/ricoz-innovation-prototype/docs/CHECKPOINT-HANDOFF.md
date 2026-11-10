# Healthcare Practice Transition Brokerage — 45% planning checkpoint

Date: 9 November 2026. Development is paused at the user's request after the current fixes, UI organization, verification and local launch. **45% is an estimated project delivery checkpoint, not an audited percentage of PRD acceptance criteria or a production-readiness claim.**

Follow-up: authentication has been simplified at the user's request. The running local checkpoint now uses email/password only, and seller/buyer registration signs in immediately. Email verification and privileged MFA remain available in standard mode but are deferred when `DEV_SIMPLE_AUTH=true` in development. This does not change the rest of the paused product scope.

## Shareable progress message

The Healthcare Practice Transition Brokerage platform has reached an estimated 45% development checkpoint. A connected application is implemented using Next.js, React and TypeScript, with an Express API and MongoDB database.

Completed and working in the development environment:

- A responsive healthcare interface with a teal navigation shell, public opportunity cards, a guided practice onboarding wizard, and organized practice/deal workspace sections.
- Onboarding and category validation for dental, veterinary and specialist medical practices, with private practice identity, location, facilities, staffing, financial periods and transition intentions.
- Registration, email verification, login/logout, password recovery/reset, server-side cookie sessions, CSRF protection, profile updates, deletion requests and mandatory staff MFA enrollment. Email delivery uses a local development outbox.
- Scoped memberships, staff invitations, broker assignments/reassignment, account suspension and administrative role controls. Confidential access is enforced by Express, not by the frontend role display.
- Seller/buyer/broker workspaces using real database records, approved anonymized opportunity listings, interests, human qualification review, brokerage leads and private internal notes.
- Versioned confidentiality acceptance evidence and explicit named disclosure grants, including expiry/revocation and separate identity, financial, document and upload scopes.
- Private document initiation, upload, quarantine, synthetic development scanning, review/release, version links, authorized downloads and retention/hold controls. Referenced transaction evidence is preserved.
- Historical ownership snapshots, legal owner records, basis-point validation, transfer proposals and before/after previews, including over-transfer and stale-baseline protection.
- Private acquisition/buyout/retirement/succession deal workspaces, immutable offer and counteroffer revisions, category/transaction diligence templates, evidence reviews and guarded stage transitions.
- Transactional, idempotent legal-closing recording; equity ownership application is separate from asset transfers. Handover tasks and completion remain separate from legal closing.
- In-app notifications, audit events, scoped operational metrics, MongoDB-backed rate limits, leased overdue-task reminder jobs and a human valuation-request/review/report workflow.
- Fictional demonstration fixtures, automated behavior/browser checks, CI configuration, local setup instructions and backup/restore/deployment/access-revocation documentation.

Production email, object storage and malware scanning, jurisdiction-specific agreement/representation/retention policy review, MFA recovery/key protection, broader usability/security/UAT and operational recovery exercises remain for the next phase. Production startup is intentionally blocked. No public deployment or real external email has been made.

Development is now paused so the current checkpoint can be reviewed before further implementation.

## Local review

Final running checkpoint URL: **http://localhost:3001**. API: http://127.0.0.1:4001/api/v1. The final checkpoint uses a separate MongoDB replica set on **27020** and database `healthcare_checkpoint_20261109`, preserving the existing standalone MongoDB service on 27017. An earlier preview on 3000/4000/27019 was left running because automatic review blocked its process restart; the final reviewed instance is on 3001.

Start with `powershell -NoProfile -File scripts/start-local.ps1 -WebPort 3001 -ApiPort 4001 -MongoPort 27020` after installing the per-app npm dependencies, when these ports are free. The script compiles the API, starts background development processes, seeds only an empty checkpoint database, and records logs/process IDs under the Git-ignored `.local` directory. It refuses to take over occupied ports. **The checkpoint is already running; use its URL instead of starting a duplicate instance.**

Development-only credentials: `seller@example.test`, `buyer@example.test`, `buyer2@example.test`, `broker@example.test`, `manager@example.test`, `admin@example.test`; password **DevelopmentOnly!2026**. The current simplified local mode does not require an authenticator; standard mode restores privileged MFA. There is no privileged role-switching bypass.

## Review boundaries

These are working development workflows, not certified legal/compliance features. Synthetic scanning does not provide real malware protection. Some administrative/evidence screens still use record IDs, and some detail summaries show bounded recent records even though paginated subresource APIs exist. No independent penetration test, accessibility certification, production load test or backup recovery drill has been completed. The historical dental/India-only prototype files were preserved; the active implementation follows the supplied multi-specialty specification.

Actual final verification results and local readiness are recorded in `docs/VERIFICATION.md` after the final checks.
