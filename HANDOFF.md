# HANDOFF: אתר Gutman Academy — גרסה חדשה ב-repo חדש

מסמך העברה לשיחה חדשה. קרא את כולו לפני שאתה כותב שורת קוד.
נכתב: 8.8.2026. **כל מה שצריך נמצא בתוך ה-repo הזה:** קבצי המקור להעברה תחת `legacy/`, נכסי המותג תחת `brand/`, והסקילים תחת `.agents/skills/`.

## 1. מה המשימה

לבנות את אתר האקדמיה של רון גוטמן **כאן, ב-repo הזה (GutmanWebsite)**, בכיוון עיצובי מאושר (סעיף 4), תוך העברת כל התוכן והלוגיקה מ-`legacy/` (סעיף 6). את הפרויקט מקימים בשורש ה-repo (Vite + React + TS); בסיום אפשר למחוק את `legacy/`. האתר בעברית, RTL מלא, Vite + React + TypeScript.

## 2. רקע חובה

- האקדמיה: לימודי AI פרונטליים ומעשיים, 5 מסלולים בלבד (מנהלי סושיאל, סטודנטים, וידאו ותוכן, בעלי עסקים, דף נחיתה). אין להמציא מסלולים, מחירים, תאריכים, המלצות או נתונים. המפרט המלא: נתוני המסלולים ב-`legacy/src/data/courses.ts`.
- האתר החי gutmanai.com מציג כרגע דף Teaser עם ספירה לאחור להשקה ב-**9.8.2026 בשעה 10:00**. לא לגעת ב-production עד שרון מאשר. הפרויקט הקיים ב-Vercel נקרא ai-workshop-landing (team: gutmanai).
- דף ה-Teaser שמור כ-`legacy/src/pages/ComingSoon.tsx` + `legacy/src/index.css` — להעביר כמו שהוא ל-repo החדש (ראוט `/coming-soon`).

## 3. היסטוריית החלטות עיצוב (קריטי — לא לחזור על טעויות)

