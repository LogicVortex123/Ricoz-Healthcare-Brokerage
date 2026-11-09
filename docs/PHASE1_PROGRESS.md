# Phase 1 progress

Status: the first milestone is implemented and checked. This is the agreed Phase 1 scope, not a measured 45% of a larger product. Phase 2 has not been started. The application is demonstrable. It is not claimed to be production-ready.

PracticeBridge is a provisional product name for the Healthcare Practice Transition Brokerage internship project at BookMyWarehouse / Ricoz Innovation. It is not an approved company brand.

## 1. Project overview

PracticeBridge is a web application for buyouts, partner retirements, and acquisitions of dental, veterinary, and specialist medical clinics. A seller records a practice and submits it. An administrator approves or rejects it. Buyers can search only approved listings and send one active inquiry. The seller sees that inquiry. Ownership is recorded as a proposal. The application does not transfer legal ownership.

## 2. Implemented features

- Public landing page, practice marketplace, and listing detail page.
- Registration and login for sellers and buyers. Logout. Role-based dashboards for seller, buyer, and administrator. Broker authorization exists, with a placeholder page only.
- Seller practice drafts, edits, submission, withdrawal, rejection reason, and resubmission.
- Categories: dental, veterinary, and specialist medical.
- Transaction types: complete acquisition, partial buyout, partner retirement, and ownership transition. Partial buyout and partner retirement require an ownership percentage from 1 to 99.
- Administrator review: pending queue, approve, reject with a reason, and status history.
- Buyer search, category, specialty, location, and price filters, sorting, and pagination. Only approved listings are returned.
- Buyer inquiries, seller inquiry list, and administrator inquiry list. A buyer cannot keep two active inquiries on the same practice.
- Dashboard counts read from MongoDB. Empty states are shown when a count is zero.
- Confidentiality: public APIs omit the owner’s email, phone, and street address. A public price can be hidden with “price on request.”

## 3. Technology stack

- Web: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- API: Node.js, Express 4, TypeScript, Zod.
- Database: MongoDB with Mongoose. Database name `ricoz_healthcare`.
- Auth: bcrypt password hashes and a JWT stored in an HttpOnly cookie.
- Tests: Vitest and Supertest. The API tests use an in-memory MongoDB server.

Next.js API routes are not the backend. Firebase, Supabase, and other databases are not used.

## 4. Architecture summary

