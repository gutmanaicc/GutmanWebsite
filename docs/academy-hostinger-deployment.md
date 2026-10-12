# פריסה עצמאית ל־Hostinger VPS — חבילת Preview מוכנה

היעד: שרת ה־KVM2 הקיים, Ubuntu 24 ו־Docker/Traefik. קובצי הפריסה אינם משנים DNS, אינם מחליפים את האתר ב־Vercel ואינם נוגעים בקונטיינרים/נפחים קיימים. גישה מאומתת ל־Docker Manager דרך Hostinger `proxy_execute` נמצאה. נבדקו הגדרות Traefik הקיימות: `network_mode: host`, כניסת `websecure` ו־resolver בשם `letsencrypt`. שם ה־Preview המתוכנן `academy-preview.srv1942778.hstgr.cloud` פותר ל־VPS ב־76.13.37.15. גילוי הגישה וה־DNS אינו הוכחה שהאפליקציה כבר נפרסה או שהתעודה שלה הונפקה.

## מה החבילה מריצה

קונטיינר Node24 אחד מגיש את React/Vite שנבנה ב־`dist` ואת כל נקודות הכניסה הקיימות:

- `/api/lead`: אותו handler קיים, לרבות Fireberry, Resend לניטור ו־Sentry, לאחר קומפילציה מ־TypeScript ל־ESM. משתני החיבור הקיימים נשארים בצד השרת. ה־shim מספק `req.body`, `req.query`, `res.status().json()` שהפונקציה מצפה להם.
- `/api/academy/*`: אותו handler מסחר וניהול, עם `MorningClient`, `MorningCheckoutAdapter` ומסד SQLite מקומי מתמשך ב־`/data/academy.sqlite`.
- `/api/academy/admin/outbox/drain`: עובד הודעות עם claims טרנזקציוניים, תוכן מוקפא, מפתח idempotency קבוע ו־Resend. נקודת הקצה מוגנת באסימון מנהל; היא אינה מופעלת אוטומטית.
- `/healthz`: תשובת בריאות בסיסית בלי נתונים פרטיים.

`api/_monitoring.ts` הוא helper בלבד ואינו נקודת קצה ציבורית. נקודת קצה לא מוכרת ב־`/api/` מחזירה JSON 404 ולא HTML של האתר. המערכת מגישה רק קבצים מתוך `dist`; קובצי מקור, סודות, מסד הנתונים וקישור סמלי שיוצא מתוך התיקייה אינם נגישים כמדיה. וידאו תומך בבקשות Range; חבילות `assets/` מקבלות cache ארוך ו־HTML מקבל no-cache. Preview מסומן noindex גם בכותרות HTTP.

## קבצים

- `deploy/hostinger/Dockerfile`: בנייה בשני שלבים עם Node24, ללא תלויות npm בזמן הריצה. API TypeScript עובר קומפילציה בזמן הבנייה; אין הסתמכות על stripping של TypeScript או שינוי סיומות בשרת.
- `deploy/hostinger/compose.preview.yml`: נפח נתונים חדש ונפרד, רשת bridge פרטית של הפרויקט (Traefik הקיים פועל ב־host mode), בלי פורט חשוף ישירות למארח, משתמש non-root, מערכת קבצים לקריאה בלבד פרט לנתונים ו־tmpfs, עד 768MB ו־0.75 CPU.
- `deploy/hostinger/.env.preview.example`: תבנית ללא סודות. לריצה מ־checkout יוצרים עותק פרטי `.env.preview` עם הרשאות 600; ב־Docker API מספקים מחרוזת environment פרטית. קובץ env אינו נדרש בשרת Docker Manager ואינו בתוך Git או התמונה.
- `scripts/self-hosted-build-api.mjs`, `scripts/self-hosted-start.mjs`: קומפילציה והפעלת האתר העצמאי.
- `server/self-hosted-runtime.mjs`, `server/self-hosted-http.mjs`: runtime, נפח SQLite ושרת HTTP.

## לפני הפעלה בשרת

ה־HTTPS entrypoint וה־certificate resolver נבדקו בפועל ושולבו כברירת המחדל: `websecure`, `letsencrypt`. אין רשת חיצונית משותפת: Traefik במצב host מגיע לכתובת bridge של הקונטיינר דרך Docker discovery. אין הקמת Traefik נוסף, שינוי הגדרותיו או פרסום פורט אפליקציה במארח. שם ה־Preview שנבדק ב־DNS הוא `academy-preview.srv1942778.hstgr.cloud`; יש לבדוק HTTP/TLS לאחר הפריסה. אין להחליף את `gutmanai.com` במסגרת בדיקת Preview.

לריצה מקומית מתוך checkout מכינים `.env.preview`; לפריסה דרך Docker API מעבירים אותם ערכים במחרוזת `environment` פרטית:

