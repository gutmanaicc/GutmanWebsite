import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { damp3, dampE } from "maath/easing";
import * as THREE from "three";
import { getPointerSnapshot } from "../../../lib/motion";

const MESH_COUNT = 5;

/**
 * Soft floating meshes + sparse sparkles that lean toward cursor velocity.
 */
const ParticleField = () => {
  const group = useRef<THREE.Group>(null);
  const meshes = useMemo(
    () =>
      Array.from({ length: MESH_COUNT }, (_, i) => {
        const t = i / MESH_COUNT;
        return {
          position: [
            Math.cos(t * Math.PI * 2) * (1.6 + (i % 2) * 0.35),
            Math.sin(t * Math.PI * 2) * 0.85 - 0.1,
            -0.6 - i * 0.15,
          ] as [number, number, number],
          scale: 0.28 + (i % 3) * 0.08,
          speed: 0.6 + i * 0.12,
          distort: 0.18 + (i % 2) * 0.08,
        };
      }),
    [],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const { nx, ny, vx, vy } = getPointerSnapshot();
    const targetX = nx * 0.55 + THREE.MathUtils.clamp(vx * 0.02, -0.35, 0.35);
    const targetY = -ny * 0.4 + THREE.MathUtils.clamp(vy * 0.02, -0.25, 0.25);
    damp3(g.position, [targetX, targetY, 0], 4, delta);
    dampE(g.rotation, [ny * 0.25, nx * 0.35, vx * 0.01], 3.5, delta);
  });

  return (
    <group ref={group}>
      {meshes.map((m, i) => (
        <Float key={i} speed={m.speed} rotationIntensity={0.35} floatIntensity={0.55}>
          <mesh position={m.position} scale={m.scale}>
            <icosahedronGeometry args={[1, 1]} />
            <MeshDistortMaterial
              color={i % 2 === 0 ? "#FF2D85" : "#ff7eb3"}
              emissive="#FF2D85"
              emissiveIntensity={0.18}
              roughness={0.35}
              metalness={0.15}
              transparent
              opacity={0.42}
              distort={m.distort}
              speed={1.4}
            />
          </mesh>
        </Float>
      ))}
      <Sparkles
        count={48}
        scale={[7, 3.5, 2]}
        size={2.2}
        speed={0.25}
        opacity={0.45}
        color="#FF2D85"
      />
    </group>
  );
};

export default ParticleField;
