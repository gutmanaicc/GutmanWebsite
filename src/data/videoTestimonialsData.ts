/**
 * עדויות וידאו של משתתפות. תחת /public/videos/testimonials/ (הסרטון)
 * ו-/public/images/testimonials/video/ (פריים פוסטר שנחתך מהסרטון).
 *
 * למה קובץ נפרד מ-testimonialsData.ts:
 * העדויות הקיימות הן צילומי הודעות (טקסט + תמונה), ולעדות וידאו יש
 * צורת תצוגה אחרת לגמרי. מיזוג לתוך אותו type היה מחייב חצי מהשדות
 * להיות אופציונליים ולפזר תנאים בכל צרכן.
 *
 * למה courseSlugs ולא רשימה שמורה לדף הנחיתה:
 * אותו דפוס כמו studentWorksData.ts - השדה אומר "איפה מציגים".
 *
 * ── מבנה הקבצים ──
 *   סרטון:  public/videos/testimonials/<id>.mp4   (אנכי 9:16, כתוביות צרובות)
 *   פוסטר:  public/images/testimonials/video/<id>.jpg
 *           (נחתך אוטומטית מהסרטון בשנייה ~1.2. הוא שכבת הבסיס שנטענת
 *            מיד; בייטים של הווידאו יורדים רק בלחיצה/כשנכנס למסך.)
 *
 * מלכודת public/: קובץ חסר תחת public/ מוחזר כ-index.html עם 200, לא 404.
 * VideoTestimonialStrip מוריד פריט שהפוסטר שלו נכשל בטעינה.
 */

export type VideoTestimonial = {
  /** זהה לשם קובץ הווידאו והפוסטר */
  id: string;
  /*
   * שם המשתתפת. אופציונלי: כשאין שם מאושר לפרסום עדיף וידאו בלי כיתוב
   * מאשר שם ממוצא. הכיתוב מתחת לנגן מופיע רק כשיש name או role.
   */
  name?: string;
  /** שורת הקשר קצרה: "בוגרת סדנת האופנה" וכו' */
  role?: string;
  /** משפט המפתח מתוך העדות, בכתב. נקרא על הפוסטר לפני שמנגנים. */
  quote?: string;
  /** סלאגים של מסלולים שצריכים להציג את העדות */
  courseSlugs: string[];
  /** /videos/testimonials/<id>.mp4 */
  video: string;
  /** /images/testimonials/video/<id>.jpg */
  poster: string;
};

/*
 * חמש עדויות מהמחזור, אנכיות 9:16 עם כתוביות צרובות.
 * name / role / quote עדיין ריקים עד שיגיעו הטקסטים המאושרים לפרסום.
 * ה-id שומר את קוד המחזור המקורי (C2122 וכו').
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: "c2122",
    courseSlugs: ["ai-fashion"],
    video: "/videos/testimonials/c2122.mp4",
    poster: "/images/testimonials/video/c2122.jpg",
  },
  {
    id: "c2124",
    courseSlugs: ["ai-fashion"],
    video: "/videos/testimonials/c2124.mp4",
    poster: "/images/testimonials/video/c2124.jpg",
  },
  {
    id: "c2125",
    courseSlugs: ["ai-fashion"],
    video: "/videos/testimonials/c2125.mp4",
    poster: "/images/testimonials/video/c2125.jpg",
  },
  {
    id: "c2126",
    courseSlugs: ["ai-fashion"],
    video: "/videos/testimonials/c2126.mp4",
    poster: "/images/testimonials/video/c2126.jpg",
  },
  {
    id: "c2132",
    courseSlugs: ["ai-fashion"],
    video: "/videos/testimonials/c2132.mp4",
    poster: "/images/testimonials/video/c2132.jpg",
  },
];

export function getVideoTestimonialsForCourse(slug: string): VideoTestimonial[] {
  return VIDEO_TESTIMONIALS.filter((item) => item.courseSlugs.includes(slug));
}
