# Academy — חיבור ענן

המשך העבודה הוא בענן, בענף `feature/gutman-academy-seminars-v2`, בפרויקט Vercel `gutmanai/ai-workshop-landing`. דומייני הייצור אינם משתנים. אישור ליצירת קישורי תשלום אינו אישור לפרסם מועדי טיוטה או לחייב לקוחות בבדיקות.

## הרשאות החשבון הדרושות

1. שמירת `MORNING_API_ID` ו־`MORNING_API_SECRET` כמשתני שרת מוצפנים ב־Preview של הענף בלבד דרך [הגדרות הפרויקט](https://vercel.com/gutmanai/ai-workshop-landing/settings/environment-variables). אין להעביר ערכים בצ׳אט. Chrome הפרטי ו־Keychain של Mac אינם נגישים לסביבת הענן.
2. יצירת private Blob בצוות GutmanAI וחיבורו לפרויקט Preview. פעולת היצירה דרך החיבור הקיים החזירה403; נדרשת הרשאת החשבון או יצירה דרך [Storage](https://vercel.com/gutmanai/~/stores). החיבור צריך לספק token פרטי או storeID עם OIDC מורשה.
3. הגדרת סודות קבועים נפרדים: `ACADEMY_STORAGE_SECRET`, `ACADEMY_ORDER_SECRET`, `ACADEMY_ADMIN_TOKEN`, כל אחד לפחות32 תווים, מחוץ ל־Git. אין לשנות סוד הצפנה בלי תוכנית העברת הנתונים.

## הגדרת השרת

| משתנה | ערך/משמעות |
|---|---|
| `ACADEMY_STORAGE_ENABLED` | `1` רק אחרי שהאחסון הפרטי מחובר |
| `ACADEMY_BLOB_PATH` | `academy/preview/commerce-v1.json`; namespace ייצור נפרד |
| `ACADEMY_PUBLIC_ORIGIN` | כתובתHTTPS מדויקת של תצוגת הענף; כתובת return ו־notify |
| `ACADEMY_ALLOWED_ORIGINS` | origins מדויקים, מופרדים בפסיק |
| `ACADEMY_PAYMENT_MODE` | `disabled` עד אימות; אחריו `morning` |
| `MORNING_ENVIRONMENT` | `sandbox` לבדיקות הרשמיות, `production` לחשבון החי |
| `MORNING_BUSINESS_TAX_ID` | מספר העסק המאומת של הבעלים |
| `MORNING_CHECKOUT_ORIGINS` | originsHTTPS שאומתו מטופס אמיתי של החשבון, ללא wildcard |
| `MORNING_WEBHOOK_SECRET` | סוד Webhook קבוע, לפחות32 תווים |
| `MORNING_MERCHANT_VERIFIED` | `0` עד אימות העסק/עוסק פטור/קבלה/סליקה; `1` רק אחריו |
| `ACADEMY_BOOKING_TERMS_APPROVED` | `0` עד אישור תנאים; `1` רק אחריו |

לאחר שינויי משתנים יש לבנות deployment חדש של אותו ענף. אין להגדיר אף משתנה סודי עם קידומת `VITE_`.

## בדיקת חשבון והפעלה

לבדוק OAuth, עסק ומעמד מס, יצירת טופס, מחיר וקופון, callback, קבלה ותשלום תואמים, אירוע כפול, תפוגת מושב ותשלום מאוחר. לא לחייב לקוחות בבדיקות. המפרט אינו מבטיח תפוגת טופס או single-use: תשלום מאוחר יועבר לבדיקה/החזר ידני ללא הרשמה. החזרים אמיתיים אינם ממומשים.

עשרת המועדים נשארים טיוטות. רק מנהל יכול לאשר מועד אחרי בדיקת מקום, חגים והתחייבויות. יצירת שלושה קישורים כלליים אינה מסיימת את מנגנון הקיבולת והקופונים: האתר יוצר טופס המתאים להזמנה ספציפית.

מנגנון הודעות השירות ממומש עם `DurableOutboxWorker` ו־`ResendDeliveryAdapter`: claim מתמשך, payload קבוע ומפתח idempotency של הספק, עד8 ניסיונות. אחרי חלון הבטיחות של24 שעות פחות5 דקות, תוצאה עמומה מועברת לבדיקה ואין שליחה אוטומטית נוספת. הספק מאשר קבלת הבקשה; אין בכך הוכחת מסירה לנמען.

להפעלה נדרשים `ACADEMY_EMAIL_FROM`, `ACADEMY_EMAIL_DELIVERY_ENABLED=1`, `ACADEMY_EMAIL_SENDER_VERIFIED=1`, `ACADEMY_EMAIL_APPROVED_KINDS` מתוך `confirmation,preparation,reminder,followup`, ומפתח Resend הקיים. כל ההודעות חסומות עד ההגדרה והאישור. בממשק ניהול מופיע כפתור שליחת הודעות שהגיע מועדן. למתזמן מורשה: `POST /api/academy/admin/outbox/drain` עם Bearer מנהל ו־`{limit:20}`; פרטי המתזמן נשמרים כסודות שירות. לא הוגדר מתזמן חי.

CRM ואירועי בדיקה פרטיים אינם נשלחים דרך Resend. חיבור CRM להרשמות מחייב מיפוי מאומת ומניעת כפל; הוא עדיין חסום. אחסון פרטי, אימות Morning, אימות מסירה, מתזמן וניטור נדרשים לפני הצהרה על מערכת שעובדת מקצה לקצה.

מקור חוזה הספק: [Morning OpenAPI2.0.0](https://developers.morning.co/docs/openapi.bundled.json). הבדיקות האוטומטיות משתמשות בספק ואחסון מדומים; אינן בדיקת sandbox רשמית.