- `GUTMAN_PREVIEW_HOST=academy-preview.srv1942778.hstgr.cloud`, `TRAEFIK_HTTPS_ENTRYPOINT=websecure`, `TRAEFIK_CERT_RESOLVER=letsencrypt`: ערכים שנבדקו בפועל בשרת. אין `TRAEFIK_NETWORK` חיצוני.
- `GUTMAN_BUILD_CONTEXT`: ב־checkout מקומי `../..`. ב־Hostinger Docker API, URL Git מורשה נגיש לשרת עם commit מלא, למשל `https://github.com/OWNER/REPO.git#<40-hex-commit>`. יש להשתמש ב־commit שנדחף בפועל וכולל את החבילה. אין לבנות branch משתנה או לשבץ סוד ב־URL.
- `GUTMAN_SOURCE_REVISION`: אותו commit מלא, נרשם כ־image label; `GUTMAN_IMAGE_TAG`: תג ייחודי לגרסה, לצורך מעקב וחזרה לאחור.
- `ACADEMY_PUBLIC_ORIGIN`, `ACADEMY_ALLOWED_ORIGINS`: מקור HTTPS מדויק של אותו Preview. לא wildcard, לא כתובת IP לא מאובטחת.
- `ACADEMY_ADMIN_TOKEN`: ערך אקראי פרטי של 32 תווים לפחות. `ACADEMY_ORDER_SECRET`: סוד נפרד באורך 32 לפחות לפני הפעלת Morning. אין להכניס אותם ל־`VITE_*` או לחבילת האתר.

ברירת המחדל של התבנית: תשלום disabled, תנאי רכישה לא מאושרים ומשלוח disabled. המועדים נזרעים כעשר טיוטות רק במסד חדש; פתיחת מסד קיים אינה מוחקת או מחליפה רשומות. אין סימולציית תשלום באתר העצמאי.

לאחר השלמת הערכים, אלו פקודות הפריסה מתוך checkout בשורש המאגר (אין לבצע אותן מול שרת אחר):

```bash
docker compose --env-file deploy/hostinger/.env.preview -f deploy/hostinger/compose.preview.yml config --quiet
docker compose --env-file deploy/hostinger/.env.preview -f deploy/hostinger/compose.preview.yml build
docker compose --env-file deploy/hostinger/.env.preview -f deploy/hostinger/compose.preview.yml up -d
```

בדיקת `config --quiet` נמנעת מהדפסת סודות. אין להשתמש ב־`docker compose down -v`, במחיקת DB או ב־prune של נפחים; אין צורך לשנות את הרשת/ה־Traefik הקיימים. אין להריץ יותר מקונטיינר אפליקציה אחד על נפח זה או לשתף את SQLite דרך NFS. הקונטיינר פונה לשרת על פורט 3000 ברשת Docker; Traefik מיועד לספק HTTPS לפי ההגדרות הקיימות המאומתות; יש לבדוק תעודה ושירות בפועל אחרי הפריסה.

## פריסה דרך Hostinger Docker API — ללא צורך בקובץ env מקומי בשרת

ה־Compose מקבל את `environment` שמספק Docker Manager כמשתני interpolation, ומעביר במפורש לתהליך Node רק את השדות המוגדרים בו. אין `env_file` שנדרש להימצא במסלול לא ידוע בשרת. אותו קובץ עובד גם מקומית עם `--env-file` כפי שמוצג למעלה.

