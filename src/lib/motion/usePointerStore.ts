import { useEffect, useSyncExternalStore } from "react";
import {
  acquirePointerStore,
  getPointerSnapshot,
  subscribePointerStore,
  type PointerSnapshot,
} from "./pointerStore";

/** Subscribe to the shared pointer bus; acquires the rAF loop for this mount. */
export function usePointerStore(): PointerSnapshot {
  useEffect(() => acquirePointerStore(), []);
  return useSyncExternalStore(subscribePointerStore, getPointerSnapshot, getPointerSnapshot);
}
