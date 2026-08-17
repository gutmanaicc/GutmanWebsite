import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useMotionCapability } from "../../lib/motion";

export type ScrollRevealFrom = "up" | "down" | "left" | "right" | "scale";

type Props = {
  children: ReactNode;
  className?: string;
  /** Enter rotateX in degrees (full capability). Default 11. */
  fromRotateX?: number;
  /** Enter travel distance in px (also used for directional fly-in). Default 28. */
  fromY?: number;
  /** Spatial entrance direction. */
  from?: ScrollRevealFrom;
  /**
   * quiet - restrained supporting sections
   * default - standard unroll
   * signature - louder moments
   */
  intensity?: "quiet" | "default" | "signature";
  as?: "div" | "article";
};

const INTENSITY_SCALE = {
  quiet: 0.55,
  default: 1,
  signature: 1.15,
} as const;

/** אותו עיקול שהעמוד כולו נע בו, כדי שהחשיפות לא ירגישו כמו מנגנון נפרד */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * מרחק תנועה מינימלי בנייד.
 *
 * "quiet" עם fromY של 28 מגיע ל-15.4px, וזה עדיין נקרא. מתחת לזה
 * החשיפה מפסיקה להיות תנועה ומתחילה להיות רעד, ולכן יש רצפה.
 */
const MOBILE_MIN_TRAVEL = 16;

type Variant = Omit<Props, "as"> & { Comp: typeof motion.div | typeof motion.article };

/**
 * נגישות: החלפה בהצללה בלבד, בלי תנועה בכלל.
 */
const StaticReveal = ({ children, className, Comp }: Variant) => (
  <Comp
    className={className}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    {children}
  </Comp>
);

/**
 * נייד: חשיפה חד-פעמית, לא קשורה לגלילה.
 *
 * הגרסה הקודמת נתנה לנייד את אותה אנימציה של הדסקטופ מוכפלת ב-0.4,
 * ובעמוד אודות זה יצא 6px תנועה ו-1.3 מעלות סיבוב - כלומר שום דבר
 * שאפשר לראות. במקום להקטין תנועה שנבנתה לעכבר, כאן יש תנועה שנבנתה
 * למגע.
 *
 * שני הבדלים מהותיים מהדסקטופ:
 *
 * בלי rotateX. סיבוב על גוש טקסט מחייב את הדפדפן לרסטר את הטיפוגרפיה
 * מחדש בכל פריים, ובמסך קטן הפרספקטיבה גם נראית מעוותת ולא מרשימה.
 *
 * בלי קישור לגלילה. בדסקטופ הערכים נגזרים מ-scrollYProgress דרך
 * קפיצים, כלומר עבודה בכל פריים של גלילה. בנייד אין Lenis שמחליק את
 * הגלילה, ותנופת אצבע על חמישה פרקים בו-זמנית הופכת את זה לקיטועים.
 * חשיפה חד-פעמית רצה פעם אחת ומשחררת את המסלול.
 *
 * once כדי שגלילה חזרה למעלה לא תפעיל הכול שוב.
 */
const MobileReveal = ({ children, className, fromY = 28, from = "up", intensity = "default", Comp }: Variant) => {
  const travel = Math.max(MOBILE_MIN_TRAVEL, fromY * INTENSITY_SCALE[intensity]);

  const offset =
    from === "left"
      ? { x: -travel }
      : from === "right"
        ? { x: travel }
        : from === "down"
          ? { y: -travel }
          : from === "scale"
            ? { scale: 0.94, y: travel * 0.4 }
            : { y: travel };

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </Comp>
  );
};

/**
 * דסקטופ: כניסה רב-צירית שנגזרת ממיקום הגלילה, עם קפיצים.
 */
const FullReveal = ({
  children,
  className,
  fromRotateX = 11,
  fromY = 28,
  from = "up",
  intensity = "default",
  Comp,
}: Variant) => {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const intensityScale = INTENSITY_SCALE[intensity];
  const travel = fromY * intensityScale;
  const enterRotate = fromRotateX * intensityScale;

  const xStart = from === "left" ? -travel : from === "right" ? travel : 0;
  // "up" = rise into view (start below); "down" = drop into view (start above)
  const yStart =
    from === "up" ? travel : from === "down" ? -travel : from === "scale" ? travel * 0.35 : travel * 0.2;
  const scaleStart = from === "scale" ? 0.9 : 1;

  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [enterRotate, 0]);
  const xRaw = useTransform(scrollYProgress, [0, 1], [xStart, 0]);
  const yRaw = useTransform(scrollYProgress, [0, 1], [yStart, 0]);
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [scaleStart, 1]);
  const opacityRaw = useTransform(scrollYProgress, [0, 0.4, 1], [0.45, 1, 1]);

  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const x = useSpring(xRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const y = useSpring(yRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const scale = useSpring(scaleRaw, { stiffness: 160, damping: 26, mass: 0.35 });
  const opacity = useSpring(opacityRaw, { stiffness: 180, damping: 30, mass: 0.3 });

  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      className={className}
      style={{
        opacity,
        x,
        y,
        scale,
        rotateX,
        transformPerspective: 1100,
        transformOrigin: "center top",
      }}
    >
      {children}
    </Comp>
  );
};

/**
 * חשיפה בגלילה, לפי רמת התנועה של המכשיר.
 *
 * ההסתעפות היא בין קומפוננטות ולא בתוך אחת, בכוונה: כך useScroll
 * ו-useSpring לא נקראים בכלל בנייד. כשהם נקראו והתוצאה נזרקה, המנוי
 * לאירועי הגלילה עדיין רץ - כלומר שילמנו את מלוא המחיר של אנימציה
 * שהמשתמש לא ראה.
 */
const ScrollReveal3D = ({ as = "div", ...props }: Props) => {
  const level = useMotionCapability();
  const Comp = as === "article" ? motion.article : motion.div;

  if (level === "static") return <StaticReveal {...props} Comp={Comp} />;
  if (level === "css3d") return <MobileReveal {...props} Comp={Comp} />;
  return <FullReveal {...props} Comp={Comp} />;
};

export default ScrollReveal3D;
