/**
 * עדויות וידאו של משתתפות - קובץ אחד לכל עדות, תחת /public/videos/testimonials/.
 *
 * למה קובץ נפרד מ-testimonialsData.ts:
 * העדויות הקיימות הן צילומי הודעות (טקסט + תמונה), ולעדות וידאו יש
 * צורת תצוגה אחרת לגמרי. מיזוג לתוך אותו type היה מחייב חצי מהשדות
 * להיות אופציונליים ולפזר תנאים בכל צרכן.
 *
 * למה courseSlugs ולא רשימה שמורה לדף הנחיתה:
 * אותו דפוס כמו studentWorksData.ts - השדה אומר "איפה מציגים", וכך
 * גם /courses/ai-fashion יוכל להציג את אותן עדויות דרך אותו getter.
 *
 * ── מבנה הקובץ ──
 * קובץ אחד בלבד לעדות: public/videos/testimonials/<id>.mp4
 *   - אנכי 9:16, כתוביות עברית צרובות בתוך הווידאו.
 *   - הרצועה מנגנת מושתק בזמן ריחוף, ולכן הכתוביות הן מה שמעביר את המסר.
 *   - הפריים הראשון הוא מה שנראה במנוחה.
 * אין תיקיית פוסטרים ואין קובצי כתוביות נפרדים.
 *
 * מלכודת public/: קובץ חסר תחת public/ מוחזר כ-index.html עם status 200,
 * לא כ-404. אחרי שמוסיפים קובץ ודאו שהוא באמת שם (ls), לא רק בדפדפן.
 */

export type VideoTestimonial = {
  /** זהה לשם קובץ הווידאו (אותיות קטנות, מקף במקום רווח) */
  id: string;
  /*
   * שם המשתתפת. אופציונלי בכוונה: כשאין שם אמיתי מאושר לפרסום, עדיף
   * להציג את הווידאו בלי כיתוב מאשר להמציא שם. הכיתוב התחתון מופיע רק
   * כשיש name או role.
   */
  name?: string;
  /** שורת הקשר קצרה: "בוגרת סדנת האופנה", "מנהלת מותג" וכו' */
  role?: string;
  /*
   * משפט המפתח מתוך העדות, בכתב.
   *
   * נקרא על הכרטיס עוד לפני ריחוף, ולכן הוא עושה חצי מהעבודה גם למי
   * שרק גוללת ולא עוצרת על אף כרטיס. חייב להיות מה שנאמר בפועל.
   */
  quote?: string;
  /** סלאגים של מסלולים שצריכים להציג את העדות */
  courseSlugs: string[];
  /** /videos/testimonials/<id>.mp4 - הקובץ היחיד לעדות הזאת */
  video: string;
  /** ברירת מחדל "portrait" (9:16). "landscape" ל-16:9 */
  orientation?: "portrait" | "landscape";
};

/*
 * חמש עדויות מהמחזור, אנכיות 9:16 עם כתוביות צרובות.
 *
 * name / role / quote עדיין ריקים: צריך את השמות המאושרים לפרסום ואת
 * משפט המפתח של כל אחת מהמשתתפות. עד שהם מגיעים, הכרטיס מציג את הווידאו
 * בלבד בלי כיתוב תחתון - וזה עדיף על שם ממוצא.
 *
 * ה-id שומר את קוד המחזור המקורי (C2122 וכו') כדי שאפשר יהיה להצליב מול
 * הקבצים הגולמיים כשממלאים את הטקסט.
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { id: "c2122", courseSlugs: ["ai-fashion"], video: "/videos/testimonials/c2122.mp4" },
  { id: "c2124", courseSlugs: ["ai-fashion"], video: "/videos/testimonials/c2124.mp4" },
  { id: "c2125", courseSlugs: ["ai-fashion"], video: "/videos/testimonials/c2125.mp4" },
  { id: "c2126", courseSlugs: ["ai-fashion"], video: "/videos/testimonials/c2126.mp4" },
  { id: "c2132", courseSlugs: ["ai-fashion"], video: "/videos/testimonials/c2132.mp4" },
];

export function getVideoTestimonialsForCourse(slug: string): VideoTestimonial[] {
  return VIDEO_TESTIMONIALS.filter((item) => item.courseSlugs.includes(slug));
}
