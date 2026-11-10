> Historical prototype document. The active multi-specialty implementation and decisions are documented in IMPLEMENTATION.md, AUTHORIZATION.md, API.md and OPERATIONS.md. Conflicting India-only, Redis, token-auth or automated-valuation descriptions below are superseded.

# Database Architecture (MongoDB)

## Core Collections (21 Collections)
1. **users**: Accounts, roles (SA, PA, BM, BR, SE, BU, IN, LA, FA), status, professional details (regNo, council).
2. **organizations**: Practices, buyer groups, brokerage details.
3. **buyerProfiles**: Buyer preferences, cities, budget, size, qualification status.
4. **sellerProfiles**: Seller context, exit timeline, confidentiality defaults.
5. **practices**: Full private practice record (encrypted name, address line, pin).
6. **practiceFinancials**: Per-year financials (revenue, expenses, EBITDA) encrypted with AES-256-GCM.
7. **listings**: Anonymised, approved view (Tier 0 & Tier 1 only).
8. **leads**: CRM entry points, assignment, status, next follow-up.
9. **buyerInterests**: Interests and info requests.
10. **ndaTemplates**: Versioned NDA legal text.
11. **ndaAcceptances**: Proof of acceptance (hash, timestamp, IP).
12. **accessGrants**: Scoped tier permissions with expiry date.
13. **documents**: Metadata, categories, version history, review status.
14. **deals**: 13-stage transaction records with stage history and checklist progress.
15. **pipelineStages**: Configurable stage definitions and gates.
16. **tasks**: Follow-ups and SLA timers.
17. **activities**: Internal notes and communication history.
18. **notifications**: In-app notifications with 180-day TTL.
19. **auditLogs**: Append-only audit trail written by insert-only database role.
20. **refreshTokens**: Rotating session tokens.
21. **verificationRequests**: State Dental Council verification queue.

