/**
 * פרימיטיבים לאנימציות גלילה.
 *
 * כל הרכיבים כאן חולקים חוזה אחד: כשהגולש ביקש לעצור תנועה, במערכת ההפעלה או
 * בתפריט הנגישות של האתר, הם מרנדרים את התוכן במצבו הסופי מיד ובלי אלמנט
 * מונפש בכלל. חשיפה שנשארת ב-`opacity: 0` היא תוכן שנעלם, ולכן הבדיקה יושבת
 * לפני הרינדור ולא בתוך ה-variants.
 */
export { default as Reveal, type RevealVariant } from "./Reveal";
export { default as KineticHeading } from "./KineticHeading";
export { default as ScrollLine } from "./ScrollLine";
export { default as ScrollScrub } from "./ScrollScrub";
export { default as CountUp } from "./CountUp";
export { useStillMotion, SCROLL_EASE } from "./useStillMotion";
