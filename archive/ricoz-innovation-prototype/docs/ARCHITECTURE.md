> Historical prototype document. The active multi-specialty implementation and decisions are documented in IMPLEMENTATION.md, AUTHORIZATION.md, API.md and OPERATIONS.md. Conflicting India-only, Redis, token-auth or automated-valuation descriptions below are superseded.

# System Architecture

## Overview
The Dental Practice Transition Brokerage Platform is an India-first broker-led transaction system. It pairs confidential discovery with a managed deal workspace.

```mermaid
flowchart LR
U["Browser: seller, buyer, broker, admin"] -->|HTTPS| W["Next.js web app"]
W -->|"REST /api/v1 + access token"| A["Express API"]
A --> P["Policy layer: role, ownership, grant"]
A --> M[("MongoDB replica set")]
A --> R[("Redis")]
R --> J["Job worker: malware scan, email, reminders"]
A -->|"60 s signed URL"| S[("Private object storage")]
U -->|"download via signed URL"| S
J --> S
J --> E["Email provider"]
A --> L["Logs and error tracking"]
```

## Disclosure Workflow
```mermaid
flowchart TD
A["Buyer sees Tier 0-1 listing"] --> B["Buyer expresses interest"]
B --> C{"Profile complete and broker-qualified?"}
C -- No --> C1["Broker qualifies or declines with note"]
C1 --> C
C -- Yes --> D["Buyer accepts current NDA version"]
D --> E["Broker reviews access request"]
E --> F{"Seller veto?"}
F -- Yes --> G["Request rejected, buyer notified"]
F -- No --> H["Grant created with scope and expiry"]
H --> I["Tier 2 fields and approved documents visible"]
I --> J["Every view and download logged"]
I --> K{"Expired or revoked?"}
K -- Yes --> L["Access removed on next request"]
```

## Transaction Lifecycle (13 Stages)
1. New Lead
2. Buyer Qualified
3. NDA Acceptance
4. Information Disclosure
5. Due Diligence (Hard Gate: Checklist completion required)
6. Initial Offer
7. Negotiation
8. Letter of Intent
9. Legal Review
10. Final Agreement
11. Closing
12. Ownership Transition
13. Post-Sale Handover
Terminal: Lost, Withdrawn.

