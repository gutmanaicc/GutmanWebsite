# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

אתר השיווק של Gutman Academy: עברית, RTL מלא, SPA של React על Vite, מתארח ב-Vercel.
הערות הקוד בפרויקט כתובות בעברית ומסבירות **למה** בחרנו בפתרון, לא מה הוא עושה. שמור על הסגנון הזה.

## פקודות

```bash
npm run dev      # Vite dev server על פורט 5173
npm run build    # tsc --noEmit && vite build
npm run preview  # תצוגה מקדימה של dist
npx tsc --noEmit # בדיקת טיפוסים בלבד, בלי לבנות
```

**אין בפרויקט linter ואין מערכת בדיקות.** `tsc --noEmit` הוא שער האיכות האוטומטי היחיד, ולכן הרץ אותו אחרי כל שינוי. `tsconfig.json` כולל רק `src`, כך ש-`api/lead.ts` **לא נבדק** על ידו.

הרצת השרת: השתמש בחלונית התצוגה (`.claude/launch.json`, קונפיגורציה `gutman-dev`), לא ב-Bash.

דגלי סביבה בזמן build:
- `VITE_SINGLE_FILE=1` — חבילה אחת בלי code-splitting, לתצוגה מקדימה עצמאית.
- `VITE_HASH_ROUTER=1` — HashRouter במקום BrowserRouter, כדי שהתצוגה תרוץ מכל נתיב.
- `VITE_LEAD_ENDPOINT` — עוקף את `/api/lead` (ראה `.env.example`).

## ארכיטקטורה

### מעטפת העמוד (`src/components/Layout.tsx`)

כל הראוטים חוץ מ-`/coming-soon` יושבים תחת `Layout`, שמחזיק ארבע מערכות שמדברות זו עם זו. שינוי באחת שובר בדרך כלל אחרת:

1. **Lenis (גלילה חלקה)** — רץ רק בדסקטופ (`pointer: coarse` פוסל) ורק כשאין `prefers-reduced-motion`. המופע נחשף כ-`window.__lenis` כדי ששאר האתר יוכל לעצור ולהפעיל אותו.
2. **`ScrollManager`** — מאפס גלילה בכל מעבר עמוד. `window.scrollTo` לבדו לא מספיק: Lenis מחזיק מיקום משלו ודוחף אותו חזרה בפריים הבא. האיפוס עובר דרך `lenis.scrollTo(0, { immediate: true, force: true })` ואז `resize()` בפריים הבא.
3. **`PageTransition`** — **בכוונה בלי `AnimatePresence`.** `mode="wait"` נתקע כשלוחצים שני לינקים ברצף מהיר, ו-`popLayout` שובר כל `AnimatePresence` מקונן (הפופאפים נתקעים ב-DOM). ה-`key` על `pathname` מספיק. אל תחזיר `AnimatePresence` לכאן.
4. **שכבות רקע גלובליות** — `ParallaxGridCanvas`, `film-grain` ו-`page-lines` יושבות בקואורדינטות z קבועות. שים לב ל-`z-index` כשאתה מוסיף שכבה.

### נעילת גלילה לפופאפים (`src/lib/scrollLock.ts`)

**כל פופאפ, מודאל או תפריט מסך-מלא חייב לעבור דרך `useScrollLock`.** `overflow: hidden` על ה-body לא מספיק, כי Lenis ממשיך לתפוס את הגלגלת והעמוד מרגיש תקוע. ה-hook עוצר את Lenis, ומשחזר את מיקום הגלילה בסגירה.

`markPopupClosed()` / `popupJustClosed()` פותרים באג ספציפי: הסגירה בלחיצה בחוץ קורית ב-`pointerdown`, ושחרור העכבר נוחת על מה שהיה מתחת ופותח את הפופאפ מחדש. חלון החסימה הוא 350ms.

### שער התנועה (`src/lib/motion/useMotionCapability.ts`)

שלוש רמות: `full` (WebGL + אפקטים של מצביע עדין), `css3d` (נפילה חזרה ל-CSS, בלי טעינת Three), `static`. הרמה נקבעת מ-`prefers-reduced-motion`, מ-`navigator.connection.saveData`, ומהמחלקה `a11y-reduce-motion` על `documentElement` שתפריט הנגישות מוסיף. תפריט הנגישות משדר `gutman:a11y-change`. קומפוננטות תנועה כבדות חייבות לכבד את הרמה הזאת ולספק נפילה חזרה.

### שכבת התוכן (`src/data/`)

`src/data/` הוא מקור האמת היחיד לתוכן. אין לפזר טקסטים בתוך קומפוננטות.

מודל הקורסים מורכב משני קבצים שמתמזגים בזמן ריצה: `courses.ts` (`COURSES_CORE`) + `coursePages.ts` (`COURSE_PAGE_CONTENT`), דרך `enrichCourse`. הפונקציה **זורקת שגיאה** אם חסר תוכן עמוד לסלאג, וכך גם `ACTIVE_COURSES` אם `ACTIVE_COURSE_SLUGS` מפנה לסלאג שלא קיים. כשאתה מוסיף מסלול, עדכן את שני הקבצים. `ACTIVE_COURSE_SLUGS` שולט במה שמוצג באתר, `COURSE_SLUG_ALIASES` שומר על קישורים ישנים, ו-`LEAD_TRACKS` מזין את בורר המסלול בטופס.