`apps/web` is the interface. `apps/api` is the Express server. The browser calls `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) with credentials included. Mutating requests send `X-PracticeBridge-Request: 1`. Shared response shapes are `{ data, meta? }` and `{ error: { code, message, details? } }`.

The web app does not connect to MongoDB. The API reads `MONGODB_URI` and `JWT_SECRET` from `apps/api/.env`, refuses a placeholder URI, and stops if either value is missing. Connection errors are redacted before they are logged.

## 5. MongoDB collections

| Collection | Contents |
| --- | --- |
| `users` | Account, role, bcrypt `passwordHash`, optional profile fields. Email is unique. |
| `practices` | Seller practice and listing, including status and review history. |
| `inquiries` | Buyer message, participant ids, and status. |
| `auditevents` | Best-effort record of sign-in, listing review, and inquiry actions. |

Passwords are stored as bcrypt hashes with cost 12. Plaintext passwords are not stored. The hash is excluded from API responses.

## 6. Authentication and authorization

- Public registration accepts only `SELLER` and `BUYER`.
- `ADMIN` and `BROKER` are created with `npm run user:create`. No administrator password is hardcoded in source.
- The JWT issuer is `practicebridge`. The cookie name is `pb_session`. It is HttpOnly, SameSite=Lax, and Secure in production. It expires after 8 hours. The token is not placed in `localStorage` or in the JSON body.
- Each request loads the user from MongoDB. An expired token returns `SESSION_EXPIRED`.
- Sellers can change only their own drafts, rejected listings, and withdrawn listings. Buyers cannot approve listings. Unapproved listings are not returned by the public marketplace.

## 7. Working API endpoints

Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Profile: `PATCH /api/users/me`.

Practices: `GET /api/practices/mine`, `POST /api/practices`, `GET /api/practices/:id`, `PATCH /api/practices/:id`, `POST /api/practices/:id/submit`, `POST /api/practices/:id/withdraw`.

Marketplace: `GET /api/listings`, `GET /api/listings/:id`.

Admin: `GET /api/admin/listings`, `GET /api/admin/listings/:id`, `POST /api/admin/listings/:id/approve`, `POST /api/admin/listings/:id/reject`, `GET /api/admin/users`, `GET /api/admin/inquiries`.

Inquiries: `GET /api/inquiries`, `POST /api/inquiries`, `GET /api/inquiries/:id`, `PATCH /api/inquiries/:id`.

Dashboards: `GET /api/dashboard`. Health: `GET /api/health` (connected or disconnected; the URI is not returned).

Field-level contracts are in `docs/API.md`.

## 8. Completed UI pages

Public: `/`, `/practices`, `/practices/[id]`, `/sign-in`, `/sign-up`.

Seller: overview, my practices, create listing, practice detail, edit, inquiries, profile.

Buyer: overview, explore, inquiries, profile.

Admin: overview, pending and all listings, listing review, users, inquiries, profile.

Broker: `/dashboard/broker` placeholder. No broker CRM.

The design uses deep navy, teal, and a warm neutral background, with one set of form, card, table, and feedback components.

## 9. Tests executed and results

Checked on 9 November 2026:

| Check | Result |
| --- | --- |
| API Vitest suite (`apps/api/src/tests/phase1.test.ts`) | 15 passed, in-memory database, not Atlas |
| Web Vitest suite (`apps/web/src/lib/format.test.ts`) | 3 passed |
| API and web ESLint | Passed |
| API and web TypeScript | Passed |
| API production build | Passed |
| Web production build (Next.js 16.4.5, 23 routes) | Passed |
| `npm run db:check` | Connected to database `ricoz_healthcare` |
| Browser walkthrough | Passed. See section 14. |

The API suite covers registration, duplicate email, rejected administrator self-registration, login, logout, expired session, draft create and edit, cross-seller denial, submit rules, approval authorization, marketplace filters and pagination, hidden unapproved listings, inquiry privacy, rejection and resubmission, and dashboard counts.

Playwright is not installed. A browser end-to-end suite was not run. The critical path was exercised in a browser against the running API and Atlas.

## 10. Known limitations

- Email verification and password reset are not operational. No email service is configured.
- Rate limiting is in-process. It does not coordinate across multiple API instances.
- CSRF protection is the required custom header plus SameSite cookies, not a rotating CSRF token.
- Saved practices were not added. The buyer navigation does not show a control for them.
- The broker area is a placeholder.
- The optional demo seed was not run. `npm run seed` requires `SEED_CONFIRM=yes` and refuses to be the default startup path.
- Browser verification created fictional records in Atlas: Harborlight Family Dental and the seller and buyer accounts listed in `docs/PHASE1_DEMO.md`.
- The MongoDB password was pasted into the chat. Rotate that Atlas password and update `apps/api/.env`. Do not commit `.env`.

## 11. Remaining features

Not built, by design: AI valuation, buyer matching, broker CRM, real-time chat, NDA signing, confidential document rooms, due diligence, negotiation, payments, commission calculation, closing workflows, multi-tenant administration, advanced analytics, automated legal documents, and a mobile app.

## 12. Phase 2 recommendations

1. Add an email provider before promising verification or password reset.
2. Add NDA acknowledgement as its own step, before any document room.
3. Give brokers a real assignment queue only after the review workflow is accepted.
4. Move rate limits and sessions to a shared store only if more than one API process is required.
5. Add Playwright once the team wants a repeatable browser suite. The API workflow test can stay the fast check.

Do not start these until the milestone is reviewed.

## 13. Local setup

Requirements: Node.js 20 or newer.

```powershell
npm install
```

Copy `apps/api/.env.example` to `apps/api/.env` and set `MONGODB_URI` and `JWT_SECRET` (at least 32 characters). Copy `apps/web/.env.example` to `apps/web/.env.local` if `NEXT_PUBLIC_API_URL` should change. The web default is `http://localhost:4000`.

```powershell
npm run db:check
npm run user:create
npm run dev
```

`user:create` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `apps/api/.env` when arguments are omitted. The current administrator is `morgan.ellis@practicebridge.demo`.

Open http://localhost:3000. The API listens on http://localhost:4000.

Other commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## 14. Demo walkthrough

A click-through script is in `docs/PHASE1_DEMO.md`.

Verified in the browser on 9 November 2026, against the live API and `ricoz_healthcare`:

1. Registered seller Elena Vasquez. The session cookie was set and the seller overview showed zeros.
2. Created Harborlight Family Dental (dental, partner retirement, 40%, Portland, Oregon, public asking price) and submitted it. Status history showed Draft, then Pending review.
3. Signed out. Signed in as the administrator. The seller URL was refused with a link back to the administrator dashboard.
4. Approved the listing. It appeared on `/practices` with city, specialty, transaction type, and price, and without the seller’s email.
5. A veterinary category filter returned no listings. Clearing the filter is available on the same page.
6. Registered buyer James Okonkwo and sent an inquiry. The page confirmed the inquiry was open.
7. Signed back in as the seller. Overview counts were 1 practice, 0 drafts, 0 pending, 1 approved, and 1 inquiry. Buyer inquiries showed James Okonkwo’s name, email, and message.
8. At a narrow width the document did not scroll horizontally. At 1280px the desktop navigation was visible and the menu button was not.

One mobile-navigation bug was found and fixed: closing the drawer in the same click as a sidebar link could cancel the route change. The drawer now closes after the path changes.
