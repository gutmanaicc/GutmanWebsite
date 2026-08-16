import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { damp } from "maath/easing";
import * as THREE from "three";
import { getPointerSnapshot } from "../../../lib/motion";

const PINK = new THREE.Color("#FF2D85");
const NEON = new THREE.Color("#7CFFFB");
const WARM = new THREE.Color("#FFB4D4");
const DEEP = new THREE.Color("#9D174D");
const AMBIENT_START = new THREE.Color("#fff5f9");
const AMBIENT_END = new THREE.Color("#ffe4f0");
const targetKey = new THREE.Color();
const targetFill = new THREE.Color();
const targetAmbient = new THREE.Color();

/**
 * Ambient + point lights that shift hue from cursor position and scroll depth.
 * `--scroll-p` (via pointerStore) deepens/warms the wave as the user leaves the hero.
 */
const ColorWaveLights = () => {
  const key = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const keyColor = useRef(PINK.clone());
  const fillColor = useRef(WARM.clone());

  useFrame((_, delta) => {
    const { nx, ny, scrollP } = getPointerSnapshot();
    // Ease-in as the page scrolls away from the hero
    const scrollEase = scrollP * scrollP;
    const hueShift = THREE.MathUtils.clamp(nx * 0.35 + scrollP * 0.55, -0.35, 0.75);

    targetKey.copy(PINK).lerp(NEON, Math.max(0, hueShift));
    targetKey.lerp(DEEP, scrollEase * 0.42);

    targetFill.copy(WARM).lerp(NEON, Math.max(0, -ny) * 0.35 + scrollP * 0.35);
    targetFill.lerp(DEEP, scrollEase * 0.28);

    targetAmbient.copy(AMBIENT_START).lerp(AMBIENT_END, scrollEase);

    keyColor.current.lerp(targetKey, 1 - Math.exp(-3.5 * delta));
    fillColor.current.lerp(targetFill, 1 - Math.exp(-3.5 * delta));

    if (ambient.current) {
      ambient.current.color.lerp(targetAmbient, 1 - Math.exp(-2.8 * delta));
      ambient.current.intensity = 0.55 + scrollEase * 0.2;
    }

    if (key.current) {
      key.current.color.copy(keyColor.current);
      damp(key.current.position, "x", nx * 2.4, 3.5, delta);
      damp(key.current.position, "y", -ny * 1.6 + 0.4 - scrollEase * 0.35, 3.5, delta);
      key.current.intensity = 1.15 + scrollP * 0.95;
    }
    if (fill.current) {
      fill.current.color.copy(fillColor.current);
      damp(fill.current.position, "x", -nx * 2.1, 3.2, delta);
      damp(fill.current.position, "y", ny * 1.2 - 0.2, 3.2, delta);
      fill.current.intensity = 0.55 + Math.abs(nx) * 0.35 + scrollP * 0.55;
    }
    if (rim.current) {
      rim.current.color.copy(keyColor.current);
      damp(rim.current.position, "x", nx * 0.6, 3, delta);
      damp(rim.current.position, "z", 1.2 + scrollEase * 0.8, 3, delta);
      rim.current.intensity = 0.25 + scrollEase * 0.65;
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.55} color="#fff5f9" />
      <pointLight ref={key} position={[1.2, 0.6, 2.2]} intensity={1.2} distance={10} decay={2} />
      <pointLight ref={fill} position={[-1.6, -0.4, 1.6]} intensity={0.6} distance={9} decay={2} />
      <pointLight ref={rim} position={[0, -0.8, 1.4]} intensity={0.25} distance={8} decay={2} />
    </>
  );
};

export default ColorWaveLights;
