# Database

Connection: `MONGODB_URI` in `apps/api/.env`.

Database name: `ricoz_healthcare`. The API sets this name explicitly and does not log the connection string.

Tests use `mongodb-memory-server` and never connect to Atlas.

## Collections

### users

- `name`, `email` (unique, lowercase), `passwordHash` (bcrypt, not returned by queries unless selected)
- `role`: `SELLER`, `BUYER`, `ADMIN`, `BROKER`
- Optional profile: `phone`, `organization`, `city`, `state`, `bio`

Plaintext passwords are not stored.

### practices

One document is both the seller’s practice record and its marketplace listing.

- Identity: `ownerId`, `name`, `category`, `specialty`
- Place and facility: `city`, `state`, `description`, `yearsInOperation`, `practitionerCount`, `facilityInfo`
- Transition: `ownershipType`, `transactionType`, `ownershipPercentage`, `askingPrice`, `priceVisibility`, `transitionReason`
- Review: `status`, `rejectionReason`, `submittedAt`, `reviewedAt`, `reviewedBy`, `statusHistory`
- `seedKey`: optional unique key used only by the opt-in demo seed

Indexes cover owner plus status, public status plus review date, category and state, and the sparse seed key.

### inquiries

- `practiceId`, `buyerId`, `sellerId`, `message`, `status`
- A partial unique index allows only one `OPEN` or `ACKNOWLEDGED` inquiry for the same buyer and practice.

### auditevents

- `actorId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`
- Audit writes are best-effort. A logging failure does not roll back the user action, and the error is redacted before it is printed.

## Data that is intentionally absent

The milestone does not store street addresses, patient records, clinical files, NDAs, or payment details.
