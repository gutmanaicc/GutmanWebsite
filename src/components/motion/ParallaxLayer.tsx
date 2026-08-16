import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type Props = {
  children?: ReactNode;
  className?: string;
  /** Parallax strength - positive moves with scroll, negative against. Typical 0.12 - 0.35 */
  speed?: number;
  /** Travel range in px across the element's scroll window */
  range?: number;
};

/**
 * Moves a decorative layer at a different rate than foreground content.
 * Transform-only; no-ops under prefers-reduced-motion.
 */
const ParallaxLayer = ({ children, className = "", speed = 0.2, range = 80 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const travel = range * speed * 5;
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);

  if (reduced) {
    return (
      <div ref={ref} className={className} aria-hidden={children ? undefined : true}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, willChange: "transform" }} aria-hidden={children ? undefined : true}>
      {children}
    </motion.div>
  );
};

export default ParallaxLayer;
