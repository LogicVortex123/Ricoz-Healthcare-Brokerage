# Local operations and production requirements

## Configuration

Use Node 24 and per-application npm lockfiles. `apps/api/.env.development.example` describes all local settings. Never put backend credentials in `NEXT_PUBLIC_*`. The old pnpm lockfile and prototype helpers remain historical; current documented commands use npm. No service is purchased, deployed, or contacted for real email.

The API requires a MongoDB replica set and fails startup on standalone MongoDB. `/api/v1/health` is liveness; `/api/v1/ready` verifies the replica set. Missing database requests fail with 503. Local storage is private under `apps/api/.private-storage` by default. Never point it into `apps/web/public`, a Git-tracked directory, or a web-served path. Restrict filesystem access and use encrypted disks for any real data.

`DEV_EMAIL_OUTBOX=true` stores synthetic delivery instructions in MongoDB `outbox`, never through an HTTP endpoint. In mongosh select your development database and run `db.outbox.find({}, {to:1,kind:1,token:1,expiresAt:1})`. Verification/reset tokens are single-use, expire in an hour, and only hashes are stored in authTokens. Outbox contents are sensitive delivery material. Do not enable this adapter for real customers.

`DEV_SCANNER=synthetic` is a deterministic synthetic-file adapter; it rejects EICAR/SCAN_FAILURE markers and provides no real malware assurance. Without it scanning returns 503 and files remain quarantined. Production startup is deliberately disabled until approved production adapters exist. PDF and UTF-8 text only, 2 MiB maximum. No patient/clinical records. Failed initiated uploads are marked failed after 24 hours; `npm --prefix apps/api run maintenance` removes eligible orphan files. Run this as one scheduled maintenance process. It checks references and legal holds/retention before deleting file bytes.

## Backup and restore

1. Choose an RPO/RTO with the operator; these are unresolved business decisions.
2. Use `mongodump --uri "$MONGODB_URI" --oplog --out <protected-backup-path>` against the replica set. On PowerShell use `$env:MONGODB_URI`. Never paste real URIs into shared logs.
3. Copy private storage with an encrypted backup process and record a manifest of document hashes. Quiesce document writes during the snapshot or use a versioned object-store snapshot in production.
4. Encrypt backups, restrict access, and apply reviewed retention/hold policy. Keep database and document snapshots correlated.
5. Restore into an isolated replica set using `mongorestore --uri <isolated-uri> --oplogReplay <dump-path>`; never overwrite an active environment as a routine rollback.
6. Restore storage, verify released document hashes, collection indexes and counts, test session revocation and the disclosure gate, then run UAT. Revoke restored sessions before any exposure.

## Deployment and rollback

Production deployment is blocked in code. Before removing that block implement approved email delivery, private object-storage and malware-scanner adapters; vendor/data handling review; TOTP secret encryption/key rotation; immutable audit DB permissions; monitoring and backup drills; jurisdiction/representation/consent/retention review; and independent security/accessibility/UAT signoff. Rate limits now persist in MongoDB. Do not claim legal enforceability, ownership verification, or compliance based on stored fields.

Deploy Next.js and the Express modular monolith behind TLS, with `/api/v1` routed only to Express. Use host-only Secure HttpOnly SameSite cookies. Keep Express on a private interface; expose only the TLS proxy. Set TRUST_PROXY_HOPS only to the actual trusted chain. Avoid wildcard CORS. Restrict request body limits at the proxy as well as API. Do not log cookies, tokens, raw request bodies, financials, legal names, or document content. Log request IDs and safe error codes. Separate each environment's database, credentials, encryption keys and storage.

Build immutable artifacts from lockfiles. Back up before schema/index changes, validate readiness, and deploy with backward-compatible changes. Roll back application artifacts without reversing ownership applications or dropping history. Database repair requires an explicit reviewed incident procedure.

## Incident and access revocation

Suspend an account as super administrator (revokes sessions), revoke its scoped membership, revoke named grants, or cancel an affected deal with a recorded reason. Reassign broker records as a brokerage manager. Access checks use current memberships/assignments/grants each request. Preserve audits, closing operations, evidence and legal holds. Rotate compromised credentials/keys; do not delete the incident history. Investigate safe request IDs and document-download audit events. Test revocation from a previously authenticated browser.

## Known implementation limits

- Production storage/email/scanner adapters are not implemented; production boot is blocked.
- Staff invitation requires an already registered, verified user. MFA recovery/reset requires an operator procedure; no self-service bypass exists.
- Practice onboarding, ownership, participant setup, grants, offers and human valuation review now use guided forms/selectors. Some administrative actions and evidence references still require IDs; further usability review remains.
- Main private queues, document/ownership collections, offer/task subresources and grant/NDA histories have cursor APIs. Some detail summaries and current UI views remain bounded to recent records rather than exposing every history page.
- MongoDB-backed jobs with atomic leases implement deduplicated overdue-task reminders and retry recovery. Run `npm run worker`; production outbound delivery is not implemented. Notifications are persisted in-app; local email uses outbox.
- Legal workflow templates and consent semantics are a generic development baseline requiring jurisdiction-specific review. `otherReviewed` closing is blocked until a policy is implemented.
- No independent WCAG 2.2 AA certification, penetration test, production load test, or recovery drill has occurred.
