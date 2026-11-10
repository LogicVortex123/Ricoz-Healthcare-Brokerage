> Historical prototype document. The active multi-specialty implementation and decisions are documented in IMPLEMENTATION.md, AUTHORIZATION.md, API.md and OPERATIONS.md. Conflicting India-only, Redis, token-auth or automated-valuation descriptions below are superseded.

# Architectural Decisions (TD-01 to TD-12)

- **TD-01**: pnpm monorepo with shared Zod package for atomic synchronization across web and API.
- **TD-02**: Separate Express API; no Next.js API routes (mandated by stack; keeps security logic out of the web tier).
- **TD-03**: Private object storage with 60-second signed URLs instead of public CDNs.
- **TD-04**: Short-lived access token in Authorization header, rotating refresh token in httpOnly cookie.
- **TD-05**: Anonymised listing stored as its own document so private practice fields can never leak through query mistakes.
- **TD-06**: Application-level encryption (AES-256-GCM) of financials, address, and practice name.
- **TD-07**: 404 instead of 403 for hidden records to avoid revealing the existence of confidential deals.
- **TD-08**: Queue-based malware scanning for uploads before becoming accessible.
- **TD-09**: Clickwrap NDA with stored document hash, timestamp, and IP in MVP.
- **TD-10**: Deterministic matching and valuation formula; no black-box AI in pricing or matching during MVP.
- **TD-11**: Revenue displayed strictly in coarse bands (e.g. ₹50L - ₹1Cr) prior to NDA.
- **TD-12**: Staff MFA required for all brokers, managers, and administrators.

