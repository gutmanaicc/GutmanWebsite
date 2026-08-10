import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { acquirePointerStore, useFinePointer } from "../../lib/motion";

type Props = {
  /** Glow radius in px */
  size?: number;
  /** Peak pink opacity 0–1 (ambient: ~0.15–0.25) */
  intensity?: number;
};

/**
 * Site-wide brand-pink spotlight following the cursor.
 * Fixed, pointer-events-none — driven by the shared pointerStore CSS vars.
 */
const PointerGlow = ({ size = 480, intensity = 0.2 }: Props) => {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const enabled = !reduced && fine;

  useEffect(() => {
    if (!enabled) return;
    return acquirePointerStore();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-glow pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle ${size}px at var(--gx, 50vw) var(--gy, 35vh), rgba(255, 45, 133, ${intensity}), transparent 70%)`,
      }}
      aria-hidden
    />
  );
};

export default PointerGlow;
