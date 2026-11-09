# PracticeBridge

Healthcare Practice Transition Brokerage for the BookMyWarehouse / Ricoz Innovation internship. PracticeBridge is a provisional product name for this milestone. It is not an approved company brand.

The first milestone covers registration, secure sign-in, seller listings, administrator review, buyer discovery, and inquiries for dental, veterinary, and specialist medical practices.

## Stack

- Next.js web app in `apps/web`
- Express API in `apps/api`
- MongoDB database `ricoz_healthcare`
- JWT session stored in an HttpOnly cookie

## Setup

Requirements: Node.js 20 or newer.

```bash
npm install
```

Copy `apps/api/.env.example` to `apps/api/.env` and set:

- `MONGODB_URI` — Atlas connection string for `ricoz_healthcare`
- `JWT_SECRET` — at least 32 random characters
- `WEB_ORIGIN` — web origin, default `http://localhost:3000`

Copy `apps/web/.env.example` to `apps/web/.env.local` if the API is not on `http://localhost:4000`.

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

Create an administrator. The public registration form cannot create this role.

```bash
npm run user:create -- --role ADMIN --name "Morgan Ellis" --email "you@example.com" --password "a-long-password-1"
```

The command can also read `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `apps/api/.env`. It does not print the password.

Optional fictional demo records. This writes to whatever database `MONGODB_URI` points at, so it is refused unless you opt in:

```bash
SEED_CONFIRM=yes SEED_PASSWORD="a-long-password-1" npm run seed
```

On PowerShell:

```powershell
$env:SEED_CONFIRM="yes"; $env:SEED_PASSWORD="a-long-password-1"; npm run seed
```

## Checks

```bash
npm run db:check
npm run typecheck
npm run lint
npm run test
npm run build
```

API tests use an in-memory MongoDB server and do not touch Atlas.

## Demo

See `docs/PHASE1_DEMO.md`.

## Vercel

Deploy the web app as its own Vercel project with the root directory set to `apps/web`.

Set these environment variables before building:

- `API_PROXY_URL` — `https://ricoz-healthcare-brokerage.onrender.com`
- Leave `NEXT_PUBLIC_API_URL` empty so the browser stays on the Vercel domain and Next.js proxies `/api` to the Express server

The API keeps its own host because it is an Express process with a MongoDB connection. Set `WEB_ORIGIN` on the API to the Vercel site URL, and set `MONGODB_URI` and `JWT_SECRET` only on the API host. Do not put the database connection string in the web project.

The Render service at `https://ricoz-healthcare-brokerage.onrender.com` also serves the website. Its build command must be `npm install && npm run build -w @ricoz/api` and its start command must be `npm run start -w @ricoz/api`. Redeploy that service after pulling the latest `main` commit. On Render, the public site and the API share one address, and `/api` is handled by Express.
