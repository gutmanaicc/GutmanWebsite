import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useStillMotion } from "./useStillMotion";

type Props = {
  className?: string;
  /** ברירת מחדל: currentColor דרך ה-className */
};

/**
 * הקו נמתח ב-`scaleY` ולא ב-`height`, כי גובה משתנה מריץ layout בכל פריים של
 * גלילה. `originY: 0` הוא מה שהופך את ההתארכות לכיוון מטה ולא לשני הכיוונים.
 *
 * הקופסה החיצונית היא גם מד ההתקדמות: המחלקה שמגיעה מבחוץ קובעת לו גובה
 * (בדרך כלל `absolute inset-block-0` בתוך הסקשן), ולכן חלון הגלילה שלו הוא
 * בדיוק חלון הגלילה של המכל שהוא מקשט. אין צורך ב-ref נוסף למכל.
 *
 * הצבע נשאב מ-currentColor, כך שהקורא שולט בו דרך `text-` ב-className בלי
 * פרופ נוסף ובלי צבע מקודד קשיח.
 */
const ScrollLine = ({ className = "" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const still = useStillMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    /**
     * הקו מסיים להימתח כשתחתיתו עדיין באמצע המסך ולא כשהיא יוצאת ממנו למעלה,
     * אחרת המתיחה נגמרת מחוץ לשדה הראייה והגולש לא רואה אותה משלימה.
     */
    offset: ["start 85%", "end 55%"],
  });

  /** קפיץ עדין בלבד: יותר מזה והקו מפגר אחרי הגלילה במקום להיות משועבד לה. */
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const scaleY = useTransform(smooth, [0, 1], [0, 1]);

  /** במצב "בלי תנועה" הקו מצויר במלואו מיד: הוא קישוט, וקישוט חסר נראה כמו תקלה. */
  if (still) {
    return (
      <div ref={ref} className={className} aria-hidden="true">
        <div style={{ width: "100%", height: "100%", backgroundColor: "currentColor" }} />
      </div>
    );
  }

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "currentColor",
          scaleY,
          originY: 0,
          willChange: "transform",
        }}
      />
    </div>
  );
};

export default ScrollLine;
