import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";

type Props = {
  items: string[];
  className?: string;
};

/**
 * רצועה נעה שאפשר לתפוס ולגרור. הלולאה רצה על motion value אחד,
 * הגרירה מזיזה אותו ידנית, והשחרור מחזיר את התנועה מאותה נקודה.
 */
const Marquee = ({ items, className = "" }: Props) => {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const halfWidth = useRef(0);

  useAnimationFrame((_, delta) => {
    if (reduced || dragging.current) return;
    const half = halfWidth.current || (trackRef.current?.scrollWidth ?? 0) / 2;
    halfWidth.current = half;
    if (!half) return;
    /* נעה ימינה: הערך גדל, וכשהוא חוצה חצי רוחב הוא מתגלגל אחורה */
    let next = x.get() + (delta / 1000) * 42; // 42px לשנייה
    if (next >= 0) next -= half;
    x.set(next);
  });

  const row = (dup: boolean) => (
    <div className="flex shrink-0 items-center gap-14" aria-hidden={dup || undefined}>
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="flex select-none items-center gap-14 whitespace-nowrap text-sm font-medium tracking-wide text-bone/70"
        >
          {item}
          <span className="text-brand" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`marquee cursor-grab active:cursor-grabbing ${className}`} dir="ltr">
      <motion.div
        ref={trackRef}
        className="flex w-max"
        dir="rtl"
        style={{ x }}
        drag={reduced ? false : "x"}
        dragConstraints={{ left: -100000, right: 100000 }}
        dragElastic={0}
        dragMomentum
        onDragStart={() => {
          dragging.current = true;
        }}
        onDragEnd={() => {
          dragging.current = false;
          // מחזירים את המיקום לתחום הלולאה כדי שהריצה תמשיך חלק
          const half = halfWidth.current;
          if (half) {
            let v = x.get() % half;
            if (v > 0) v -= half;
            x.set(v);
          }
        }}
      >
        {row(false)}
        {row(true)}
      </motion.div>
    </div>
  );
};

export default Marquee;
