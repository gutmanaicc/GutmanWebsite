# אתר Gutman ב־Hostinger — מצב Preview וחבילת פריסה

האתר רץ ב־VPS הקיים של Hostinger ומדווח healthy. `/healthz` מחזיר `status: ok`; קטלוג ה־API במצב disabled וללא מועדים מאושרים. העיצוב וסמינר WhatsApp נבדקו בדפדפן. סרטוני פרויקטי הלקוחות הוסרו מדף הבית לפי ביקורת הבעלים. **ה־Preview נגיש ב־HTTPS תקין, וסרטון המלצות המחזור הראשון מוגש מהנפח הפרטי בשרת**. חיבור מסחר אמיתי עדיין ממתין להשלמה; המעבר לדומיין הייצור לא הושלם.

גישה מאומתת ל־Docker Manager דרך Hostinger `proxy_execute` נמצאה. Traefik הקיים פועל ב־`network_mode: host`, עם כניסת `websecure` ו־resolver בשם `letsencrypt`. `academy-preview.srv1942778.hstgr.cloud` פותר ל־VPS ב־76.13.37.15. בקשת התעודה הראשונה חזרה עם ״Certificate not found״/404 ב־CA; המפעיל שינה רק את שם router של פרויקט ה־Preview ל־`tls2`. הניסיון הבא הצליח, ונבדק HTTPS עם אימות תעודה רגיל (ללא עקיפה): דף הבית 200, health 200, קטלוג 200, מנהל ללא אסימון 401 וקובץ וידאו קיים 200 עם MIME מתאים ו־noindex. אין restart או שינוי לשירותי Traefik/פרויקטים קיימים. בפריסת העדכון יש לשמר את router ה־Preview התקין והנפחים.

Morning, Fireberry ו־Resend עדיין אינם מחוברים ל־Preview: כלי Vercel הציגו מטא־דאטה של משתנים בלבד ולא סודות, ולכן לא הועתקו credentials. לידים ללא CRM מחזירים כשל מפורש, הודעות כבויות ותשלום כבוי. דומיין הייצור הקיים ב־Vercel לא הוחלף.

### אימות הפריסה הקודמת — 12 באוקטובר 2026

- תמונת האפליקציה `gutman-academy-preview:4dee50a12706` רצה healthy; תמונת המדיה `gutman-academy-preview-media:d4e4a66e4c78` סיימה בהצלחה. אפשר להשתמש ב־`GUTMAN_MEDIA_IMAGE_TAG` כדי לשמר גרסת כלי מדיה מאומתת בזמן עדכון עיצוב בלבד.
- בדפדפן חדש HTTPS נטען ללא אזהרה. ניגון סרטון ההמלצות התקדם בפועל, ומשך הנגן הוא 75.04 שניות. אין autoplay; פוסטר ופקדי הנגן נטענים.
- כל 14 הלוגואים נטענו באתר החי ונשארו בצבעי המקור. קובצי האתר הושוו לקובצי המקור לפי SHA-256; כולם זהים. FAQ מעל הבאנר, פרק המייסד מתחתיו. תצוגות 375/1440 נבדקו גם ב־Playwright עם 0 הפרות axe.
- סרטון ההמלצות בגודל 4,659,761 בתים והפוסטר בגודל 23,573 בתים נגישים דרך HTTPS עם תשובות Range תקינות. קובץ ה־manifest הנסתר מחזיר 404. לאחר החלפת תמונת האפליקציה, המדיה אושרה מהנפח המתמשך ללא הורדה או המרה חוזרת.
- כתובת ההורדה הזמנית נמחקה ממשתני פרויקט האתר לאחר ההכנה. עותקי העיבוד הזמניים הוסרו; אין קובצי ההמלצה ב־Git או בתמונות Docker. פרויקט הבנייה הזמני הוסר, ושני הפרויקטים שהיו קיימים בשרת עדיין רצים.
- בדיקות המסחר והשרת עברו; בדיקת ניגודיות WhatsApp שתוקנה נבדקה מחדש בבדיקות דפדפן. ארבע בדיקות הכנת המדיה עברו, כולל ffmpeg אמיתי על חומר בדיקה סינתטי והפעלת מדיה מתמשכת בלי כתובת מקור תקפה. אין חיוב או הודעה אמיתיים במסגרת הבדיקות.

