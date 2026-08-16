/**
 * סדנאות שטרם נפתחו להרשמה. הן מוצגות באותה שפת כרטיסים של הסדנאות
 * הפעילות, עם תג "בקרוב" ועם כפתור שמצרף לרשימת המתנה במקום הרשמה.
 */

export type UpcomingCourse = {
  /** מזהה יציב, משמש כמקור הליד ובשדה שם הסדנה בטופס ההמתנה */
  slug: string;
  title: string;
  category: string;
  description: string;
};

export const UPCOMING_COURSES: UpcomingCourse[] = [
  {
    slug: "ai-for-developers",
    title: "AI למפתחים",
    category: "פיתוח",
    description:
      "סדנה שתלמד איך לשלב כלי AI בתהליך הפיתוח, כתיבת קוד, פתרון בעיות ובניית מוצרים בצורה מהירה וחכמה יותר.",
  },
  {
    slug: "adhd-with-ai",
    title: "ADHD עם AI",
    category: "התנהלות יומיומית",
    description:
      "סדנה מעשית לשימוש ב-AI לצורך סדר, ארגון, ניהול משימות, למידה, תכנון והתמודדות עם עומס ביום-יום.",
  },
  {
    slug: "ai-interior-architecture",
    title: "AI לעיצוב פנים ואדריכלות",
    category: "עיצוב ואדריכלות",
    description:
      "סדנה שתלמד איך להשתמש ב-AI בתהליכי השראה, קונספט, הדמיות, פרזנטציה ועבודה מול לקוחות.",
  },
  {
    slug: "ai-business-owners",
    title: "AI לבעלי עסקים",
    category: "ניהול עסק",
    description:
      "סדנה פרקטית שבה בעלי עסקים ילמדו לבנות ולשלב כלים שעוזרים לנהל את העסק, כולל CRM, מערכת לניהול חשבוניות ודף נחיתה.",
  },
  {
    slug: "ai-personal-growth",
    title: "AI להתפתחות אישית",
    category: "התפתחות אישית",
    description:
      "סדנה שמשלבת כלים להתפתחות אישית עם AI, במטרה לבנות מערכת או סוכן אישי שעוזר בעבודה על מטרות, הרגלים, מיינדסט והתמודדות עם אתגרים ביום-יום.",
  },
];
