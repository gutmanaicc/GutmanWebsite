import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useMotionCapability } from "../../lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** Enter rotateX in degrees (full capability). Default 11. */
  fromRotateX?: number;
  /** Enter Y offset in px. Default 28. */
  fromY?: number;
  as?: "div" | "article";
};

/**
 * Native-scroll 3D unroll — rotateX + y with spring smoothing as the element
 * enters the viewport. Static / reduced-motion → opacity cross-fade only.
 */
const ScrollReveal3D = ({
  children,
  className = "",
  fromRotateX = 11,
  fromY = 28,
  as = "div",
}: Props) => {
  const level = useMotionCapability();
  const ref = useRef<HTMLElement>(null);
  const Comp = as === "article" ? motion.article : motion.div;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const tiltScale = level === "full" ? 1 : level === "css3d" ? 0.45 : 0;
  const enterRotate = fromRotateX * tiltScale;
  const enterY = fromY * tiltScale;

  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [enterRotate, 0]);
  const yRaw = useTransform(scrollYProgress, [0, 1], [enterY, 0]);
  const opacityRaw = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    level === "static" ? [0.2, 1, 1] : [0.55, 1, 1],
  );

  const rotateX = useSpring(rotateXRaw, { stiffness: 150, damping: 28, mass: 0.35 });
  const y = useSpring(yRaw, { stiffness: 150, damping: 28, mass: 0.35 });
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
        y,
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
