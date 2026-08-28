import { motion, useReducedMotion } from "framer-motion";

/*
 * מעטפות התנועה של עמוד המסלול.
 *
 * הן ישבו בתוך CourseDetail עד שהעמוד התפצל לסקשנים נפרדים. עכשיו
 * כמה קבצים צריכים בדיוק את אותו קצב הופעה, ועותק שני היה נסחף
 * בשקט ויוצר עמוד עם שני קצבים שונים.
 */

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const MotionSection = ({
  children,
  className,
  id,
  resetKey,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Remount when the course changes so whileInView + stagger re-fire */
  resetKey?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.section
      key={resetKey}
      id={id}
      className={className}
      initial={reduced ? false : "hidden"}
      animate={reduced ? "show" : undefined}
      whileInView={reduced ? undefined : "show"}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
      }}
    >
      {children}
    </motion.section>
  );
};

export const MotionItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : fadeUp}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