1. גרסה 1: כהה + ניאון ורוד + זוהר. רון פסל: "נראה AI גנרי".
2. גרסה 2: "מגזין מודפס" — נייר, סריף כבד, קווי דפוס. רון פסל: "מכוער".
3. גרסה 3: כהה סינמטי (זרקור, צ'אט מנחה, חלונות ממשק). רון עדיין לא מרוצה: "החלום שלי שזה ייראה כמו האתר של אפל".
4. **הכיוון המאושר (סופי): בהיר, בסגנון orbix.studio / Apple.** רון אישר במפורש.

## 4. המתכון העיצובי המאושר (בהשראת orbix.studio)

- קנבס בהיר: אפור-לבן חם (בסגנון #f4f4f2), לא לבן בוהק. קווי גריד דקיקים (hairline) שמחלקים את הקנבס.
- טיפוגרפיה ענקית: Heebo משקל 500-700, מרווח אותיות שלילי, כותרות 60px+.
- **החתימה:** מילת הדגשה אחת בכל כותרת עוברת לסריף עברי נטוי (Frank Ruhl Libre עם skew, כי אין italic עברי אמיתי) — המקבילה ל"B2B *SaaS Companies*" של Orbix.
- כפתורי גלולה (pill) בצבע הדיו של המותג עם צל רך דרמטי — "מרחפים". בלי גרדיאנטים, בלי זוהר, בלי glassmorphism.
- שחור-לבן כמעט מוחלט; צבע המותג רק בנגיעות מיקרו: נקודות, תגיות, מילים בודדות.
- הוכחות מספריות בכל מקום (בסגנון "(44) Case Studies" בתפריט): מספר מסלולים, מספר מפגשים וכו'. בלי להמציא נתונים.
- תמונות/הדגמות אמיתיות: להשתמש ב"חלונות הממשק" שכבר נבנו (MockWindows: צ'אט עובד AI, CRM, סטוריבורד, מערכת לימודים, דף נחיתה) בתור ההוכחה הוויזואלית, מעוצבים מחדש לשפה הבהירה.
- אינטראקציות בסגנון אפל: פידבק ב-pointer-down, צניעות בתנועה, prefers-reduced-motion.
- הסקיל `ui-ux-pro-max` כבר בתוך ה-repo תחת `.agents/skills/`.
- הצ'אט "המנחה" (ChatFinder) נשאר — הוא אהוב — מעוצב מחדש בשפה הבהירה.

## 5. מותג (מאושר על ידי רון, מחייב)

- **צבעי המותג: `#191919` (דיו) + `#ff5f9e` (ורוד המותג).** אלה הצבעים. לא #f5578a הישן.
- **הלוגו: "לוגו חתוך" בלבד** — קובץ `brand/logo-cutout.png` שבשורש ה-repo. PNG עם שקיפות, wordmark ורוד "Gutman". יש גם `brand/logo-white.png` לרקעים כהים (פוטר).
- טון כתיבה: ישיר, חד, מקצועי, בגובה העיניים. **בלי em-dash (—) בשום קופי.** בלי קלישאות AI ("העתיד כבר כאן" וכו').

## 6. מה מעבירים מ-`legacy/` (הכול כבר בתוך ה-repo)

להעתיק כמעט כמו שהם:
- `legacy/src/data/courses.ts` — כל תוכן 5 המסלולים (המבנה והקופי מאושרים)
- `legacy/src/data/site.ts` — טקסטים רוחביים, GENERAL_FAQ, הצהרת claim
- `legacy/src/lib/leads.ts` — שכבת לידים (LEAD_ENDPOINT עדיין ריק, לידים נשמרים ב-localStorage עד חיבור Webhook)
- `legacy/src/lib/seo.ts` — useSeo + סכמות JSON-LD
- `legacy/src/lib/useReveal.ts`
- `legacy/src/pixel.ts` — Meta Pixel (id 1392343815914070) נטען רק אחרי הסכמת עוגיות
- `legacy/src/AccessibilityWidget.tsx` + באנר Consent
- `legacy/src/components/ChatFinder.tsx`, `MockWindows.tsx`, `FAQAccordion.tsx`, `LeadForm.tsx`, `Breadcrumbs.tsx`, `icons.tsx` — לעדכן סטיילינג בלבד
- `legacy/src/pages/ComingSoon.tsx` + `legacy/src/index.css` — ה-Teaser, לא לשנות
- `legacy/public/`: favicon, og-teaser, ics, robots.txt, sitemap.xml
- מבנה ראוטים (react-router v7): /, /courses, /courses/:slug (5 סלאגים), /course-finder, /about, /results, /faq, /contact, /thank-you, /privacy, /terms, /coming-soon, 404. `legacy/vercel.json` עם SPA rewrites (להעתיק).

לבנות מחדש בשפה הבהירה: Header, Footer, Home, Courses, CoursePage, וכל ה-CSS (`src/styles/site.css` נכתב מאפס עם טוקנים).

## 7. תשתית

- GitHub: ה-repo הזה (gutmanaicc/GutmanWebsite). ה-CLI המקומי מחובר בתור gutmanaicc.
- Vercel: CLI מחובר (npx vercel). ליצור **פרויקט Vercel חדש ונפרד** ל-repo החדש (לא לקשר ל-ai-workshop-landing). Preview עם Deployment Protection: קישורי שיתוף דרך `get_access_to_vercel_url`.
- בדיקות שבוצעו בגרסאות קודמות ויש לשמר: RTL מלא, אפס גלילה אופקית בכל ראוט, H1 יחיד לעמוד, Title ייחודי, מטרות מגע 44px+, ניגודיות AA, טופס עם ולידציה עברית, מובייל מלא.
- מגבלת סביבה ידועה: צילומי מסך בחלונית התצוגה נצבעים שחור כשהעמוד גלול; לבדוק סקשנים באמצע העמוד עם הסתרת סקשנים קודמים (display:none) וצילום ב-scroll 0.

## 8. סטטוס ההשקה

Preview אחרון של הגרסה הכהה: ai-workshop-landing (deployments עם קישורי share זמניים). הגרסה הבהירה החדשה תחליף הכול. עד ההשקה ב-9.8, production נשאר ה-Teaser.
