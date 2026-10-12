# October 2026 owner schedule and integrations

The owner selected HubSpot Free as the replacement for Fireberry on 12 October 2026. HubSpot authorization has been initiated; it is not yet connected to the website, and no contacts have been exported or imported. The private authorization URL is not stored in Git.

The owner supplied six separate seminar dates, with the existing format, prices and group sizes:

| Seminar | Dates | Hours (Asia/Jerusalem) |
| --- | --- | --- |
| Social media | 22 and 29 October 2026 | 15:00 to 20:00 |
| Video content | 20 and 27 October 2026 | 15:00 to 20:00 |
| Business owners | 21 and 28 October 2026 | 15:00 to 20:00 |

Each is a five-hour seminar for 8 to 12 participants, launch price ILS 1,190. This interpretation was stated to the owner. The existing SOK Rishon LeZion venue is marked proposed; confirmation and arrival details were requested. The date migration keeps these records private and does not mark venue checks or purchasing terms approved. Public checkout remains disabled until real provider credentials and required details are available.

`server/owner-schedule.mjs` applies exactly the six entries from `shared/academy-owner-schedule.json` in one SQLite transaction. It adjusts existing unpublished, unreserved October drafts and creates missing dates. It preserves unrelated November drafts, refuses published or reserved targets, and is idempotent. The command `node scripts/academy-owner-schedule.mjs` is read-only by default; `--apply` requires an explicit persistent `ACADEMY_DB_PATH`. No customer records or credentials are logged.

Morning uses API ID and secret on the server to authenticate payment-form requests. Those values were absent from the live Hostinger environment during inspection. The cloud execution environment cannot read the owner's macOS Keychain. Keeping a key in Keychain does not authorize the remote server. The owner authorized connection work but requested an explanation of security; no promise of absolute security was made, and no credential was transferred or exposed.
