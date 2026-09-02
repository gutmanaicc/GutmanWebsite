import { useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { SCROLL_EASE, readInlineSign, useStillMotion } from "./useStillMotion";

export type RevealVariant = "rise" | "blur" | "mask" | "scale";

type Props = {
  children: ReactNode;
  className?: string;
  /** rise = עלייה + התבהרות; blur = טשטוש שנפתח; mask = חשיפה מתחת למסכה שנפתחת מה-inline-start; scale = התקרבות עדינה */
  variant?: RevealVariant;
  delay?: number;
  /** כמה מהאלמנט צריך להיכנס לתצוגה לפני שמתחיל. ברירת מחדל 0.15 */
  amount?: number;
  as?: "div" | "section" | "li" | "article";
};

/**
 * מיפוי מפורש ולא `motion[as]`, כי אינדוקס דינמי על ה-proxy של framer מייצר
 * טיפוס איחוד שמפוצץ את בדיקת ה-JSX. ההמרה בטוחה: כל הארבעה מקבלים בדיוק
 * את אותם פרופים שאנחנו מעבירים.
 */
const TAGS = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  article: motion.article,
} as const;

const RISE: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

/**
 * `filter` הוא החריג היחיד לכלל "רק transform ו-opacity" בקובץ הזה, והוא
 * מחיר מודע: טשטוש שנפתח אי אפשר לזייף בטרנספורם. הרדיוס נשאר קטן והאנימציה
 * חד פעמית, כך שהצביעה מחדש קורית פעם אחת לאלמנט ולא לאורך הגלילה.
 */
const BLUR: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", y: 10 },
  show: { opacity: 1, filter: "blur(0px)", y: 0 },
};

const SCALE: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1 },
};

const Reveal = ({
  children,
  className = "",
  variant = "rise",
  delay = 0,
  amount = 0.15,
  as = "div",
}: Props) => {
  const still = useStillMotion();
  const [settled, setSettled] = useState(false);
  const [inlineSign] = useState(readInlineSign);
  const Tag = TAGS[as] as typeof motion.div;

  /**
   * הבאגה המסוכנת כאן היא `opacity: 0` שלא מתבטל. במצב "בלי תנועה" לא מרנדרים
   * `initial` בכלל אלא אלמנט רגיל, כדי שגם אם framer ייכשל התוכן עדיין במקומו.
   */
  if (still) {
    const Plain = as as "div";
    return <Plain className={className}>{children}</Plain>;
  }

  const transition = { duration: 0.7, ease: SCROLL_EASE, delay };
  /** `will-change` יורד ברגע שהחשיפה נגמרה: בעמוד עם עשרות חשיפות שכבה קבועה עולה זיכרון GPU על לא כלום. */
  const willChange = settled ? undefined : "transform, opacity";

  if (variant === "mask") {
    /**
     * וילון ולא clip-path: שתי שכבות שנעות בכיוונים הפוכים באותו קצב, כך
     * שהתוכן עומד במקום והחלון שחושף אותו הוא זה שזז. הכל transform, ואין
     * צביעה מחדש של הטקסט בכל פריים.
     *
     * ה-overflow על שתי הרמות מכוון: החיצוני חוסם גלילה אופקית כשהחלון עדיין
     * מחוץ לתמונה, והפנימי הוא המסכה עצמה.
     */
    const enter = `${inlineSign * 100}%`;
    const counter = `${inlineSign * -100}%`;

    return (
      <Tag
        className={className}
        style={{ overflow: "hidden" }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount }}
        variants={{ hidden: {}, show: { transition: { delayChildren: delay } } }}
        onAnimationComplete={() => setSettled(true)}
      >
        <motion.div
          style={{ overflow: "hidden", willChange }}
          variants={{ hidden: { x: enter }, show: { x: 0 } }}
          transition={{ duration: 0.8, ease: SCROLL_EASE }}
        >
          <motion.div
            style={{ willChange }}
            variants={{ hidden: { x: counter }, show: { x: 0 } }}
            transition={{ duration: 0.8, ease: SCROLL_EASE }}
          >
            {children}
          </motion.div>
        </motion.div>
      </Tag>
    );
  }

  const variants = variant === "blur" ? BLUR : variant === "scale" ? SCALE : RISE;

  return (
    <Tag
      className={className}
      style={{ willChange: variant === "blur" && !settled ? "transform, opacity, filter" : willChange }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={transition}
      onAnimationComplete={() => setSettled(true)}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
