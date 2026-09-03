/**
 * תמונות הסטילס של סדנת האופנה.
 *
 * תוצרי הווידאו של הסדנה עברו מכאן ל-studentWorksData.ts (מתויגים
 * courseSlugs: ["ai-fashion"]), כדי ששני העמודים - דף הנחיתה הממומן
 * ו-/courses/ai-fashion - יציגו אותם דרך אותו מנגנון גנרי
 * (getStudentWorksForCourse) שכל שאר המסלולים כבר משתמשים בו.
 *
 * שלוש התמונות נשארות כאן כי הן לא Video: אין להן צורת תצוגה משותפת
 * עם StudentWork (וידאו + פוסטר), אלא רשת תמונות שמנוהלת על ידי
 * FashionStillsShowcase.
 */
export type FashionStill = {
  id: string;
  src: string;
  /** תיאור לקורא מסך. לא כיתוב מוצג. */
  alt: string;
};

/**
 * שלוש התמונות הן סדרה אחת ולא שלוש תמונות יפות.
 *
 * אותה דמות, אותה שמלה ואותו חדר משלושה שוטים. זו ההוכחה הישירה
 * ל"דוגמנים שנשארים עקביים לאורך כל הקמפיין" שהעמוד מבטיח בסקשן
 * "מה השתנה", וזה הדבר היחיד בעמוד שמוכיח דווקא את הטענה הזאת.
 * לכן הן חייבות להיות מוצגות יחד ובאותה שורה: מי שרואה אותן בנפרד
 * רואה שלוש תמונות, ומי שרואה אותן זו לצד זו רואה עקביות.
 */
export const FASHION_STILLS: FashionStill[] = [
  {
    id: "white-dress-01",
    src: "/images/works/fashion-white-dress-01.jpg",
    alt: "דוגמנית בשמלה לבנה עומדת בחדר מעץ",
  },
  {
    id: "white-dress-02",
    src: "/images/works/fashion-white-dress-02.jpg",
    alt: "אותה דוגמנית באותה שמלה, יושבת",
  },
  {
    id: "white-dress-03",
    src: "/images/works/fashion-white-dress-03.jpg",
    alt: "אותה דוגמנית באותה שמלה, נשענת",
  },
];
