import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useStillMotion } from "./useStillMotion";

type Props = {
  children: ReactNode;
  className?: string;
  /** טווח הזזה אנכית בפיקסלים לאורך חלון הגלילה של האלמנט */
  y?: [number, number];
  opacity?: [number, number];
  scale?: [number, number];
};

const IDLE_Y: [number, number] = [0, 0];
const IDLE_OPACITY: [number, number] = [1, 1];
const IDLE_SCALE: [number, number] = [1, 1];

/**
 * תנועה שמשועבדת לגלילה, להבדיל מ-`Reveal` שנורית פעם אחת.
 *
 * רק הציר האנכי נחשף בכוונה: הזזה אופקית לאורך גלילה היא הדרך הקצרה ביותר
 * לייצר גלילה אופקית בטלפון, וזה אילוץ קשיח באתר. מי שצריך תנועה אופקית
 * יעטוף אותה בעצמו במכל שחוסם overflow.
 *
 * הערכים מחושבים תמיד, גם כשהפרופ לא הועבר, כי הוקים לא יכולים לרוץ בתנאי.
 * מה שלא הועבר פשוט לא נכנס ל-style, כדי לא לשלם טרנספורם מיותר על אלמנט
 * שרק דוהה.
 */
const ScrollScrub = ({ children, className = "", y, opacity, scale }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const still = useStillMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  /**
   * Lenis מניע גלילה אמיתית ולכן `useScroll` מקבל ממנו ערכים נכונים בלי מאזין
   * משלנו. הקפיץ כאן נועד למכשירי מגע, שבהם הגלילה מגיעה בקפיצות של אירועי
   * מגע ולא מוחלקת בכלל.
   */
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 32, restDelta: 0.001 });

  const yValue = useTransform(progress, [0, 1], y ?? IDLE_Y);
  const opacityValue = useTransform(progress, [0, 1], opacity ?? IDLE_OPACITY);
  const scaleValue = useTransform(progress, [0, 1], scale ?? IDLE_SCALE);

  /**
   * במצב "בלי תנועה" מרנדרים div רגיל במצב הניטרלי: ללא הזזה, אטימות מלאה
   * וקנה מידה 1. חשוב במיוחד כאן, כי טווח `opacity` שמתחיל ב-0 היה מותיר
   * תוכן בלתי נראה לצמיתות אצל מי שביקש לעצור תנועה.
   */
  if (still) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...(y ? { y: yValue } : null),
        ...(opacity ? { opacity: opacityValue } : null),
        ...(scale ? { scale: scaleValue } : null),
        willChange: y || scale ? "transform, opacity" : "opacity",
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollScrub;
