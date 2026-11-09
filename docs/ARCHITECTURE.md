# Architecture

PracticeBridge is a two-process monorepo.

```text
apps/web   Next.js App Router, React, TypeScript, Tailwind CSS
apps/api   Express, TypeScript, Mongoose, Zod
```

The browser calls the Express API directly at `NEXT_PUBLIC_API_URL`. Cookies are issued by the API and sent with `credentials: "include"`. CORS allows only `WEB_ORIGIN`.

Next.js does not own the business API. There are no primary Next.js route handlers.

## Request flow

1. A seller, buyer, or administrator signs in.
2. The API checks the password against a bcrypt hash and sets `pb_session`, an HttpOnly JWT cookie that expires after 8 hours.
3. Mutating requests must include `X-PracticeBridge-Request: 1`. Combined with a restricted CORS origin and `SameSite=Lax`, this blocks cross-site form posts.
4. Route middleware loads the user from MongoDB on each authenticated request, so a deleted account cannot keep using an old token.
5. Sellers manage their own practices. Administrators approve or reject submissions. Buyers can only search listings whose status is `APPROVED`.

## Modules

- `auth` — register, login, logout, current user
- `users` — profile updates, never role changes
- `practices` — seller drafts, submission, withdrawal
- `listings` — public approved search
- `inquiries` — buyer introductions and seller status updates
- `admin` — review, users, inquiry oversight
- `dashboard` — counts from MongoDB
- `audit` — best-effort event log for registrations, sign-ins, listing decisions, and inquiries

Privileged `ADMIN` and `BROKER` users are created only by `apps/api/src/scripts/create-privileged-user.ts`. The broker role can sign in and sees a placeholder. It cannot approve listings.

## Later phases

NDA signing, document rooms, negotiation, payments, and broker CRM should be new modules that reuse the user, practice, and inquiry collections. They should not replace the approval rule that keeps unapproved listings out of search.
