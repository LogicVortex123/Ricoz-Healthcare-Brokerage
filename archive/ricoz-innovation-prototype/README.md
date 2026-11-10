# Healthcare Practice Transition Brokerage

For a reusable full project brief, see [docs/PROJECT-PROMPT.md](docs/PROJECT-PROMPT.md). For repository agent instructions and current implementation boundaries, see [agent.md](agent.md).

Connected Next.js/React/TypeScript frontend and Express/MongoDB modular monolith for dental, veterinary and specialist medical practice transitions. Supports confidential discovery and private acquisition, buyout, retirement and succession workspaces. This is a working development implementation; production startup is deliberately blocked pending approved integrations and security/legal review.

The user has paused work at an **estimated 45% project checkpoint**. The shareable completed-work report is in [docs/CHECKPOINT-HANDOFF.md](docs/CHECKPOINT-HANDOFF.md). The final checkpoint is running on **http://localhost:3001**, with Express on 4001 and a separate local replica set on 27020. Logs and process IDs are kept in `.local`. If these ports are free after stopping the existing instance, launch it with `powershell -NoProfile -File scripts/start-local.ps1 -WebPort 3001 -ApiPort 4001 -MongoPort 27020`. Do not start a duplicate instance while it is running.

**Authentication is simplified for the local demo:** choose Buyer or Seller, sign in with email/password, or create an account and enter immediately. The local launcher sets `DEV_SIMPLE_AUTH=true`; no email token or staff authenticator is needed in that mode. Passwords require at least 8 characters for local signup. Argon2id hashing, JWT access cookies, rotating refresh credentials, MongoDB session revocation, CSRF, and scoped permissions remain active. Disable the flag to restore email verification and privileged MFA. This shortcut is disabled in production. Run `npm --prefix apps/web run test:e2e:simple` to verify the local flow.

The original repository was a role-switching prototype. Its useful components and prior modified page are preserved in `apps/web/components/LegacyPrototypePage.tsx`; the active page uses `Platform.tsx`. The available PRD was incomplete. The full supplied task is recorded as the baseline in [docs/PRD-BASELINE.md](docs/PRD-BASELINE.md).

## Local startup (PowerShell, Node 24)

Install dependencies from the checked-in per-app lockfiles:

```powershell
npm.cmd ci --prefix apps/api --cache .npm-cache
npm.cmd ci --prefix apps/web --cache .npm-cache
Copy-Item apps/api/.env.development.example apps/api/.env
```

Do not overwrite an existing `.env`; copy missing settings manually if one exists. For private local files, paths resolve relative to `apps/api` when using these commands. Existing production/Atlas credentials are not needed.

In terminal 1, start the development replica set (first run downloads the official MongoDB binary):

```powershell
npm.cmd run dev:mongo
```

Alternatively run `docker compose -f compose.dev.yml up -d` with Docker Desktop running. The compose healthcheck initializes rs0. Use only one of these MongoDB options at a time.

In terminal 2:

```powershell
npm.cmd run seed
npm.cmd run dev:api
```

In terminal 3:

```powershell
npm.cmd run dev
```

Open http://localhost:3000. API liveness/readiness: http://127.0.0.1:4000/api/v1/health and `/api/v1/ready`. Next proxies `/api/v1` to Express; backend secrets never enter the client bundle.

## Synthetic demonstration

Seeding requires `ALLOW_DEMO_SEED=true`, a nonproduction environment, and an empty database. It never drops existing data. To reset, stop the API and choose a new development database name in MONGODB_URI, then seed again. Retain the previous database until you intentionally remove it with operator authorization.

All demo accounts use **DevelopmentOnly!2026** and `@example.test`: seller, buyer, buyer2, broker, broker2, manager, foreignbroker, foreignmanager, admin, partner, acquirer. These are development-only credentials. Simplified local authentication currently requires only email/password. With DEV_SIMPLE_AUTH=false, staff must enroll an authenticator on Account. There is no role-switching login bypass.

Seed includes all categories/purposes, two brokerage scopes, multiple buyers/brokers, an entirely private retirement, approved/expired grants, reviewed/quarantined synthetic files, immutable offer revisions, overdue tasks, and a closed deal awaiting handover. Buyer2 starts without deal access to demonstrate isolation. Seller/manager/broker workspaces expose IDs required by the initial evidence forms. NDA acceptance alone grants nothing.

Registration verification and password reset use the local MongoDB `outbox` collection. Inspect it with mongosh; no real email is sent. See [operations](docs/OPERATIONS.md) for the query and data-handling caveats. Development scanner is synthetic only; without it files remain quarantined.

## Verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

API tests download/run a real disposable MongoDB 8.0 replica set; no production database is used. Browser tests start an isolated seeded replica set, Express on 4100 and Next on 3100. They use installed Chrome on Windows. On other systems install Playwright Chromium (`npx playwright install chromium` from apps/web), or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Ports 3100/4100 must be free. Browser tests include axe accessibility and desktop/mobile screenshots in apps/web/test-results.

## Architecture and current scope

- `apps/api/src/platform`: strict command validation, cookie auth/MFA, authorization policies, practice/discovery, disclosure/documents, deals/offers/diligence/closing, scoped administration/audit/metrics.
- `apps/api/src/seed.ts`: explicit synthetic fixtures; `dev-mongo.ts`: local persistent replica-set launcher.
- `apps/web/components/Platform.tsx`: connected application shell and all core workspaces.
- `packages/shared`: preserved legacy prototype schemas; new authoritative command schemas live in the Express platform contracts module.
- MongoDB stores business records, sessions, idempotency results, audit and notification intent. Private document bytes use a local development filesystem adapter outside public web directories.

Read [API contracts](docs/API.md), [authorization](docs/AUTHORIZATION.md), [implementation register](docs/IMPLEMENTATION.md), and [operations/backup/restore/deployment/incident runbook](docs/OPERATIONS.md). Older prototype documents are historical where they conflict with the baseline.

Production storage/email/malware integrations, legal templates and retention/representation policy remain external dependencies. Guided onboarding, ownership/participant/grant/offer editors, MongoDB-backed rate limits and leased reminder jobs are implemented. Some administrative/evidence references still require IDs, and complete history pagination in the UI and broader security/UAT remain future work. Do not treat a successful build or synthetic demo as production readiness or legal compliance.
