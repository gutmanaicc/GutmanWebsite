# Morning account and checkout verification

**Release update, 2026-10-13:** the owner approved these terms and opening purchases. Morning checkout is active for the six exact October dates. See `academy-launch-approval.md`; the pending-approval paragraphs below record the earlier verification stage.

The owner saved `MORNING_API_ID` and `MORNING_API_SECRET` on the academy Hostinger project. Authentication succeeded against the official production token endpoint. The merchant's legal identity, single-business ownership and VAT-exempt classification were verified inside the owner's VPS; identities, tokens and raw account payloads were not exported.

## Actual payment configuration

The business has one active payment plugin supporting card group 100 and ILS. Omitting its ID caused a definitive HTTP400 / error2600 rejection. Explicit selection of this existing plugin returned HTTP201, `success=true`, `errorCode=0`, and a payment page responding HTTP200. The probe was ILS1,190, receipt400, one payment, no added VAT. No card was supplied and no charge occurred.

`/data/morning-merchant.json` in the existing private academy volume stores the verified business identity, selected plugin and observed HTTPS checkout origin. Permissions are600. Verification is bound to a SHA256 digest of the exact API ID, expires after31 days for startup validation, and rejects symlinks, insecure permissions, malformed origins or a different API ID. This file, its temporary diagnostics and probe links must never be copied to Git, public assets or external workbench output.

The standalone runtime loads this state locally. It uses the selected plugin explicitly because this merchant has no working default. Public readiness exposes booleans only; it never exposes the legal identity, plugin ID, authentication values or private probe URL. Before using the configuration after its verification window, repeat the read-only merchant/plugin checks on the VPS and update the private verification timestamp only on success. A future tax classification change needs the central tax configuration and receipt matching reviewed before sales resume.

The notify callback is only a wakeup for a server-authenticated document lookup. Callback fields and browser redirects cannot mark an order paid. An optional HMAC utility remains available, but its unused secret is no longer a prerequisite for this lookup-based callback flow.

## Terms and release gate

The owner's master prompt requires revised legal drafts for owner/legal approval, forbids checkout using unapproved cancellation terms and forbids activating unapproved dates. `/booking-terms` contains a clearly labelled proposed policy: full refund up to48 hours before the seminar; statutory cancellation rights preserved afterward; full refund if the college cancels, including insufficient enrollment; a substitute date is optional. This proposal is not an approved binding policy.

Checkout links separately to booking/cancellation terms and privacy. Until approval, `ACADEMY_BOOKING_TERMS_APPROVED=0` and the six owner-specified October dates remain private drafts. The payment implementation can be verified with isolated test data and uncharged forms without opening customer purchases or modifying the owner's live dates. The production domain remains unchanged; this is the Hostinger preview and GitHub feature branch.

## Checks

Automated checks cover selected plugin forwarding, private identity binding, permissions, staleness, origin validation, callback/redirect forgery, checkout idempotency, verified receipt matching and HubSpot intake regression. Browser checks cover hosted checkout, the separate draft/approved terms view, responsive pages and accessibility.

Live account and form probes passed. The deployed runtime was then tested through its real HTTP checkout API in an isolated private fixture, using temporary future test dates rather than the owner's live database. All three seminar types returned HTTP201, real payment pages returned HTTP200, duplicate requests reused one order and link, and exactly three supplier form requests were made. Forged paid notifications triggered real authenticated document searches, left orders pending and created no registrations. Test emails were removed from supplier requests. No card was supplied, no charge occurred and the owner's live dates were not modified.

An actual card charge has not been tested. Customer registrations are never fabricated from a link, a page load or a redirect. HubSpot enquiries remain a separate active integration.

Payment form line items and remarks now include the actual seminar, date, hours, venue and minimum enrollment, while the document header keeps the exact unique order reference required for reconciliation. Morning can email the payment/accounting document to the customer's checkout email. The separate preparation/reminder email service is not enabled: its transactional sender and delivery credentials remain unconfigured. Do not describe scheduled service emails as delivered or active.
