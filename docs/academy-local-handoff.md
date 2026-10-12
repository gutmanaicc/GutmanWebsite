> תיעוד היסטורי: הבעלים ביטל הרצה מקומית וביקש להמשיך בענן. מצב עדכני והוראות חיבור: [academy-cloud-setup.md](academy-cloud-setup.md). אין לפעול לפי משימת ההמשך המקומית להלן.

# המשך על ה־Mac — אקדמיית גוטמן 2.0

הבעלים ביקש במפורש להמשיך מקומית כדי לאתר את מפתחות Morning ב־Keychain ולחבר סליקה אמיתית. העבודה נעשתה עד כה בענן Linux; אין בו גישה ל־Mac. לא פורסם אתר ייצור ולא נוצרו חיובים או קישורי Morning.

## הקוד שעליו ממשיכים

- Repository: `https://github.com/gutmanaicc/GutmanWebsite.git`
- Branch: `feature/gutman-academy-seminars-v2`
- כל שינויי העיצוב, התוכן, המועדים, השרת והסליקה נמצאים בענף הזה. אין להתחיל מחדש מ־main או להחליף את העיצוב בגרסה בסיסית.
- סביבת הרצה: Node24 ומעלה, npm. התקנה: `npm ci`. API: `npm run academy:server`. האתר: `npm run dev`, עם proxy ל־API על5174.
- דוגמאות ההגדרות ב־`.env.example`; סקריפט השרת אינו טוען env files אוטומטית. ברירת המחדל disabled, מועדים בטיוטה.

אם אין checkout מקומי, יש לשכפל לתיקייה חדשה, בלי לדרוס אתר/קבצים קיימים. לדוגמה, מתיקיית עבודה שנבחרה על ה־Mac:

```bash
git clone --branch feature/gutman-academy-seminars-v2 --single-branch https://github.com/gutmanaicc/GutmanWebsite.git GutmanAcademy-2.0
cd GutmanAcademy-2.0
npm ci
```

אם התיקייה כבר קיימת, יש לבדוק Git status ולאפס שום דבר. להשתמש ב־worktree חדש או בתיקייה אחרת לפי הצורך.

## משימת ההמשך המקומית

1. לקרוא README, מסמך זה ו־`docs/academy-payment-integration.md`. לאמת `uname -s` הוא Darwin ו־Node24 זמין.
2. המשתמש זוכר ששם פריט ה־Keychain הוא ״מורנינג משהו״. יש לחפש פריטים של Morning/GreenInvoice בלבד. אין להדפיס סודות, להוסיף אותם לקוד או לקרוא מפתחות של שירותים אחרים. `server/morning-credentials.mjs` קורא פריט JSON עם id/secret או שני פריטים נפרדים; `npm run academy:keychain -- --check` בודק שמות שירות ממוקדים. כשידוע שם השירות, להשתמש ב־`--service`, או `--id-service` ו־`--secret-service`. אין dump של ערכי Keychain.
3. להפריד credentials של sandbox ושל ייצור. לא לשמור מפתחות ב־VITE או ב־git; להעביר בזיכרון או במנהל סודות בצד שרת. הקריאה ל־Keychain עשויה להציג בקשת גישה רגילה של macOS.
4. לפתוח את המפרט הרשמי ב־`https://developers.morning.co/api` בדפדפן/כלי מקומי, ולחלץ את החוזה המדויק: auth, יצירת hosted checkout, expiry, lookup מאומת, callback/acknowledgement, קבלות והחזרים. כלי הקריאה בענן חשפו רק loading shell. אין להניח ש־Morning ו־Grow משתמשים באותו API או להעתיק endpoints לא מאומתים ממקורות קהילה.
5. להשלים את `MorningGrowAdapter` ב־`server/payment-adapters.mjs`, שמחזיר כעת ready=false. התשתית ב־`server/hosted-checkout.mjs` כבר יוצרת קישור אחד להזמנה, בודקת origin HTTPS ותוקף עד שמירת המושב, ומיישבת תשלום רק על סמך lookup מאומת. `reconcile` מחזיר אירוע normalized עם providerLinkId, orderId, provider='morning', id, transactionId, amountAgorot, currency, type. notify הוא אות לבדיקה בלבד, ללא אמון בשדות callback. אין להשתמש בחתימת הסימולציה כחתימת Morning.
6. לחבר קבלות, הודעות שירות ו־CRM כנדרש במקור. outbox ו־templates קיימים, אך שום worker משלוח אינו פעיל. לתכנן אחסון מתמשך וגיבוי לייצור; `api/academy.ts` מחזיר503 בכוונה, ו־SQLite מקומי אינו מסד מתמשך ב־Vercel serverless. אין לטעון שחיבור המפתח לבדו מסיים את המערכת.
7. לבצע בדיקת sandbox לפי הספק עם נתוני בדיקה בלבד. אין חיוב אמיתי בבדיקות. המשתמש אישר יצירת קישורי סליקה והטמעתם לפי הצורך, אך לא אישר פרסום האתר לייצור, אישור טיוטות המועדים או שינוי תנאים משפטיים. לא לפתוח רכישה למועדים לא מאושרים.

## מה כבר אומת

34/34 בדיקות עברו, ובנייה מלאה ו־TypeScript עברו. הבדיקה מול ספק מדומה מכסה מעבר וחזרה בדפדפן, lookup, רישום יחיד, callbacks מזויפים, כפילויות, timeout, מניעת מכירת יתר12, מינימום8, קופונים ושמירות15דקות. זו אינה בדיקת Morning sandbox. ברירת המחדל של מאגר התצוגה:10 טיוטות,0 הזמנות,0 מועדים ציבוריים וסליקה חסומה.

מחיר השקה1190₪, מחיר רגיל מתוכנן1490₪, ללא הוספת מע״מ בהגדרת עוסק פטור הנוכחית; נדרש אימות עסק/רו״ח לפני חיבור כספי לייצור. סמינרים יחידים5שעות15:00–20:00, Asia/Jerusalem. האתר בעברית RTL, עשיר ונועז; המשתמש הדגיש לשפר משמעותית ולא לפשט.

## משפט לפתיחת משימה מקומית

המשך את עבודת Gutman Academy2.0 מקומית על ה־Mac. שכפל לתיקייה חדשה את https://github.com/gutmanaicc/GutmanWebsite.git בענף feature/gutman-academy-seminars-v2, בלי לדרוס עבודה קיימת, וקרא docs/academy-local-handoff.md. הרץ את האתר ואת ה־API, אתר בבטחה ב־Keychain את פרטי Morning ששמם כנראה מכיל ״מורנינג״, והשלים את חיבור הסליקה וההרשמה מקצה לקצה לפי המפרט הרשמי. יש אישור ליצירת קישורי סליקה והטמעתם; אין להציג סודות, לחייב לקוחות בבדיקות, לפתוח טיוטות לרכישה או לפרסם לייצור ללא האישור המתאים. שמור את העיצוב המשופר שכבר קיים.
