# Implemented REST contract

Source of request validation: `apps/api/src/platform/contracts.ts` and each Express route module. All command objects are strict Zod schemas; unknown fields fail validation. API documentation must be updated with route changes. The Next application has no business API handlers; retained prototype handlers return 410.

Prefix: `/api/v1`. Responses: `{success:true,data,requestId}` or `{success:false,error:{message,fields?},requestId}`. Statuses: 401 unauthenticated, 403 action denied, 404 inaccessible/missing record, 409 conflict/stale state, 422 validation/gate, 429 rate limit, 503 dependency unavailable. All responses are no-store. Mutations use `X-CSRF-Token` from account/login. Critical commands also require `Idempotency-Key` (8–100 alphanumeric/underscore/hyphen); keys bind actor/action/resource and canonical request hash. An identical retry returns its persisted result; different payload reuse conflicts.

| Module | Routes |
|---|---|
| Public | GET health, ready, listings, listings/:id |
| Auth | POST auth/register, auth/verify, auth/resend-verification, auth/login, auth/recovery, auth/reset, auth/logout |
| Auth configuration | GET auth/config returns mode, verification/MFA prerequisites and signup password minimum |
| Account | GET/PATCH account; POST account/deletion-request, account/mfa/setup, account/mfa/confirm |
| Memberships | GET/POST memberships, organizations; POST users/:id/suspend; POST invitations, invitations/accept |
| Intake | GET brokerages; GET/POST practices; GET practices/:id; POST practices/:id/assign, practices/:id/listing |
| Ownership | GET/POST practices/:id/ownership; POST deals/:id/proposal |
| Discovery | POST listings/:id/interests; GET interests; POST interests/:id/qualification, practices/:id/qualification |
| Confidentiality | GET agreement; POST practices/:id/nda; GET practices/:id/access, practices/:id/grants, practices/:id/nda-records; POST practices/:id/grants, grants/:id/revoke |
| Files | GET/POST practices/:id/documents; PUT documents/:id/content; POST documents/:id/scan, documents/:id/release, documents/:id/retention; GET documents/:id/download; DELETE documents/:id |
| CRM | GET leads; POST leads/:id/notes |
| Deals | GET/POST deals; GET deals/:id; POST deals/:id/stage, deals/:id/close |
| Offers | GET deals/:id/offers; POST deals/:id/offers, offers/:id/counter, offers/:id/decision |
| Diligence | POST deals/:id/diligence/:itemId |
| Tasks | GET deals/:id/tasks; POST deals/:id/tasks, tasks/:id/complete |
| Operations | GET metrics, audit, notifications; POST notifications/:id/read |
| Human valuation | GET valuations, valuations/:id; POST practices/:id/valuation, valuations/:id/review. GET valuations accepts optional practiceId and status filters within the caller scope. Review is human-only: start inReview, decline, or publish reported with a released owner/participant valuation document. No automated estimates. |

GET listings accepts category/country, sort=oldest|newest, limit=1..50, cursor=ObjectId. Practices and audit accept cursor/limit. Other paginated collection APIs accept cursor/limit/sort and return arrays in `data` with envelope-level `pagination:{nextCursor,limit}`. Listings/practices/audit return `data:{items,nextCursor}`. Public teasers never include practice IDs, identity, raw finances or document metadata. Some detail summaries are bounded recent records; use the subresource APIs for full histories.

Practice creation body is `{brokerageId,intake}`. Intake is category-discriminated: common private identity, location, financial periods in integer minor units/currency, facility/staff/equipment, transition reason/purpose/legalStructure/timeline; dental adds operatories/specialty; veterinary adds species/services; specialistMedical adds specialty/consultationFacilities/procedureFacilities. Ownership uses 10,000 basis points as 100%, independent legal owner IDs, and reviewed evidence.

Deal creation body is `{practiceId,purpose,legalStructure,participants:[{userId,capacity,authorityDocumentId}],reason}`. Participant membership is bound by the server. Submitted offer terms cannot be edited; previousId creates a revision. Stage changes require `{stage,revision,reason}`. Closing requires `{baselineId,evidenceDocumentId,reason}` and an idempotency key. Asset closing never changes legal entity ownership. Equity closing applies exactly one evidence-backed baseline proposal transactionally. Handover completion is a separate guarded stage.

JWT authentication: access is a 15-minute HttpOnly host-only SameSite=Lax cookie; refresh is an opaque HttpOnly cookie restricted to /api/v1/auth. POST /api/v1/auth/refresh accepts an empty JSON object and requires the configured WEB_ORIGIN; it rotates both credentials and returns a new CSRF token. Bearer access JWTs are also supported. Current MongoDB session, account and membership checks remain mandatory.

