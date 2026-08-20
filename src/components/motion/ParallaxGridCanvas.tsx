import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** גודל המשבצת ב-.grid-canvas. חייב להישאר מסונכרן עם index.css. */
const TILE = 48;

/**
 * רשת הרקע של האתר, נעה לאט יותר מהתוכן.
 *
 * שתי בעיות תוקנו כאן, ושתיהן גרמו לרקע "להיגמר" ולהשאיר שחור.
 *
 * הראשונה: ההיסט היה scrollY * 0.12 בלי גבול, על שכבה בגובה חלון
 * הצפייה בלבד. בעמוד ארוך ההיסט הגיע למאות פיקסלים, השכבה נדחפה למטה,
 * וראש המסך נשאר חשוף. ככל שגללו יותר כך נחשף יותר.
 *
 * הפתרון הוא מודולו על גודל המשבצת: הדוגמה מחזורית כל 48px, ולכן היסט
 * של 48 נראה זהה להיסט 0. התנועה נשמרת, הסחיפה המצטברת נעלמת, ואין
 * גבול שאפשר להגיע אליו.
 *
 * השנייה: גם היסט של עד 48px חושף פס בראש. לכן השכבה נמתחת משבצת אחת
 * מעל ומתחת לחלון במקום לשבת בדיוק עליו.
 */
const ParallaxGridCanvas = () => {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (v * 0.12) % TILE);

  const className =
    "grid-canvas pointer-events-none fixed inset-x-0 -top-12 z-0 h-[calc(100vh+6rem)] opacity-90";

  if (reduced) return <div className={className} aria-hidden />;

  return (
    <motion.div className={className} style={{ y, willChange: "transform" }} aria-hidden />
  );
};

export default ParallaxGridCanvas;
