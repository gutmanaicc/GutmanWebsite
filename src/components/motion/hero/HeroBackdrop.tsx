import { lazy, Suspense, useEffect } from "react";
import { acquirePointerStore, useMotionCapability } from "../../../lib/motion";
import ParallaxLayer from "../ParallaxLayer";

const HeroScene = lazy(() => import("./HeroScene"));

type CssFallbackProps = {
  animated: boolean;
};

/** Performant CSS orbs — used for css3d/static and as Suspense placeholder. */
const CssHeroFallback = ({ animated }: CssFallbackProps) => {
  if (!animated) {
    return (
      <>
        <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#FF2D85]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-[rgba(255,45,133,0.07)] blur-3xl" />
      </>
    );
  }

  return (
    <>
      <ParallaxLayer
        speed={0.25}
        range={60}
        className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#FF2D85]/10 blur-3xl"
      />
      <ParallaxLayer
        speed={0.15}
        range={50}
        className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-[rgba(255,45,133,0.07)] blur-3xl"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at var(--gx, 50%) var(--gy, 35%), rgba(255,45,133,0.14), transparent 70%)",
        }}
      />
    </>
  );
};

/**
 * Home-hero backdrop: lazy R3F on `full` capability, CSS fallbacks otherwise.
 * Never imports three/fiber at the top level — coarse/mobile skips the chunk.
 */
const HeroBackdrop = () => {
  const level = useMotionCapability();

  useEffect(() => {
    if (level === "static") return;
    return acquirePointerStore();
  }, [level]);

  if (level !== "full") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <CssHeroFallback animated={level === "css3d"} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Suspense fallback={<CssHeroFallback animated />}>
        <div className="absolute inset-0 opacity-90">
          <HeroScene />
        </div>
      </Suspense>
      {/* Soft wash so text stays legible over the mesh — keep light so the grid reads through */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/25 via-transparent to-canvas/45" />
    </div>
  );
};

export default HeroBackdrop;
