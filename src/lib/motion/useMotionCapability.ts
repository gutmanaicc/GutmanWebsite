import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useFinePointer } from "./useFinePointer";

export type MotionLevel = "full" | "css3d" | "static";

function readSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  // Treat very slow cellular as a soft power-save signal
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g";
}

/**
 * Site-wide motion capability gate.
 * - full: WebGL hero + fine pointer effects
 * - css3d: CSS perspective / gradient fallbacks (no Three chunk)
 * - static: reduced-motion / comprehension-only
 */
export function useMotionCapability(): MotionLevel {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    setSaveData(readSaveData());

    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    if (!conn || typeof conn.addEventListener !== "function") return;

    const update = () => setSaveData(readSaveData());
    conn.addEventListener("change", update);
    return () => conn.removeEventListener("change", update);
  }, []);

  if (reduced) return "static";
  if (fine && !saveData) return "full";
  return "css3d";
}
