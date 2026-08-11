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
   * quiet — restrained supporting sections
   * default — standard unroll
   * signature — louder moments
   */
  intensity?: "quiet" | "default" | "signature";
  as?: "div" | "article";
};

const INTENSITY_SCALE = {
  quiet: 0.55,
  default: 1,
  signature: 1.15,
} as const;

/**
 * Native-scroll multi-axis entrance — directional fly-in + rotateX unroll.
 * Static / reduced-motion → opacity cross-fade only.
 */
const ScrollReveal3D = ({
  children,
  className = "",
  fromRotateX = 11,
  fromY = 28,
  from = "up",
  intensity = "default",
  as = "div",
}: Props) => {
  const level = useMotionCapability();
  const ref = useRef<HTMLElement>(null);
  const Comp = as === "article" ? motion.article : motion.div;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const capabilityScale = level === "full" ? 1 : level === "css3d" ? 0.4 : 0;
  const intensityScale = INTENSITY_SCALE[intensity];
  const travel = fromY * capabilityScale * intensityScale;
  const enterRotate = fromRotateX * capabilityScale * intensityScale;

  const xStart = from === "left" ? -travel : from === "right" ? travel : 0;
  // "up" = rise into view (start below); "down" = drop into view (start above)
  const yStart =
    from === "up" ? travel : from === "down" ? -travel : from === "scale" ? travel * 0.35 : travel * 0.2;
  const scaleStart = from === "scale" ? 0.9 : 1;

  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [enterRotate, 0]);
  const xRaw = useTransform(scrollYProgress, [0, 1], [xStart, 0]);
  const yRaw = useTransform(scrollYProgress, [0, 1], [yStart, 0]);
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [scaleStart, 1]);
  const opacityRaw = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    level === "static" ? [0.2, 1, 1] : [0.45, 1, 1],
  );

  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const x = useSpring(xRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const y = useSpring(yRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const scale = useSpring(scaleRaw, { stiffness: 160, damping: 26, mass: 0.35 });
  const opacity = useSpring(opacityRaw, { stiffness: 180, damping: 30, mass: 0.3 });

  if (level === "static") {
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {children}
      </Comp>
    );
  }

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

export default ScrollReveal3D;