## מה החבילה מריצה

קונטיינר Node24 אחד מגיש את React/Vite שנבנה ב־`dist` ואת כל נקודות הכניסה הקיימות:

- `/api/lead`: אותו handler קיים, לרבות Fireberry, Resend לניטור ו־Sentry, לאחר קומפילציה מ־TypeScript ל־ESM. משתני החיבור הקיימים נשארים בצד השרת. ה־shim מספק `req.body`, `req.query`, `res.status().json()` שהפונקציה מצפה להם.
- `/api/academy/*`: אותו handler מסחר וניהול, עם `MorningClient`, `MorningCheckoutAdapter` ומסד SQLite מקומי מתמשך ב־`/data/academy.sqlite`.
- `/api/academy/admin/outbox/drain`: עובד הודעות עם claims טרנזקציוניים, תוכן מוקפא, מפתח idempotency קבוע ו־Resend. נקודת הקצה מוגנת באסימון מנהל; היא אינה מופעלת אוטומטית.
- `/healthz`: תשובת בריאות בסיסית בלי נתונים פרטיים.

`api/_monitoring.ts` הוא helper בלבד ואינו נקודת קצה ציבורית. נקודת קצה לא מוכרת ב־`/api/` מחזירה JSON 404 ולא HTML של האתר. המערכת מגישה רק קבצים מתוך `dist`; קובצי מקור, סודות, מסד הנתונים וקישור סמלי שיוצא מתוך התיקייה אינם נגישים כמדיה. וידאו תומך בבקשות Range; חבילות `assets/` מקבלות cache ארוך ו־HTML מקבל no-cache. Preview מסומן noindex גם בכותרות HTTP.

## קבצים

- `deploy/hostinger/Dockerfile`: בנייה בשני שלבים עם Node24, ללא תלויות npm בזמן הריצה. API TypeScript עובר קומפילציה בזמן הבנייה; אין הסתמכות על stripping של TypeScript או שינוי סיומות בשרת.
- `deploy/hostinger/compose.preview.yml`: ריצה מתוך checkout עם build מקומי.
- `deploy/hostinger/compose.builder.yml`: פרויקט builder חד־פעמי עם Docker CLI, מקור Git שנבדק ו־commit מלא. mounts כוללים רק socket Docker הנדרש לבניית התמונות של האקדמיה; אין פקודות shell חופשיות, פורטים או restart.
- `deploy/hostinger/compose.manager.yml`: manifest של האפליקציה ל־Docker Manager, image שכבר נבנה ב־VPS ו־`pull_policy: never`, ללא שדה build. נפח SQLite נפרד, bridge פרטי, בלי פורט מארח, משתמש non-root, filesystem לקריאה בלבד פרט לנתונים, עד 768MB ו־0.75 CPU.
- `deploy/hostinger/compose.media.yml`: overlay אופציונלי ל־Compose מקומי עם build של כלי המדיה.
- `deploy/hostinger/compose.manager.media.yml`: overlay המדיה ל־Docker Manager, לאחר בניית שתי התמונות; אין build ב־manifest זה.
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

`content` יכול להיות גם URL, אך ה־API מתאר URL של repository שממופה לקובץ ב־master. שולחים תוכן Compose מפורש כדי לשמור את הגרסה. **ב־Docker Manager נמצאה מגבלה מעשית:** הוא מנסה למשוך תמונות לפני הפריסה, ולכן app עם image מקומי שטרם נבנה ו־build בתוך אותו manifest לא יצר קונטיינרים. ה־builder החד־פעמי כבר הוכח בפועל: סיים exit 0; האפליקציה רצה מתמונתו עם manifest של runtime בלבד ו־`pull_policy: never`.

ה־builder מקבל `GUTMAN_BUILD_CONTEXT` כ־URL Git מורשה עם commit מלא, `GUTMAN_SOURCE_REVISION` זהה, `GUTMAN_IMAGE_TAG` ייחודי, `GUTMAN_BUILD_TARGET=runtime` ו־`GUTMAN_BUILD_IMAGE=gutman-academy-preview`. הבנייה היא argv ישיר של `docker build`, ללא פקודת shell שמקבלת קלט. לאחר הצלחה מפרסים `compose.manager.yml`; לעדכון מדיה בונים בנפרד גם `media-tools` בשם `gutman-academy-preview-media` עם אותו tag ו־commit. אין להניח גישת Git לחשבון פרטי בלי לבדוק הרשאה. סודות נמצאים ב־`environment` בלבד, אינם build args ואינם שייכים לתמונה או ל־Git. אין להדפיס את גוף הבקשה או את שדות הסביבה בתשובות ניהול.

