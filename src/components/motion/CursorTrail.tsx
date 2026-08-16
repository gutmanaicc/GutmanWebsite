import { useEffect, useRef } from "react";
import {
  acquirePointerStore,
  getPointerSnapshot,
  useMotionCapability,
} from "../../lib/motion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  /** 0 = brand pink, 1 = soft white */
  tone: number;
};

const MAX_PARTICLES = 48;
const EMIT_SPEED = 0.55;

/**
 * Lightweight Canvas 2D cursor trail - full capability only.
 * pointer-events-none; pauses while the tab is hidden.
 */
const CursorTrail = () => {
  const level = useMotionCapability();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = level === "full";

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const release = acquirePointerStore();
    const particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let lastEmit = 0;
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const emit = (x: number, y: number, vx: number, vy: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const speed = Math.hypot(vx, vy);
      const life = 260 + Math.min(200, speed * 16);
      particles.push({
        x,
        y,
        vx: vx * 0.32 + (Math.random() - 0.5) * 0.35,
        vy: vy * 0.32 + (Math.random() - 0.5) * 0.35,
        life,
        maxLife: life,
        size: 2 + Math.min(4, speed * 0.32) + Math.random(),
        tone: Math.random() > 0.64 ? 1 : 0,
      });
    };

    const tick = (now: number) => {
      if (!running) return;

      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const { x, y, vx, vy } = getPointerSnapshot();
      const speed = Math.hypot(vx, vy);

      if (speed > EMIT_SPEED && now - lastEmit > 16) {
        emit(x, y, vx, vy);
        if (speed > 2.4) emit(x - vx * 0.45, y - vy * 0.45, vx * 0.65, vy * 0.65);
        lastEmit = now;
      }

      ctx.clearRect(0, 0, cssW, cssH);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life -= 16;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;

        const t = p.life / p.maxLife;
        const alpha = t * t * 0.5;
        const r = p.size * (0.7 + t * 0.5);

        // Soft glow disc
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
        if (p.tone > 0.5) {
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        } else {
          gradient.addColorStop(0, `rgba(255, 45, 133, ${alpha})`);
          gradient.addColorStop(0.55, `rgba(255, 45, 133, ${alpha * 0.35})`);
          gradient.addColorStop(1, "rgba(255, 45, 133, 0)");
        }

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      release();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
};

export default CursorTrail;
