# Academy HubSpot integration

Website seminar enquiries are connected to HubSpot through the owner's existing Make account. The contact flow is active and verified against the real website and CRM. No existing customer data was exported. One clearly labelled integration-test contact was created, updated and then archived; no orders or deals were created by the tests.

## CRM configuration applied

Contact property group `gutman_academy` (מכללת גוטמן) contains:

| Internal name | Label | Type |
| --- | --- | --- |
| gutman_seminar | סמינר מבוקש | select: social-media-ai / ai-video-content / ai-business-owners |
| gutman_requested_date | מועד מבוקש | text, ISO date |
| gutman_lead_stage | סטטוס הפנייה | new / contacted / interested / payment_pending / registered / closed |
| gutman_lead_source | מקור הפנייה | text |
| gutman_marketing_consent | אישור לקבלת עדכונים | yes / no, separate from native subscriptions |
| gutman_note | פרטי הפנייה | multiline text |

The pre-existing default deal pipeline had no active deals during inspection. Its display name is now `מכללת גוטמן | פניות והרשמות`; stage IDs and existing metadata are preserved. Labels: ליד חדש, יצרנו קשר, מתעניין, מתאים לסמינר, ממתין לתשלום, נרשם, לא ממשיך. A deal stage is an operator's CRM record, not proof of a payment or an academy seat. No automatic paid enrollment is inferred from HubSpot.

The contact-property listing tool with `custom_only=true` omitted these properties; each property was instead verified by its exact internal name through the documented CRM property endpoint. Two stage labels needed sequential correction after the initial parallel edits. Final direct reads confirmed all six fields and all seven stage labels.

## Website intake

`POST /api/academy/leads` is origin checked, body bounded and rate limited. Its idempotency key prevents repeated forwarding. A separate private SQLite file under `/data` stores the normalized enquiry before forwarding. File permissions are 600. Accepted responses survive restart; uncertain or interrupted sends cannot be automatically replayed. Public responses expose only acceptance and a random local enquiry ID, never contact data or provider diagnostics. No public enquiry-read endpoint exists.

`HubSpotFormAdapter` submits only the declared fields to HubSpot's public forms endpoint. It sends no OAuth key, browser cookie, visitor tracking ID or IP address. It requires exact portal/form IDs and an HTTPS website origin. A timeout, redirect, rejected HTTP response or unconfirmed body produces no success message. A HubSpot form acceptance does not create an academy order, paid registration or deal.

The Hebrew enquiry form appears on seminar detail pages only when the catalog reports intake configured. Marketing is optional and unchecked. The visitor receives a success message only after provider acceptance; an enquiry does not reserve a seat. Privacy copy identifies HubSpot and the site's server as enquiry storage.

## Make relay selected after owner feedback

The owner asked the agent to build everything and declined manual form creation. The form route remains available, but it is no longer the requested setup path. The agent found the existing Make organization `GutmanAI` (6526374), team 1861372, in `us2.make.com`. Both listed Make connections reach this same organization and team; the first connection is used for this work.

Active scenario 6607462, `מכללת גוטמן | פניות מהאתר ל־HubSpot`, has an auto-created private webhook. Its structure was learned without running CRM modules. The learned fields are the ten contact properties plus `leadId` and `submittedAt`. The webhook URL is a server credential; never include it in the repository, client bundle, public catalog or logs. Manage the flow at https://us2.make.com/1861372/scenarios/6607462.

The live flow is webhook → HubSpot `upsertAContact` → read back the saved contact by its numeric ID → synchronous JSON responder. Reading by numeric ID avoids email-path encoding problems with plus-addresses. The responder is gated by the saved email, seminar, source and marketing preference matching the enquiry. It returns `received:true`, the same persistent `leadId`, the verified portal ID and the saved contact's numeric ID. The server rejects Make's default queue acknowledgment, incomplete results, wrong portal/reference, redirects and timeouts. Uncertain sends are retained privately and never automatically replayed.

The flow updates or creates a contact by email and does not swap the primary email. Repeated enquiries from the same email update the latest request fields, including `gutman_lead_stage=new` and the latest note. It does not create an order, deal or native email subscription. Optional marketing consent describes the latest enquiry; it does not overwrite HubSpot's native subscription preferences.

Make connection 11661816 is verified healthy and used by the CRM modules. Its `/integrations/v1/me` response confirmed portal 149533496. The credential-request status remained `incomplete` despite this working connection, so the actual connection, account response and successful operations were used to verify access. Read-only account-verification scenario 6607608 is inactive after verification.

`HUBSPOT_LEAD_TRANSPORT=make`, `HUBSPOT_MAKE_WEBHOOK_URL`, `HUBSPOT_PORTAL_ID` and `HUBSPOT_LEADS_ENABLED=1` select the relay. These settings are active on Hostinger project `gutman-academy-preview`, using runtime image `gutman-academy-preview:61668df1e0fa`. The catalog reports `leads.ready=true`, which shows the enquiry form on all three seminar pages. No Composio OAuth credential is exported. Privacy copy identifies Make as the transfer service.

## Original Forms scope limitation

The Composio CRM connection lacks Forms scopes: `GET https://api.hubapi.com/marketing/v3/forms` returned HTTP 403. No alternate form-administration endpoint bypasses that restriction. The active Make contact flow needs no HubSpot marketing form and no manual form creation.

If the form transport is used, the form must declare `firstname`, `lastname`, `email`, `phone` and the six academy fields above. The backend supplies `gutman_lead_stage=new` and `gutman_lead_source=website`; those can be hidden fields. Only email, phone and the visitor's name need be mandatory. Other fields may be blank. No automatic marketing subscription is configured.

For the optional form transport, server variables are `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_ID`, `HUBSPOT_LEAD_TRANSPORT=form`, `HUBSPOT_LEADS_ENABLED=1` and the existing `ACADEMY_PUBLIC_ORIGIN`. This transport was tested with mocks and is not the active deployment. SQLite stays in the academy's existing private data volume.

## Verification

Seven automated tests cover the mocked form and Make contracts, bounded abort, wrong portal/reference, queue acknowledgments, optional marketing consent, concurrent retries, persistent acceptance, uncertain failure, invalid data, origin/body limits and standalone Make transport selection. The existing browser test also verifies form submission through a real HTTP API and private SQLite with a mocked provider.

Live checks verified the Make relay and then the public HTTPS website → API → private SQLite → Make → HubSpot → response flow for all three seminar types. Each first request and identical retry returned HTTP 200 and the same local enquiry ID. Exactly three additional successful Make runs occurred, rather than six, and the CRM had only one test contact for the shared test email. Read-back confirmed contact details, seminar, `website` source, `new` stage, note and `no` marketing consent. The test contact was archived after verification; labelled private test receipts remain for audit. No payments, registrations or subscription messages were initiated.

HubSpot rejects `.invalid` email domains, so the live CRM test used a plus-address alias of the owner's account after confirming it was not an existing contact. The initial rejected domain created no contact. A later read-back failure was investigated and the saved contact verified before a new controlled test was sent; no uncertain request was automatically replayed. Temporary VPS checks were removed without touching the live application image or persistent data/media volumes.

Morning credentials and merchant verification remain unavailable; HubSpot access does not authenticate Morning. No live checkout links, charges or CRM migration from Fireberry were performed.
