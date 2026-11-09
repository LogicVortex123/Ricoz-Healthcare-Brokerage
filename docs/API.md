# API

Base URL: `http://localhost:4000`

Successful responses use `{ data, meta? }`. Errors use `{ error: { code, message, details? } }`.

State-changing requests require header `X-PracticeBridge-Request: 1`. Authenticated requests send the `pb_session` cookie. The JSON body never includes the JWT or a password hash.

## Auth

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create a `SELLER` or `BUYER`. `ADMIN` and `BROKER` are rejected. |
| POST | `/api/auth/login` | Public | Set the session cookie. |
| POST | `/api/auth/logout` | Public | Clear the session cookie. |
| GET | `/api/auth/me` | Signed in | Current user. |

Registration and login are limited to 10 attempts per 15 minutes outside the test environment.

## Profile

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| PATCH | `/api/users/me` | Signed in | Update name, phone, organization, city, state, and introduction. Email and role stay unchanged. |

## Seller practices

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/practices/mine` | Seller | Own practices. Optional `status`. |
| POST | `/api/practices` | Seller | Save a draft. Name and category are required. |
| GET | `/api/practices/:id` | Owner | Private practice record. |
| PATCH | `/api/practices/:id` | Owner | Edit a draft, rejected, or withdrawn practice. |
| POST | `/api/practices/:id/submit` | Owner | Move a complete listing to `PENDING_REVIEW`. |
| POST | `/api/practices/:id/withdraw` | Owner | Withdraw a pending or approved listing. |

A seller who does not own the record receives 403. Pending and approved records cannot be edited until they are withdrawn.

Partial buyouts and partner retirements require `ownershipPercentage` from 1 to 99. A public price requires `askingPrice`. `ON_REQUEST` hides the price from buyers even if a number is stored.

## Marketplace

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/listings` | Public | Approved listings only. |
| GET | `/api/listings/:id` | Public | One approved listing, or 404. |

Query parameters: `q`, `category`, `specialty`, `state`, `city`, `minPrice`, `maxPrice`, `sort` (`newest`, `name`, `price_asc`, `price_desc`), `page`, `limit` (max 24).

Public records omit the owner’s email, phone, rejection notes, and street address. The city and region are the location fields.

## Inquiries

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/inquiries` | Buyer, seller, admin | Inquiries visible to that role. Optional `practiceId`. |
| POST | `/api/inquiries` | Buyer | Inquire on an approved listing. |
| GET | `/api/inquiries/:id` | Participant or admin | One inquiry. |
| PATCH | `/api/inquiries/:id` | Seller | Set `ACKNOWLEDGED` or `CLOSED`. |

A buyer can have one `OPEN` or `ACKNOWLEDGED` inquiry per practice. The seller receives the buyer’s name, email, organization, phone, city, and region. The buyer does not receive the seller’s email.

## Administration and dashboard

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/listings` | Admin | Filter by `status`, with pagination. |
| GET | `/api/admin/listings/:id` | Admin | Full listing and seller contact. |
| POST | `/api/admin/listings/:id/approve` | Admin | Approve a pending listing. |
| POST | `/api/admin/listings/:id/reject` | Admin | Reject with a reason of at least 10 characters. |
| GET | `/api/admin/users` | Admin | Accounts without password hashes. |
| GET | `/api/admin/inquiries` | Admin | Inquiry activity, including both parties. |
| GET | `/api/dashboard` | Signed in | Counts for the signed-in role. |
| GET | `/api/health` | Public | Process and database connectivity. No credentials. |

Listing status values: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN`.

Inquiry status values: `OPEN`, `ACKNOWLEDGED`, `CLOSED`.
