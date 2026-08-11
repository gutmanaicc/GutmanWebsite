import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Site-wide grid pattern that drifts slower than page content.
 * Sits above the page fill (z-0) and under UI (z-[1]) so the mesh stays visible.
 */
const ParallaxGridCanvas = () => {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * 0.12);

  if (reduced) {
    return <div className="pointer-events-none fixed inset-0 z-0 grid-canvas opacity-90" aria-hidden />;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 grid-canvas opacity-90"
      style={{ y, willChange: "transform" }}
      aria-hidden
    />
  );
};

export default ParallaxGridCanvas;
