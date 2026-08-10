import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Site-wide grid pattern that drifts slower than page content.
 */
const ParallaxGridCanvas = () => {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * 0.12);

  if (reduced) {
    return <div className="pointer-events-none fixed inset-0 -z-10 grid-canvas opacity-100" aria-hidden />;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 grid-canvas"
      style={{ y, willChange: "transform" }}
      aria-hidden
    />
  );
};

export default ParallaxGridCanvas;
