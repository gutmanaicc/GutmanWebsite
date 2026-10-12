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

## Actual remaining account requirement

The authorized Composio app can work with CRM objects but `GET https://api.hubapi.com/marketing/v3/forms` returned HTTP 403 for missing Forms scopes. No alternate endpoint was used to bypass that restriction. The owner was asked to create a public HubSpot form and supply its public share link/embed code. No HubSpot API key is requested through chat.

The form must declare `firstname`, `lastname`, `email`, `phone` and the six academy fields above. The backend supplies `gutman_lead_stage=new` and `gutman_lead_source=website`; those can be hidden fields. Only email, phone and the visitor's name need be mandatory. Other fields may be blank. No automatic marketing subscription is configured.

Hostinger server variables: `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_ID`, `HUBSPOT_LEADS_ENABLED=1`, and the existing `ACADEMY_PUBLIC_ORIGIN`. Portal/form IDs are public identifiers. SQLite stays in the academy's existing private data volume. The Composio OAuth connection is not exported to the VPS. The normal deployment keeps intake disabled until the target form is provided and verified. No real form submission has been verified yet.

Tests cover the mocked form contract, optional marketing consent, concurrent retries, persistent acceptance, uncertain failure, invalid data, origin/body limits, and a browser → actual HTTP API → private SQLite → mocked provider flow. These are not tests of the owner's live HubSpot form.

Morning credentials and merchant verification remain unavailable; HubSpot access does not authenticate Morning. No live checkout links, charges or CRM migration from Fireberry were performed.