לאחר POST יש לקרוא מצב/קונטיינרים ולוגים באופן מסונן ואז לבדוק `/healthz`, דף עברי, `/api/lead`, `/api/academy/catalog` וכניסה מוגנת למנהל דרך כתובת HTTPS. קבלת job או project מה־API אינה בפני עצמה הוכחת הצלחת build, בריאות השרת או TLS.

## סרטון המחזור הראשון — באתר בלבד, ללא GitHub ציבורי או אחסון ביניים

הבעלים בחרו במפורש לא לפרסם את הקובץ ב־GitHub. `public/videos/first-cohort/` מוחרג גם מ־Git וגם מ־Docker build context. אין source video או poster בינארי חדש במאגר, בתמונה, ב־Composio artifacts או ב־S3. מקור הקובץ הוא קובץ Drive המקורי; ה־Drive connector נותן כתובת הורדה חתומה זמנית תחת `sdmnt*.oaiusercontent.com`, שהיא stream של המקור ולא יעד upload חדש. אזור השרת משתנה בין בקשות; הפניות של כתובת stream מותרות רק בתוך אותו hostname.

המסלול: מקור Drive/stream מאושר → named volume פרטי של פרויקט Hostinger → transcode מקומי → שני קבצים באתר. `scripts/self-hosted-media-seed.mjs` מקבל רק `ACADEMY_TESTIMONIAL_SOURCE` ו־`ACADEMY_TESTIMONIAL_SOURCE_SHA256`. יש לקבל URL טרי **אחרי בניית שתי התמונות**, ממש לפני ה־seed, משום שהוא פג לאחר כחמש דקות. אין להעביר URL מדיה ל־builder או ל־build args, ואין להדפיס אותו בלוגים או בקשות תמיכה.

SHA256 של המקור שנמסר למפעיל: `e90cc52c3d394a65e5fcbac9048adf1fa2a12c17aa3e15dee7227e1d30b6b4bf`. ה־seed מאמת אותו לפני ffmpeg. הוא מוריד רק מהמקור המאושר, תומך בהפניות HTTPS מוגבלות, אינו מבצע uploads ואינו משתמש ב־fallback של שירות אחסון אחר.

כדי להציג את הסרטון, בונים **גם runtime וגם media-tools** עם `VITE_ACADEMY_TESTIMONIAL_ENABLED=1`. ברירת המחדל של build רגיל היא 0, כך ש־Vercel/אתר ללא נפח מדיה אינו מציג קישור שבור. ffmpeg מותקן רק ב־stage האופציונלי `media-tools`; תמונת האפליקציה נשארת קטנה.

ב־overlay, `media-seed` משתמש ב־`gutman-academy-preview-media` וכותב לנפח `academy_preview_media` ב־`/media`. Node UID 1000 הוא בעל התיקייה. האפליקציה ממתינה ל־`service_completed_successfully` ומקבלת את אותו נפח **לקריאה בלבד** ב־`/app/dist/videos/first-cohort`. יתר `dist/videos` אינם מוחלפים או מוסתרים.

התוצרים המפורסמים היחידים:

- `/videos/first-cohort/testimonials.mp4`: H264, עד 720 גובה, CRF 26, AAC 96k, faststart.
- `/videos/first-cohort/poster.jpg`: frame בשנייה 15.

הקבצים נכתבים תחילה לשמות זמניים ומוחלפים ב־atomic rename אחרי בדיקת תוצר ו־SHA256. manifest מוסתר מתעד את hash המקור ושני התוצרים בלי URL; קבצים 644 ותיקיות 755. המקור נשמר זמנית בשם מוסתר בהרשאות 600, ומוסר רק אחרי פרסום מלא וסנכרון. שרת האתר חוסם נתיבים שמתחילים בנקודה, ולכן המקור וה־manifest אינם קבצים ציבוריים.

