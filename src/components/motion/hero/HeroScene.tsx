import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  acquirePointerStore,
  getPointerSnapshot,
  subscribePointerStore,
} from "../../../lib/motion";
import ColorWaveLights from "./ColorWaveLights";
import ParticleField from "./ParticleField";

/** Wake demand-loop frames whenever the shared pointer bus updates. */
const InvalidateOnPointer = () => {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const release = acquirePointerStore();
    const unsub = subscribePointerStore(() => {
      invalidate();
    });
    // Prime one frame so the scene paints before the first move
    invalidate();
    return () => {
      unsub();
      release();
    };
  }, [invalidate]);

  return null;
};

const Scene = () => (
  <>
    <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={42} />
    <ColorWaveLights />
    <ParticleField />
    <InvalidateOnPointer />
  </>
);

/**
 * R3F hero canvas — only imported via React.lazy from HeroBackdrop.
 * pointer-events-none so UI above stays fully interactive.
 */
const HeroScene = () => (
  <Canvas
    className="h-full w-full"
    dpr={[1, 1.5]}
    frameloop="demand"
    gl={{
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    }}
    camera={{ position: [0, 0, 5.2], fov: 42 }}
    onCreated={({ gl }) => {
      gl.setClearColor(0x000000, 0);
      // Seed scroll var consumers inside the first paint
      void getPointerSnapshot();
    }}
  >
    <Scene />
  </Canvas>
);

export default HeroScene;
