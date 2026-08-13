import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useFinePointer } from "./useFinePointer";

export type MotionLevel = "full" | "css3d" | "static";

/** Keep in sync with AccessibilityMenu event name */
const A11Y_CHANGE_EVENT = "gutman:a11y-change";

function readSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === "slow-2g" || conn.effectiveType === "2g";
}

function readA11yReduceMotion(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("a11y-reduce-motion");
}

/**
 * Site-wide motion capability gate.
 * - full: WebGL hero + fine pointer effects
 * - css3d: CSS perspective / gradient fallbacks (no Three chunk)
 * - static: reduced-motion / a11y stop-motion / comprehension-only
 */
export function useMotionCapability(): MotionLevel {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const [saveData, setSaveData] = useState(false);
  const [a11yStop, setA11yStop] = useState(readA11yReduceMotion);

  useEffect(() => {
    setSaveData(readSaveData());
    setA11yStop(readA11yReduceMotion());

    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    const updateConn = () => setSaveData(readSaveData());
    const updateA11y = () => setA11yStop(readA11yReduceMotion());

    conn?.addEventListener?.("change", updateConn);
    window.addEventListener(A11Y_CHANGE_EVENT, updateA11y);
    const obs = new MutationObserver(updateA11y);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      conn?.removeEventListener?.("change", updateConn);
      window.removeEventListener(A11Y_CHANGE_EVENT, updateA11y);
      obs.disconnect();
    };
  }, []);

  if (reduced || a11yStop) return "static";
  if (fine && !saveData) return "full";
  return "css3d";
}
