import type { Transition, Variants } from "framer-motion";

/** Critically damped UI spring - matches RegisterModal panel. */
export const springUi: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
};

/** Softer hover settle - cards, chips, focus chrome. */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
};

/** Snappy press feedback on CTAs. */
export const springPress: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
};

/** Elastic hover morph - subtle stretch/breathe, critically damped. */
export const springMorph: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.4,
};

/** Brand pink used for glow, focus, and accent motion. */
export const MOTION_PINK = "#FF2D85";

export const staggerContainer = (stagger = 0.07, delayChildren = 0.04): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const staggerItem = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: springSoft,
        },
      };

export const pressScale = (reduced: boolean) =>
  reduced ? undefined : ({ scale: 0.97 } as const);

export const hoverScale = (reduced: boolean, scale = 1.015) =>
  reduced ? undefined : ({ scale } as const);
