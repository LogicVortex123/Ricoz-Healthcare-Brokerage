# Authorization policy

## Temporary local authentication simplification

At the user's request, `DEV_SIMPLE_AUTH=true` in an explicit development/test environment enables password-only local authentication. Registration (seller/buyer only) signs the user in immediately; verification and staff MFA are deferred locally. Development-created identities carry `developmentVerification=true`; the public profile does not present their email as actually verified. Sessions carry `authMode=developmentSimple` and become invalid when the flag is disabled. Production ignores this mode and remains blocked by the existing production-readiness guard. Password hashing, HttpOnly JWT access and opaque refresh cookies, CSRF, suspension, active memberships and all resource/disclosure policies remain enforced. Set the flag to false to restore the strict flow below; development-created users must then verify their email through the existing token workflow.

## Standard authentication and resource policies

Express verifies a 15-minute HS256 JWT (issuer, audience, expiry and algorithm), checks its hashed MongoDB session record, then loads the current user and active memberships on every protected request. Roles are never trusted from token claims. An eight-hour absolute session uses a rotating opaque refresh cookie; POST /api/v1/auth/refresh requires the configured same-origin Origin. Replayed refresh credentials revoke the session after a short concurrency grace period. Logout and suspension revoke access immediately. Tokens never enter localStorage. Suspended/unverified accounts and expired sessions are rejected. Mutations require the session CSRF token. Browser requests with an unexpected Origin are rejected. Staff sessions cannot access business endpoints until MFA is verified. Public registration accepts only seller/buyer capacity.

Practice access: the owner with a current seller membership; a manager in that brokerage; or its assigned broker with a current broker membership. Super administration does not confer this access. A seller cannot select another owner ID during intake. Reassignment updates practice, deal and lead assignments transactionally.

Deal access additionally permits explicit active named participants whose recorded membership remains active. Organization membership without named participation is insufficient. Partner capacities live on deal participants, not global user roles. Participant lists/counts use the same membership binding as details. Super administrators see only administrative audit categories unless separately assigned a business membership.

Confidential participant access is the intersection of: active authenticated identity/membership; named active deal participation; noncancelled deal; current approved opportunity qualification; acceptance of current configured agreement version/hash; named unrevoked unexpired scope grant; and resource policy. Conditions are re-evaluated at use time, not only at grant issuance. NDA alone never unlocks identity or files. Private partner qualification can be recorded without any listing.

Disclosure scopes are `identity`, `financials`, `upload`, and `document:<id>`. Identity grants do not automatically expose raw financial periods. Only released participant-classified files can be granted. Internal files are limited to assigned staff, including against practice owners. Documents are downloaded through Express after authorization and integrity checks, with no public URLs or keys in DTOs. Quarantined/rejected/clean-but-unreleased files cannot be downloaded. Participant uploads require a current upload grant.

Lead internal notes have a separate staff-only API. Participant deal responses omit other buyers' offers and ownership proposals. Public listing DTOs contain only the separate approved teaser. Metrics derive exclusively from visible practice/deal IDs; overdue means dueAt < current UTC time and not done. Active deals exclude completed/cancelled, including closed deals awaiting handover. Closed awaiting handover counts exactly closed/handover stages.

Audit has no update/delete API. Production needs an insert-only audit database role or separate write credential and protected backups to enforce immutability against database operators. The local development MongoDB account is intentionally not a production security boundary.

