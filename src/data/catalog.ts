// קטלוג הסדנאות של האקדמיה, לפי הסילבוס של רון (9.8.2026). תשע סדנאות:
// שש פעילות ושלוש בסטטוס "בקרוב". הסילבוס המלא לכל סדנה ב-workshops.ts.
// חמישה מסלולי דגל (full=true) מחזיקים עמוד עשיר עם סילבוס מלא מ-courses.ts.
// לשאר יש עמוד תמצית: כותרת, תיאור ותכנים מתוך הטקסט של רון בלבד. לא ממציאים פרטים.

export type CatalogEntry = {
  slug: string;
  title: string;
  blurb: string;
  category: string;
  kind: "מסלול" | "סדנה";
  /** יש עמוד מלא עם סילבוס ב-courses.ts */
  full: boolean;
  /** נפתח בקרוב. מוצג בקטלוג עם תג, בלי טופס הרשמה פעיל */
  soon?: boolean;
  /** סדנת המשך שחיה בתוך עולם תוכן רחב יותר (למשל בעלי עסקים) */
  parent?: string;
};

export const CATALOG: CatalogEntry[] = [
  {
    slug: "social-media-ai",
    title: "AI למנהלות ומנהלי סושיאל",
    blurb:
      "בניית מערך עבודה עם AI לניהול לקוחות: עובד AI לכל לקוח, מחקר, אסטרטגיה, בנק תוכן, כתיבה, קרוסלות, רילסים, אוטומציות וייעול העבודה השוטפת.",
    category: "שיווק ותוכן",
    kind: "מסלול",
    full: true,
  },
  {
    slug: "ai-video-content",
    title: "AI ליוצרי תוכן ועורכי וידאו",
    blurb:
      "יצירת תוכן וסרטונים שלמים בעזרת AI: מרעיון ותסריט, דרך יצירת תמונות ושפה ויזואלית, ועד וידאו, תנועה ועריכה לתוצר מוכן לפרסום.",
    category: "קריאייטיב ווידאו",
    kind: "מסלול",
    full: true,
  },
  {
    slug: "ai-for-students",
    title: "AI לסטודנטים",
    blurb:
      "שימוש ב-AI ללמידה: NotebookLM, GPT ו-Claude, סיכומי חומר, מחקר, הכנה למבחנים, עבודה עם מקורות, מצגות וארגון חומר לימודי.",
    category: "לימודים",
    kind: "מסלול",
    full: true,
  },
  {
    slug: "ai-business-systems",
    title: "AI לבעלי עסקים",
    blurb:
      "שימוש מעשי ב-AI לניהול העסק: אדמיניסטרציה, עבודה עם מידע, לקוחות, תהליכים, CRM, חשבוניות ואוטומציות שחוסכות עבודה ידנית.",
    category: "ניהול עסק",
    kind: "מסלול",
    full: true,
  },
  {
    slug: "ai-landing-page",
    title: "בניית דפי נחיתה עם AI",
    blurb:
      "סדנה מעשית שבה המשתתפים מתכננים, כותבים ובונים דף נחיתה באמצעות AI, ויוצאים עם דף נחיתה אישי.",
    category: "בניית נכסים דיגיטליים",
    kind: "סדנה",
    full: true,
  },
  {
    slug: "ai-for-therapists",
    soon: true,
    title: "AI למטפלים",
    blurb:
      "דיגיטציה וייעול העבודה של מטפלים, כולל מטפלי CBT ומטפלים רגשיים: ניהול רשומות, מעקב אחר מטופלים, מחברת דיגיטלית ומערכת או Skill ייעודי לכל מטופל.",
    category: "טיפול ובריאות",
    kind: "מסלול",
    full: false,
  },
  {
    slug: "ai-interior-design",
    soon: true,
    title: "AI למעצבות ומעצבי פנים",
    blurb:
      "שימוש ב-AI בתהליך העבודה של מעצבי פנים: עבודה עם רינדורים, הפיכת הדמיות לתמונות ריאליסטיות, תוכן לפרויקטים, מצגות, וידאו וכלי AI לעבודה השוטפת.",
    category: "עיצוב פנים",
    kind: "מסלול",
    full: false,
  },
  {
    slug: "ai-adhd",
    soon: true,
    title: "ADHD עם AI",
    blurb:
      "סדנה שמלמדת איך להשתמש ב-AI ככלי להתמודדות עם עומס, ארגון משימות, תכנון, למידה, ניהול מידע ועבודה יומיומית עבור אנשים עם ADHD.",
    category: "פרודוקטיביות",
    kind: "סדנה",
    full: false,
  },
  {
    slug: "fashion-ai-lab",
    title: "בינה מלאכותית באופנה",
    blurb:
      "בניית קמפיין אופנה שלם בעזרת AI: קונספט והשראה, Brand DNA ו-Moodboard, קמפיין תמונות עם דוגמנית עקבית, ווידאו מוגמר.",
    category: "אופנה וקריאייטיב",
    kind: "סדנה",
    full: false,
  },
];

export const getCatalogEntry = (slug: string) => CATALOG.find((c) => c.slug === slug);

/** מפצל תיאור בסגנון "כותרת: א, ב, ג" לרשימת תכנים, מהטקסט של רון בלבד */
export const blurbTopics = (blurb: string): string[] => {
  const colon = blurb.indexOf(":");
  if (colon === -1) return [];
  return blurb
    .slice(colon + 1)
    .replace(/\.$/, "")
    .split(/,| ועד | דרך /)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
};
