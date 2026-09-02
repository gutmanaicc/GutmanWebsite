import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useMotionCapability } from "../../lib/motion";

type Props = {
  /** מחלקות נוספות, בעיקר כדי להזיז את הפס כשהוא יושב מתחת להדר בגובה אחר */
  className?: string;
};

/*
 * כמה הפס מתעכב אחרי הגלילה עצמה.
 *
 * הקפיץ רץ על scaleX בלבד, ולכן הוא לא נוגע ב-layout ולא מבקש מהדפדפן
 * למדוד כלום. הריכוך קיים כי Lenis מזרים גלילה בקצב משלו, ובלי קפיץ
 * הפס מקרטע בין שני מצבים בכל תנועת גלגלת במקום להיגרר אחריה.
 */
const SMOOTHING = { stiffness: 190, damping: 32, mass: 0.24 } as const;

/**
 * כיוון הצמיחה של הפס, לפי כיוון הכתיבה של המסמך.
 *
 * ל-transform-origin אין ערכים לוגיים, ולכן אי אפשר פשוט לכתוב "start".
 * במקום לקבע "ימין" ולשכוח, קוראים פעם אחת את dir מהמסמך: באתר עברי
 * הפס גדל מימין לשמאל כמו הקריאה, ואם ייפתח פה עמוד באנגלית הוא יתהפך
 * לבד במקום להיראות כאילו הוא מתרוקן.
 */
const readGrowOrigin = () => {
  if (typeof document === "undefined") return "right center";
  return document.documentElement.dir === "ltr" ? "left center" : "right center";
};

/**
 * פס התקדמות גלילה לדף הנחיתה.
 *
 * בדף ארוך בלי אינדיקציה אנשים נוטשים באמצע, כי אין להם דרך לדעת אם הם
 * בתחילת הדף או שנשארו שתי פסקאות. הפס הוא התשובה הזולה ביותר לשאלה
 * "כמה עוד", והוא לא תופס שום שטח בפריסה.
 */
const ScrollProgressBar = ({ className = "" }: Props) => {
  const still = useMotionCapability() === "static";
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, SMOOTHING);

  /*
   * במצב "בלי תנועה" הפס ממשיך להתעדכן, ורק הריכוך יורד.
   *
   * מי שביקש לעצור אנימציות ביקש שהמסך יפסיק לזוז מעצמו, לא לוותר על
   * המידע. הפס לא מונפש כשלעצמו: הוא משקף מיקום שהמשתמש יצר בעצמו,
   * ולכן ההיצמדות הישירה לערך הגלילה היא בדיוק ההתנהגות הנכונה שם.
   */
  const scaleX = still ? scrollYProgress : smooth;

  const [growOrigin] = useState(readGrowOrigin);

  return (
    /*
     * הפס יושב על הגבול התחתון של ההדר (sticky top-0, גובה 4.25rem)
     * ובשכבה נמוכה ממנו בכוונה.
     *
     * z-50 שמור להדר ולפאנל התפריט הנייד שנפתח מתחתיו, ופס שיושב מעליהם
     * היה חותך אותם בקו ורוד לרוחב כל המסך. pointer-events-none כי הוא
     * פרוס בדיוק מעל אזור כפתור ה-CTA, וקישוט שבולע קליק על הפעולה
     * שהעמוד קיים בשבילה הוא הנזק היקר ביותר שיש כאן.
     */
    <div
      className={`pointer-events-none fixed top-[4.25rem] start-0 end-0 z-40 h-[3px] ${className}`}
      aria-hidden
    >
      {/* מסילה כמעט שקופה, כדי שיהיה ברור שהפס הוא מדד ולא קו קישוטי אקראי */}
      <div className="absolute inset-0 bg-bone/10" />
      {/*
       * הזוהר נלקח מ-currentColor: box-shadow בלי צבע יורש את color של
       * האלמנט, ולכן text-brand/40 נותן הילה בוורוד המותג בלי לקודד עוד
       * rgba קשיח של #FF2D85 בקוד.
       */}
      <motion.div
        className="relative h-full bg-brand text-brand/40 shadow-[0_0_12px]"
        style={{ scaleX, transformOrigin: growOrigin, willChange: "transform" }}
      />
    </div>
  );
};

export default ScrollProgressBar;
