export type PointerSnapshot = {
  /** Smoothed cursor X in CSS pixels */
  x: number;
  /** Smoothed cursor Y in CSS pixels */
  y: number;
  /** Smoothed velocity X (px per frame at ~60fps) */
  vx: number;
  /** Smoothed velocity Y (px per frame at ~60fps) */
  vy: number;
  /** Normalized X in [-0.5, 0.5] relative to viewport */
  nx: number;
  /** Normalized Y in [-0.5, 0.5] relative to viewport */
  ny: number;
  /** Page scroll progress 0 - 1 */
  scrollP: number;
};

const DEFAULT: PointerSnapshot = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  nx: 0,
  ny: -0.15,
  scrollP: 0,
};

let snapshot: PointerSnapshot = { ...DEFAULT };
let targetX = 0;
let targetY = 0;
let prevX = 0;
let prevY = 0;
let raf = 0;
let running = false;
let refCount = 0;
let booted = false;

const listeners = new Set<() => void>();

function viewportDefaults() {
  const w = typeof window !== "undefined" ? window.innerWidth : 1;
  const h = typeof window !== "undefined" ? window.innerHeight : 1;
  targetX = w * 0.5;
  targetY = h * 0.35;
  prevX = targetX;
  prevY = targetY;
  snapshot = {
    ...DEFAULT,
    x: targetX,
    y: targetY,
    nx: 0,
    ny: -0.15,
  };
}

function writeCssVars() {
  const root = document.documentElement;
  root.style.setProperty("--gx", `${snapshot.x.toFixed(1)}px`);
  root.style.setProperty("--gy", `${snapshot.y.toFixed(1)}px`);
  root.style.setProperty("--gvx", snapshot.vx.toFixed(3));
  root.style.setProperty("--gvy", snapshot.vy.toFixed(3));
  root.style.setProperty("--scroll-p", snapshot.scrollP.toFixed(4));
}

function notify() {
  listeners.forEach((cb) => cb());
}

function measureScrollP() {
  const el = document.documentElement;
  const max = el.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function onPointerMove(e: PointerEvent) {
  targetX = e.clientX;
  targetY = e.clientY;
}

function onScroll() {
  snapshot.scrollP = measureScrollP();
  writeCssVars();
  notify();
}

function tick() {
  if (!running) return;

  const x = snapshot.x + (targetX - snapshot.x) * 0.14;
  const y = snapshot.y + (targetY - snapshot.y) * 0.14;
  const vx = (x - prevX) * 0.35 + snapshot.vx * 0.65;
  const vy = (y - prevY) * 0.35 + snapshot.vy * 0.65;
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;

  prevX = x;
  prevY = y;
  snapshot = {
    x,
    y,
    vx,
    vy,
    nx: x / w - 0.5,
    ny: y / h - 0.5,
    scrollP: snapshot.scrollP,
  };

  writeCssVars();
  notify();
  raf = requestAnimationFrame(tick);
}

function start() {
  if (running || typeof window === "undefined") return;
  if (!booted) {
    viewportDefaults();
    booted = true;
  }
  running = true;
  snapshot.scrollP = measureScrollP();
  writeCssVars();
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  raf = requestAnimationFrame(tick);
}

function stop() {
  if (!running) return;
  running = false;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("scroll", onScroll);
  cancelAnimationFrame(raf);
  raf = 0;
}

/** Keep the shared pointer bus alive while at least one consumer is mounted. */
export function acquirePointerStore(): () => void {
  refCount += 1;
  if (refCount === 1) start();
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) stop();
  };
}

export function getPointerSnapshot(): PointerSnapshot {
  return snapshot;
}

export function subscribePointerStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