### לידים ומדידה

זרימה: טופס → `submitLead` (`src/lib/leads.ts`) → `/api/lead` → Fireberry CRM. הפונקציה ב-`api/lead.ts` רצה בצד שרת בלבד כדי ש-`FIREBERRY_TOKEN` לא יגיע לדפדפן (משתני סביבה מוגדרים ב-Vercel: `FIREBERRY_TOKEN`, `FIREBERRY_OBJECT_TYPE`).

`submitLead` מנסה פעמיים ו**מחזיר `false` בכנות** כשהשליחה נכשלת. אל תחזיר "הצלחה" על סמך הגיבוי ב-localStorage — זו הייתה בדיוק הבאג הקודמת, ולידים נעלמו בדפדפן של הגולש.

Meta Pixel (`src/pixel.ts`) נטען **רק אחרי הסכמת עוגיות** דרך `Consent`. אל תקרא ל-`loadPixel` בשום מקום אחר.

### SEO

`useSeo` (`src/lib/seo.ts`) מזריק title, meta, canonical ו-JSON-LD ישירות ל-`document.head`, כי אין SSR. כל עמוד קורא לו פעם אחת. סכמות מוכנות: `orgSchema`, `courseSchema`, `faqSchema`.

### עיצוב וסטיילינג

- טוקנים (צבעים, גופנים, צללים) ב-`tailwind.config.js`. צבעי המותג: `#191919` דיו, `#ff5f9e` ורוד. הקנבס הנוכחי כהה (`canvas: #0d0c11`).
- `src/index.css` מחזיק שכבת `@layer components` גדולה עם המחלקות הרוחביות (`container-site`, `display-1`, `accent-serif`, `hero-title` ועוד).
- `src/styles/dark-overrides.css` נטען **בנפרד מ-`index.css` בכוונה**, כדי ש-`@apply` של Tailwind לא ישאב את חוקי ההיפוך. הוא הופך טקסט "דיו" לשנהב על הקנבס הכהה, אבל משאיר אותו כהה בתוך משטחים בהירים. אל תמזג אותו פנימה.
- `/coming-soon` נטען ב-`lazy` כדי ש-`coming-soon.css` לא ידלוף לשאר האתר.
- גופנים מקומיים ב-`public/fonts` עם preload ב-`index.html`. אין CDN של גופנים.
- זהירות עם ספציפיות של סלקטורים ב-CSS: מחלקות לפי סקשן ומחלקות לפי אלמנט מבטלות זו את זו, בעיקר במרווחים בין סקשנים.

## אילוצי איכות שחייבים להישמר

- **RTL מלא.** `html lang="he" dir="rtl"`. השתמש בתכונות לוגיות (`start`/`end`) ולא ב-`left`/`right`.
- אפס גלילה אופקית בכל ראוט וכל רוחב מסך.
- H1 יחיד לעמוד, title ייחודי לעמוד.
- מטרות מגע 44px ומעלה, ניגודיות AA, פוקוס מקלדת נראה.
- `prefers-reduced-motion` מכובד בכל אנימציה.

## כללי תוכן

- **אין להמציא נתונים** — מסלולים, מחירים, תאריכים, המלצות או מספרים. הכול מגיע מ-`src/data/`.
- טון: ישיר, חד, מקצועי, בגובה העיניים. בלי קלישאות AI.
- **בלי em-dash (—) בשום קופי באתר.**
- אין קישורי וואטסאפ. כל פנייה עוברת דרך טופס הלידים, בכוונה, כדי שכל ליד ייספר.

## תיקיות ברמת השורש

- `legacy/` — קוד המקור מה-repo הקודם. מקור התייחסות בלבד, לא נבנה.
- `brand/` — נכסי המותג. הלוגו הרשמי הוא `logo-cutout.png`, ו-`logo-white.png` לרקעים כהים.
- `.agents/skills/` — סקילים שנשמרו בריפו (`apple-design`, `ui-ux-pro-max`, `design-lead`). Claude Code **לא** טוען אותם אוטומטית מהנתיב הזה; קרא אותם ידנית אם צריך.
- `api/` — פונקציות Vercel. `vercel.json` מחזיק rewrites של SPA שמחריגים את `/api/` ו-`/assets/`.

## הערה על HANDOFF.md

`HANDOFF.md` הוא מסמך היסטורי מתחילת הפרויקט. הרקע העסקי, כללי המותג והחלטות העיצוב שנפסלו עדיין תקפים ושווים קריאה, אבל **הכיוון הוויזואלי שמתואר בו (קנבס בהיר `#f4f4f2`) כבר לא נכון** — האתר עבר מאז לקנבס כהה. סמוך על `tailwind.config.js` ועל הקוד, לא על המסמך.