ב־restart, אם manifest ו־hash של שני הקבצים תקינים, אין הורדה או encode מחדש גם כשכתובת המקור פגה. אם encode נקטע, מקור שכבר אומת נשמר וניתן להשלים ממנו בלי רשת. במקרה checksum שגוי אין החלפת תוצר קיים; במקרה תקלה overlay אינו מפעיל אפליקציה עם מדיה חסרה. אין צורך למחוק נפח מדיה כדי לעדכן כתובת פגה.

בדיקות seed משתמשות במדיה סינתטית מקומית ובתחבורת download מדומה; הן אינן מורידות או מפרסמות את הסרטון הפרטי. הוכחו SHA שגוי/הפניה אסורה ללא overwrite, manifest והרשאות, restart ללא URL, recovery ממקור מוסתר, ו־ffmpeg אמיתי שמייצר H264/AAC 720 עם faststart ו־JPEG. גם stage כלי המדיה נבנה בהצלחה עם CA זמני של סביבת הבנייה; ה־CA אינו נשמר בתמונה. ה־seed של הסרטון המקורי ב־VPS עדיין נדרש בנפרד.

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

האתר הבסיסי רץ ומדווח healthy ב־Hostinger; מקור image והתשתית נבדקו כמתואר בתחילת המסמך. TLS תקין נבדק בפועל. סרטון המחזור הראשון ב־named volume, סודות/אימות סוחר ושולח וגיבוי שחזור עדיין דורשים השלמה ובדיקה בפועל. אין טענה שמסחר, CRM או מסירת דוא״ל אמיתיים פעילים. דומיין הייצור נשאר בתשתית הקיימת עד החלטת מעבר נפרדת לאחר בדיקת Preview.

## עדכון בעקבות ביקורת הבעלים

דף הבית מסיר את תיק העבודות ואת קישורי סביבת העבודה שמתחת לסרטוני הבוגרים. כפתור ממורכז מוביל לכל ההמלצות. פס המותגים מופיע אחרי סיפור המייסד, עם כותרת מעל, לופ רציף, גרירה, מקשי חצים וכפתורי תנועה ועצירה; בקשת הפחתת תנועה מכבה את הלופ האוטומטי. נכסי המקור נשמרים, והלוגואים מוצגים בגוון אחיד על רקע משותף ללא אריחים. תמונת ההירו הנוכחית מונפשת בעדינות וניתנת לעצירה. שורת הניסיון ממורכזת וקצרה, Enterprise הוחלף בעברית ומקפים ארוכים הוסרו מהטקסט. המחיר הרגיל 1,490 ₪ מוצג עם קו מחיקה ומחיר ההשקה 1,190 ₪ מודגש; סיכום הקופון נשאר לפי השרת.

75 בדיקות עברו, כולל בדיקת גרירה, עצירה, מקלדת והפחתת תנועה; build ו־TypeScript עברו. בדיקות נגישות ומסכים אמיתיים 375/768/1440 עברו. גרסת סרטון ההמלצות עם מוזיקה וכתוביות נמצאת לפי הבעלים בתיקיית ההורדות במחשב המקומי; אין גישה לתיקייה מתוך סביבת הענן, ולכן נדרשת קבלת הקובץ כדי להחליף את הסרטון. נשמרת ההנחיה שלא להעלותו ל־GitHub הציבורי.

העדכון נפרס בשרת בהצלחה מתמונת `gutman-academy-preview:211cd02f0cc5`, commit `211cd02f0cc55577256df64decb79ef0aa69efbc`. תמונת המדיה, שני הנפחים ונתב TLS נשמרו; seed המדיה חזר exit 0 ללא הורדה או המרה. האפליקציה healthy. בדיקת HTTP מתוך פרויקט בדיקה מבודד ב־VPS אימתה HTTPS ללא עקיפה, את חבילת דף הבית החדשה, health, מחירי הקטלוג, עמוד המלצות 200, התאמת SHA-256 של כל 14 נכסי המותגים ותשובת וידאו Range 206 של 1,024 בתים. אין בקשות למנהל או יצוא של נתוני לקוחות. בדיקת הדפדפן נעשתה על אותה גרסת קוד בסביבה המקומית; כלי הדפדפן המרוחק לא היה זמין לבדיקת הגרסה החיה.
