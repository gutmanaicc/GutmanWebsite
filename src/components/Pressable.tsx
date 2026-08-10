import {
  forwardRef,
  useCallback,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router-dom";
import { motion } from "framer-motion";
import { pressScale, springMorph, springPress, useMotionCapability } from "../lib/motion";

type Ripple = { id: number; x: number; y: number; size: number };

/** Props that collide between React DOM and Framer Motion. */
type MotionConflict =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

type SharedProps = {
  children: ReactNode;
  className?: string;
  /** Softer pink pulse for ghost / secondary CTAs */
  rippleTone?: "ink" | "pink" | "brand";
  /** Disable ripple/scale (e.g. while sending) but keep markup */
  motionDisabled?: boolean;
};

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | MotionConflict> & {
    as?: "button";
  };

type RouterLinkProps = SharedProps &
  Omit<LinkProps, "className" | "children" | MotionConflict> & {
    as: "link";
  };

type AnchorProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | MotionConflict> & {
    as: "a";
    href: string;
  };

export type PressableProps = ButtonProps | RouterLinkProps | AnchorProps;

const MotionLink = motion.create(Link);

const toneClass: Record<NonNullable<SharedProps["rippleTone"]>, string> = {
  ink: "btn-ripple-wave--ink",
  pink: "btn-ripple-wave--pink",
  brand: "btn-ripple-wave--brand",
};

/** Subtle elastic stretch — transform only so hit targets stay stable. */
const morphHover = {
  scaleX: 1.045,
  scaleY: 1.02,
  borderRadius: "999px",
} as const;

function spawnRipple(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  setRipples: React.Dispatch<React.SetStateAction<Ripple[]>>,
) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = clientX - rect.left - size / 2;
  const y = clientY - rect.top - size / 2;
  const id = Date.now() + Math.random();
  setRipples((prev) => [...prev, { id, x, y, size }]);
  window.setTimeout(() => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, 520);
}

const Pressable = forwardRef<HTMLButtonElement | HTMLAnchorElement, PressableProps>(
  function Pressable(props, ref) {
    const level = useMotionCapability();
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const allowMotion = level !== "static" && !props.motionDisabled;
    const allowMorph = level === "full" && !props.motionDisabled;

    const handlePointerDown = useCallback(
      (e: PointerEvent<HTMLElement>) => {
        if (allowMotion && e.button === 0) {
          spawnRipple(e.currentTarget, e.clientX, e.clientY, setRipples);
        }
      },
      [allowMotion],
    );

    const classes = ["btn-pressable", props.className ?? ""].filter(Boolean).join(" ");
    const waveClass = toneClass[props.rippleTone ?? "ink"];

    const rippleLayer = allowMotion ? (
      <span className="btn-ripple-layer" aria-hidden="true">
        {ripples.map((r) => (
          <span
            key={r.id}
            className={`btn-ripple-wave ${waveClass}`}
            style={
              {
                width: r.size,
                height: r.size,
                left: r.x,
                top: r.y,
              } as CSSProperties
            }
          />
        ))}
      </span>
    ) : null;

    const hoverProps = allowMorph ? morphHover : undefined;
    const tapProps = allowMotion ? pressScale(false) : undefined;

    if (props.as === "link") {
      const {
        as: _as,
        children,
        className: _c,
        rippleTone: _t,
        motionDisabled: _m,
        onPointerDown,
        ...linkRest
      } = props;

      return (
        <MotionLink
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          whileHover={hoverProps}
          whileTap={tapProps}
          transition={allowMorph ? springMorph : springPress}
          onPointerDown={(e: PointerEvent<HTMLAnchorElement>) => {
            handlePointerDown(e as unknown as PointerEvent<HTMLElement>);
            onPointerDown?.(e);
          }}
          {...linkRest}
        >
          {rippleLayer}
          <span className="btn-pressable-label">{children}</span>
        </MotionLink>
      );
    }

    if (props.as === "a") {
      const {
        as: _as,
        children,
        className: _c,
        rippleTone: _t,
        motionDisabled: _m,
        onPointerDown,
        ...anchorRest
      } = props;

      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          whileHover={hoverProps}
          whileTap={tapProps}
          transition={allowMorph ? springMorph : springPress}
          onPointerDown={(e: PointerEvent<HTMLAnchorElement>) => {
            handlePointerDown(e as unknown as PointerEvent<HTMLElement>);
            onPointerDown?.(e);
          }}
          {...anchorRest}
        >
          {rippleLayer}
          <span className="btn-pressable-label">{children}</span>
        </motion.a>
      );
    }

    const {
      as: _as,
      children,
      className: _c,
      rippleTone: _t,
      motionDisabled: _m,
      type = "button",
      disabled,
      onPointerDown,
      ...btnRest
    } = props;

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled}
        className={classes}
        whileHover={disabled ? undefined : hoverProps}
        whileTap={disabled || !allowMotion ? undefined : tapProps}
        transition={allowMorph ? springMorph : springPress}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
          handlePointerDown(e as unknown as PointerEvent<HTMLElement>);
          onPointerDown?.(e);
        }}
        {...btnRest}
      >
        {rippleLayer}
        <span className="btn-pressable-label">{children}</span>
      </motion.button>
    );
  },
);

export default Pressable;