החוזה אומת מול [מקור MCP הרשמי של Hostinger](https://github.com/hostinger/api-mcp-server/blob/f190ed69b396e9177ca1a3367c0e98237d4cd6e4/src/core/tools/vps.ts) והטיפוסים הנוצרים ממנו. בסיס API: `https://developers.hostinger.com`.

| פעולה | שיטה ונתיב |
|---|---|
| יצירת פרויקט | `POST /api/vps/v1/virtual-machines/{virtualMachineId}/docker` |
| פרטי פרויקט ומצב | `GET /api/vps/v1/virtual-machines/{virtualMachineId}/docker/{projectName}` |
| לוגים — 300 רשומות אחרונות | `GET /api/vps/v1/virtual-machines/{virtualMachineId}/docker/{projectName}/logs` |
| קונטיינרים, מצב ופרטים | `GET /api/vps/v1/virtual-machines/{virtualMachineId}/docker/{projectName}/containers` |

גוף יצירת הפרויקט הוא `{project_name, content, environment?}`: `content` מכיל את ה־Compose במלואו ו־`environment` הוא מחרוזת משתנים פרטית. מזהה ה־VM נמצא בנתיב. יש לבחור פרויקט Preview חדש וייחודי: לפי החוזה הרשמי, **שם פרויקט שכבר קיים מוחלף**. אין לשלוח create בשם פרויקט קיים של Traefik או שירות אחר.

`content` יכול להיות גם URL, אך ה־API מתאר URL של repository שממופה לקובץ ב־master. כדי לשמור את הגרסה המדויקת, שולחים תוכן Compose מפורש ומציבים את URL ה־Git עם commit ב־`GUTMAN_BUILD_CONTEXT`. אין להניח גישת Git לחשבון פרטי בלי לבדוק הרשאה. סודות נמצאים ב־`environment` בלבד, אינם build args ואינם שייכים לתמונה או ל־Git. אין להדפיס את גוף הבקשה או את שדות הסביבה בתשובות ניהול.

לאחר POST יש לקרוא מצב/קונטיינרים ולוגים באופן מסונן ואז לבדוק `/healthz`, דף עברי, `/api/lead`, `/api/academy/catalog` וכניסה מוגנת למנהל דרך כתובת HTTPS. קבלת job או project מה־API אינה בפני עצמה הוכחת הצלחת build, בריאות השרת או TLS.

## תשלום והודעות אמיתיים

שימוש ב־Morning דורש OAuth ID/secret, secret webhook, tax ID עסק מאומת, מקורות checkout מאומתים, `MORNING_MERCHANT_VERIFIED=1`, אישור תנאי רכישה ו־`ACADEMY_PAYMENT_MODE=morning`. הגדרה בלבד אינה בדיקת חשבון; יש לאמת הרשאות, סוג מסמך ומעמד מס לפני הפעלה. כרגע נוצרת בקשת תשלום אחת; פריסת תשלומים מעבר לכך דורשת בדיקת הרשאת הסוחר. לא להציג עד שישה תשלומים כפעילים בלי אימות.

אישור הרשמה נעשה רק לאחר lookup שרת של קבלה מדויקת בספק: מזהה הזמנה בתיאור, סכום ומטבע, עסק נכון, מע״מ אפס ומרכיבי תשלום חיוביים תואמים. שדות callback או חזרה של דפדפן אינם ראיה לתשלום. קישור Morning אינו מקבל הבטחת תפוגה מומצאת: שמירת המושב מקומית; תשלום מאוחר מסומן `refund_required` ולא מעניק מקום. החזר אמיתי אינו אוטומטי ואינו ממומש באמצעות API לא מתועד.

להודעות שירות: `RESEND_API_KEY`, `ACADEMY_EMAIL_FROM` מדומיין מאומת, `ACADEMY_EMAIL_SENDER_VERIFIED=1`, `ACADEMY_EMAIL_DELIVERY_ENABLED=1` ורשימת `ACADEMY_EMAIL_APPROVED_KINDS` מפורשת. יש לאשר את התוכן וההכנה לפני הפעלת הרשימה. קיימים רק confirmation/preparation/reminder/followup; אירועי CRM ובדיקת בעלים אינם נשלחים כ־emails למשתתף.

עובד ההודעות שומר claim ותוכן לפני הקריאה לספק. עד שמונה ניסיונות; חלון idempotency הוא 24 שעות עם מרווח בטיחות. אחרי חלון זה או ניסיון היסטורי לא מתועד נדרש טיפול ידני. קבלת הודעה ב־Resend נרשמת כ־accepted; אין זו הוכחת מסירה לתיבה. מיפוי הרשמה ל־Fireberry אינו מנוחש; פונקציית הליד הקיימת נשמרת, ואירועי CRM של מסחר נשארים בתור עד מיפוי מוסכם.

## נתונים, גיבוי ומעבר

הנפח החדש הוא `academy_preview_data` בפרויקט Compose `gutman-academy-preview`. סודות אינם בתוך התמונה ואינם מגובים במאגר. להגנה על נתונים: להגביל הרשאות VPS/Docker וגישה לנפח, להגדיר גיבוי מוצפן למיקום מורשה ולהוכיח שחזור לפני הפעלת לקוחות. SQLite שומר WAL; אין להעתיק DB פתוח לבדו. יש לבצע snapshot/backup עקבי או לעצור את הקונטיינר ולשמור יחד DB וקובצי WAL/SHM. יש לשמור את גרסת התמונה והתצורה לצורך חזרה לאחור, ולהחזיר את האפליקציה בלי מחיקת הנתונים.

אין הנחה ש־CRM, ספק הסליקה או אחסון Vercel ריקים. לפני החלפת אתר הייצור יש למפות נתוני רכישה/הרשמה קיימים, לייצא באופן מורשה, לבדוק גרסה ושלמות ולבצע יבוא מבוקר למסד המתאים. אין יצוא/יבוא נתוני לקוחות שבוצע במסגרת ההכנה הנוכחית. אין להעביר לקוחות בתשלום למסלול חדש בלי טיפול פרטני.

## אימות והגבולות של המצב הנוכחי

בדיקות Node משתמשות ב־SQLite בקובץ זמני ובתחבורה מדומה ל־Morning ו־Fireberry: API lead אמיתי שעבר קומפילציה, גבולות JSON/origin, מניעת נתיב פרטי/קישור סמלי, SPA ומדיה, שימור הזמנה אחרי סגירה ופתיחה, ואישור קבלה מדויק פעם אחת. אין חיובים, הודעות או רשומות CRM אמיתיים בבדיקות.

גישה מאומתת ל־Docker Manager והגדרות Traefik/DNS אותרו. פריסה בפועל, שירות Preview תקין, תעודת TLS, אימות סוחר/שולח וגיבוי שחזור עדיין אינם מוכחים עד ביצוע ובדיקה מול השרת. אין כאן טענה שהאתר כבר הועבר. דומיין הייצור נשאר בתשתית הקיימת עד החלטת מעבר נפרדת לאחר בדיקת Preview.
