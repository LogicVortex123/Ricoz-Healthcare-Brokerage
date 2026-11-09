# Phase 1 demo

Use two browsers, or one normal window and one private window, so the seller and buyer sessions stay separate. The administrator can use a third session.

The administrator created for local demonstration is `morgan.ellis@practicebridge.demo`. The password is `ADMIN_PASSWORD` in `apps/api/.env`. It is not written in this document.

These fictional accounts are already in the database from the milestone check:

- Seller: `elena.vasquez.demo@example.com` / `Sellerpass123`. Practice: Harborlight Family Dental, approved, Portland, Oregon.
- Buyer: `james.okonkwo.demo@example.com` / `Buyerpass123`. One open inquiry on that practice.

You can also register new accounts. The steps below do not depend on the accounts above.

## Path

1. Open http://localhost:3000.
2. Choose **List your practice** and register as a seller.
3. Sign in. The seller overview starts at zero because the counts come from the database.
4. Open **Create listing**. Enter a dental, veterinary, or specialist medical practice. Save a draft, then submit it.
5. Sign out. Sign in as the administrator.
6. Open **Pending listings**, review the submission, and approve it. To see the correction loop, reject a second listing with a reason, then sign back in as the seller, edit it, and submit it again.
7. Register a buyer from **Create a buyer account**, or use a second browser.
8. Open **Explore practices**. The new listing appears. Drafts and pending listings do not.
9. Open the listing and send an inquiry of at least 20 characters.
10. Return to the seller account. **Buyer inquiries** shows the buyer’s name and email, and the overview inquiry count has increased.
11. Acknowledge or close the inquiry. The buyer sees the new status under **My inquiries**.

## What this demo does not include

Email verification, password reset, NDA signing, document rooms, negotiation, payments, and broker CRM are not part of this milestone. Password recovery is documented as unavailable because no email service is connected.

Do not enter real patient information in a description or inquiry.
