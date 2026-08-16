import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { springPress, springSoft, useMotionCapability } from "../../lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** Max pointer tilt in degrees (full capability only). Default 9. */
  tilt?: number;
  /** Hover scale */
  scale?: number;
  /** Lift on hover (px) */
  lift?: number;
  as?: "div" | "article";
  /** Specular sheen following local pointer (full only). */
  sheen?: boolean;
  /** Scroll-driven rotateX unroll as the card enters view. */
  unroll?: boolean;
  /** Press / depress spring on pointer-down. */
  press?: boolean;
};

type DepthProps = {
  children: ReactNode;
  className?: string;
  /** translateZ in px */
  z?: number;
};

/** Elevate a child off the card plane during 3D tilt. */
export const MagneticDepth = ({ children, className = "", z = 28 }: DepthProps) => (
  <div className={`magnetic-depth ${className}`} style={{ transform: `translateZ(${z}px)` }}>
    {children}
  </div>
);

/**
 * Spring scale/lift + magnetic tilt, specular sheen, press depress, and scroll unroll.
 * Heavy 3D / sheen only on motion capability `full`; css3d keeps light hover + mild unroll.
 */
const MagneticCard = ({
  children,
  className = "",
  tilt = 9,
  scale = 1.015,
  lift = -8,
  as = "div",
  sheen = true,
  unroll = true,
  press = true,
}: Props) => {
  const level = useMotionCapability();
  const allowTilt = level === "full" && tilt > 0;
  const allowSheen = level === "full" && sheen;
  const allowUnroll = level !== "static" && unroll;
  const allowHover = level !== "static";
  const allowPress = level !== "static" && press;

  const ref = useRef<HTMLElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(40);
  const sheenOpacityRaw = useMotionValue(0);
  const sheenOpacity = useSpring(sheenOpacityRaw, { stiffness: 260, damping: 28 });
  const idleRotateY = useMotionValue(0);

  const tiltMax = Math.min(Math.max(tilt, 0), 10);
  const pointerRotateXRaw = useTransform(py, [-0.5, 0.5], [tiltMax, -tiltMax]);
  const pointerRotateYRaw = useTransform(px, [-0.5, 0.5], [-tiltMax, tiltMax]);
  const pointerRotateX = useSpring(pointerRotateXRaw, { stiffness: 220, damping: 24, mass: 0.35 });
  const pointerRotateY = useSpring(pointerRotateYRaw, { stiffness: 220, damping: 24, mass: 0.35 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const unrollRaw = useTransform(scrollYProgress, [0, 1], [allowUnroll ? 6 : 0, 0]);
  const unrollRotateX = useSpring(unrollRaw, { stiffness: 160, damping: 26, mass: 0.4 });

  const rotateX = useTransform([unrollRotateX, pointerRotateX], ([unrollV, pointerV]) => {
    const base = allowUnroll ? (unrollV as number) : 0;
    const pointer = allowTilt ? (pointerV as number) : 0;
    return base + pointer;
  });
  const rotateY = allowTilt ? pointerRotateY : idleRotateY;

  const sheenBackground = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.55), rgba(255,255,255,0.08) 32%, transparent 58%)`;

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;

      if (allowTilt) {
        px.set(nx);
        py.set(ny);
      }
      if (allowSheen) {
        sheenX.set((nx + 0.5) * 100);
        sheenY.set((ny + 0.5) * 100);
        sheenOpacityRaw.set(0.9);
      }
    },
    [allowSheen, allowTilt, px, py, sheenOpacityRaw, sheenX, sheenY],
  );

  const onLeave = useCallback(() => {
    px.set(0);
    py.set(0);
    sheenOpacityRaw.set(0);
  }, [px, py, sheenOpacityRaw]);

  const Comp = as === "article" ? motion.article : motion.div;
  const needsPerspective = allowTilt || allowUnroll;

  const style: CSSProperties & Record<string, unknown> = needsPerspective
    ? {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }
    : { transformStyle: "preserve-3d" };

  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      className={`magnetic-card ${className}`}
      style={style}
      whileHover={allowHover ? { scale, y: lift } : undefined}
      whileTap={allowPress ? { scale: 0.97, z: -14 } : undefined}
      transition={allowPress ? springPress : springSoft}
      onPointerMove={allowTilt || allowSheen ? onMove : undefined}
      onPointerLeave={allowHover || allowTilt || allowSheen ? onLeave : undefined}
    >
      {allowSheen ? (
        <motion.div
          className="magnetic-sheen pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
          style={{
            background: sheenBackground,
            opacity: sheenOpacity,
            mixBlendMode: "overlay",
          }}
          aria-hidden
        />
      ) : null}
      {/* contents keeps parent flex/grid layout intact while preserve-3d lives on the card */}
      <div className="contents">{children}</div>
    </Comp>
  );
};

export default MagneticCard;
