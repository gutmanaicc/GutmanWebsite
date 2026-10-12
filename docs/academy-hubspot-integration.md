# Academy HubSpot integration

The owner selected HubSpot Free and authorized the Composio connection. Account access was confirmed active, then the CRM configuration was written and verified through direct HubSpot API reads. No existing customer data was exported, and no contacts or deals were created as test records.

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

Inactive scenario 6607462, `מכללת גוטמן | פניות מהאתר ל־HubSpot`, has an auto-created private webhook. Its structure was learned using one synthetic example.invalid request from an isolated academy VPS job, without running CRM modules or creating a contact. The learned fields are the ten contact properties plus `leadId` and `submittedAt`. The webhook URL is a server credential; never include it in the repository, client bundle, public catalog or logs.

The intended flow is webhook → HubSpot `upsertAContact` → synchronous JSON responder. It updates or creates a contact by email, does not swap the primary email, and does not create an order, deal or email subscription. The responder must return `received:true`, the same persistent `leadId`, the verified portal ID and the saved contact's numeric ID. The server rejects Make's default queue acknowledgment, incomplete results, wrong portal/reference, redirects and timeouts. Uncertain sends are retained privately and never automatically replayed.

Make has no existing HubSpot connection for this module. A credential request restricted to `upsertAContact` was created; the owner only needs to authorize that app in Make, not build a form or scenario. An earlier broader, unused credential request included a developer connection and was superseded before its link was sent to the owner. Do not use it.

`HUBSPOT_LEAD_TRANSPORT=make`, `HUBSPOT_MAKE_WEBHOOK_URL`, `HUBSPOT_PORTAL_ID` and `HUBSPOT_LEADS_ENABLED=1` select the relay. No Composio OAuth credential is exported. Intake stays disabled until the Make HubSpot connection, mapped CRM module and real saved-contact response are verified. Privacy copy identifies Make as the transfer service.

## Original Forms scope limitation

The authorized Composio app can work with CRM objects but `GET https://api.hubapi.com/marketing/v3/forms` returned HTTP 403 for missing Forms scopes. No alternate endpoint was used to bypass that restriction. The owner was asked to create a public HubSpot form and supply its public share link/embed code. No HubSpot API key is requested through chat.

If the form transport is used, the form must declare `firstname`, `lastname`, `email`, `phone` and the six academy fields above. The backend supplies `gutman_lead_stage=new` and `gutman_lead_source=website`; those can be hidden fields. Only email, phone and the visitor's name need be mandatory. Other fields may be blank. No automatic marketing subscription is configured.

Hostinger server variables: `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_ID`, `HUBSPOT_LEADS_ENABLED=1`, and the existing `ACADEMY_PUBLIC_ORIGIN`. Portal/form IDs are public identifiers. SQLite stays in the academy's existing private data volume. The Composio OAuth connection is not exported to the VPS. The normal deployment keeps intake disabled until the target form is provided and verified. No real form submission has been verified yet.

Tests cover the mocked form and Make contracts, bounded abort, wrong portal/reference, queue acknowledgments, optional marketing consent, concurrent retries, persistent acceptance, uncertain failure, invalid data, origin/body limits, standalone Make transport selection, and a browser → actual HTTP API → private SQLite → mocked provider flow. These are not tests of a live HubSpot contact creation.

Morning credentials and merchant verification remain unavailable; HubSpot access does not authenticate Morning. No live checkout links, charges or CRM migration from Fireberry were performed.
