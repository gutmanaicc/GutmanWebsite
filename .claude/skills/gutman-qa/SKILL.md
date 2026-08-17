---
name: gutman-qa
description: מריץ סבב QA על אתר Gutman Academy לפני עלייה לאוויר או אחרי שינוי בסקרול, בפופאפים, בקרוסלה או בפריסה. בודק RTL, גלילה אופקית, התנהגות Lenis מול פופאפים, נגישות ורספונסיביות בכל הראוטים. השתמש כשמבקשים "בדוק את האתר", "QA", "בדיקה לפני עלייה", או אחרי עבודה על Layout, scrollLock, קרוסלה או מודאלים.
---

# סבב QA לאתר Gutman Academy

סבב הבדיקות של האתר. המטרה היא לתפוס את הרגרסיות שחוזרות בפרויקט הזה שוב ושוב, לא לבדוק הכול מחדש.

## איך מריצים

הרץ את שרת הפיתוח דרך חלונית התצוגה (`preview_start` עם `{name: "gutman-dev"}`), ובדוק עם כלי הדפדפן: `read_page`, `read_console_messages`, `javascript_tool`, `resize_window`, `computer`.

אם מבקשים ריצה סקריפטית וחוזרת במקום, השתמש בסקיל `webapp-testing` (Playwright) עם `--server "npm run dev" --port 5173`.

**מגבלה ידועה של הסביבה:** צילומי מסך של החלונית נצבעים שחור כשהעמוד גלול. כדי לבדוק סקשן באמצע העמוד, הסתר את הסקשנים שלפניו (`display: none` דרך `javascript_tool`) וצלם בגלילה 0.

## הראוטים לסריקה

```
/  /about  /courses  /reviews  /register  /thank-you  /privacy  /accessibility  /coming-soon
/courses/:slug ו-/syllabus/:slug עבור חמשת הסלאגים הפעילים:
ai-for-therapists  ai-fashion  social-media-ai  ai-video-content  ai-for-students
```

מקור האמת לרשימה: `ACTIVE_COURSE_SLUGS` ב-`src/data/courses.ts`. אם היא השתנתה, קרא אותה מחדש במקום להסתמך על הרשימה כאן. `/coming-soon` נבדק בנפרד — הוא טוען CSS משלו ואינו יושב תחת `Layout`.

## הבדיקות

### 1. גלילה אופקית

הבאג הכי חוזר באתר. בכל ראוט וברוחב 375 / 768 / 1280:

```js
document.documentElement.scrollWidth - document.documentElement.clientWidth
```

חייב להיות 0. אם לא, אתר את האשם:

```js
[...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
  .slice(0, 10).map(el => el.className || el.tagName)
```

### 2. פופאפים מול Lenis

זה הזוג שנשבר הכי הרבה. לכל פופאפ (`RegisterModal`, `WaitlistModal`, `InstructorBioModal`, `ImageLightbox`, `AccessibilityMenu`, תפריט מובייל):

- פתח אותו וגלגל את הגלגלת. **הרקע לא זז.**
- סגור בלחיצה מחוץ לפאנל. הפופאפ **לא נפתח מחדש** מהלחיצה עצמה (חסם `popupJustClosed`, 350ms).
- אחרי הסגירה, העמוד נשאר במיקום הגלילה שהיה בו ולא קופץ לראש.
- אחרי הסגירה, הגלילה החלקה חזרה לעבוד.
- `Esc` סוגר, והפוקוס חוזר לאלמנט שפתח.

בדיקה מהירה שהמצב לא נתקע: `window.__lenis` קיים אחרי סגירה, ו-`document.body.style.overflow` ריק.

### 3. מעברי עמוד

- לחץ על שני לינקים בניווט **ברצף מהיר**. העמוד השני חייב להיטען. זו הרגרסיה שהחזרת `AnimatePresence` ל-`Layout` יוצרת.
- כל מעבר עמוד נוחת בראש העמוד.
- לינק עם `#registration-form` גולל לטופס וממקד את שדה "שם מלא".

### 4. קרוסלת עבודות הסטודנטים

`StudentWorksCarousel` — לופ אינסופי עם זיהוי כרטיס פעיל:

- גרירה לשני הכיוונים לא מייצרת קפיצה או רווח בלופ.
- הכרטיס הפעיל מזוהה נכון אחרי כמה מחזורים מלאים.
- הקרוסלה מחזיקה את מקומה אחרי פתיחה וסגירה של לייטבוקס.
- במובייל: גרירה במגע עובדת ולא חוטפת את גלילת העמוד אנכית.

### 5. RTL

- `document.dir === "rtl"` בכל ראוט.
- אין מספרים או טקסט לטיני שנשבר לכיוון הפוך (טלפון, מחירים, שמות כלים).
- אייקוני חצים מצביעים לכיוון הנכון בעברית.
- ריפוד ומרווחים אסימטריים משתמשים ב-`start`/`end` ולא ב-`left`/`right`.

### 6. נגישות

- H1 יחיד לעמוד: `document.querySelectorAll('h1').length === 1`.
- `document.title` ייחודי לכל ראוט.
- Tab מהראש: לינק "דילוג לתוכן המרכזי" מופיע ראשון ופוקוס נראה לכל אורך המסלול.
- תפריט הנגישות: כל מתג משנה מחלקה על `documentElement` (`a11y-high-contrast`, `a11y-invert`, `a11y-grayscale`, `a11y-highlight-links`, `a11y-readable-font`, `a11y-reduce-motion`, `a11y-big-cursor`) והשינוי נשמר אחרי רענון.
- `a11y-reduce-motion` מפיל את התנועה לרמה `static`: ההירו עובר לתמונה סטטית, Lenis לא רץ.
- מטרות מגע 44px ומעלה במובייל.

### 7. תנועה וביצועים

- עם `prefers-reduced-motion` פעיל (`resize_window` עם emulation, או המתג בתפריט): אין אנימציות, אין WebGL.
- במובייל (375px): Lenis **לא** רץ, `window.__lenis` הוא `undefined`.
- הקונסול נקי משגיאות ומאזהרות React בכל ראוט.
- אין בקשות רשת נכשלות. גופנים נטענים מ-`/fonts` המקומי, לא מ-CDN.

### 8. טופס הלידים

- ולידציה בעברית על שדות חסרים ועל אימייל וטלפון לא תקינים.
- שליחה מוצלחת מנווטת ל-`/thank-you`.
- כישלון שליחה מציג הודעת שגיאה כנה עם דרך יצירת קשר חלופית. **אסור** שכישלון יוצג כהצלחה.
- הפיקסל לא נטען לפני הסכמת עוגיות: לפני אישור הבאנר, `window.fbq` הוא `undefined`.

## דיווח

דווח רק על מה שנכשל, עם הראוט, הרוחב, וצעדי השחזור. אם הכול עבר, אמור את זה בשורה אחת. אל תדווח על בדיקות שדילגת עליהן כאילו עברו.
