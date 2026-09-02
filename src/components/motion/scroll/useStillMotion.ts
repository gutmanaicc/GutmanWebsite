import { useMotionCapability } from "../../../lib/motion";

/**
 * שאלה אחת שכל פרימיטיב כאן שואל: האם מותר להזיז משהו על המסך.
 *
 * `useMotionCapability` כבר מאחד את שני המקורות שמעניינים אותנו,
 * `prefers-reduced-motion` ברמת מערכת ההפעלה והמחלקה שתפריט הנגישות מוסיף,
 * והוא מגיב לשינוי בהם בזמן ריצה. הרמה "css3d" נובעת ממצביע גס או מחיסכון
 * בנתונים ולא מבקשה של הגולש לעצור תנועה, ולכן היא **לא** נחשבת כאן כעצירה:
 * חשיפה בגלילה בטלפון היא בדיוק המקום שבה היא הכי נחוצה.
 *
 * `prefersStillMotion` הוא בדיקה חד פעמית ולא מגיב לשינוי, ולכן הוא מתאים
 * למטפלי אירועים ולא לרינדור.
 */
export function useStillMotion(): boolean {
  return useMotionCapability() === "static";
}

/**
 * אותו עיקול שכל התנועה באתר נעה בו, כדי שהחשיפות לא ירגישו כמו מנגנון נפרד
 * שהודבק מבחוץ. מוגדר כאן ולא ב-`lib/motion` כדי שהתיקייה הזאת תישאר עצמאית.
 */
export const SCROLL_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * הכיוון הלוגי של הציר האופקי, כמספר.
 *
 * ל-CSS אין `translate` לוגי: `transform: translateX` הוא תמיד פיזי, ולכן
 * אנימציה שאמורה להיפתח מ-inline-start חייבת לדעת אם אנחנו ב-RTL.
 * האתר כולו `dir="rtl"` על `documentElement`, וזה נקרא כאן פעם אחת בזמן
 * הרינדור הראשון: אין הבהוב, ואין הנחה קשיחה שתישבר אם הרכיב יושאל למקום LTR.
 */
export function readInlineSign(): 1 | -1 {
  if (typeof document === "undefined") return -1;
  const dir =
    document.documentElement.getAttribute("dir") ||
    (typeof getComputedStyle === "function" ? getComputedStyle(document.documentElement).direction : "");
  return dir === "rtl" ? 1 : -1;
}
