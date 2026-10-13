import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { CLIENT_BRANDS } from '../../data/clientBrands';
import { useMotionCapability } from '../../lib/motion/useMotionCapability';

const PIXELS_PER_SECOND = 24;
export default function ClientLogos() {
  const still = useMotionCapability() === 'static';
  const [paused, setPaused] = useState(false);
  const group = useRef<HTMLUListElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const belt = useRef<HTMLDivElement>(null);
  const width = useRef(0);
  const animation = useRef<Animation | null>(null);
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const controls = useRef({ still, paused });
  controls.current.still = still; controls.current.paused = paused;
  const syncPlayback = useCallback(() => {
    const loop = animation.current;
    if (!loop) return;
    if (controls.current.still || controls.current.paused || pointer.current) {
      const time = loop.currentTime;
      loop.pause();
      // Setting hold time makes pause effective immediately, without the
      // extra compositor frame that a pending pause task can otherwise show.
      if (typeof time === 'number') loop.currentTime = time;
    } else loop.play();
  }, []);
  const position = useCallback(() => {
    const time = animation.current?.currentTime;
    return width.current && typeof time === 'number' ? -((time * PIXELS_PER_SECOND / 1000) % width.current) : 0;
  }, []);
  const move = useCallback((delta: number) => {
    if (!width.current || !animation.current) return;
    const next = position() + delta;
    const wrapped = ((next % width.current) + width.current) % width.current - width.current;
    animation.current.currentTime = -wrapped / PIXELS_PER_SECOND * 1000;
  }, [position]);
  useEffect(() => {
    const list = group.current, rail = belt.current, region = viewport.current;
    if (!list || !rail || !region) return;
    const measure = () => {
      const period = list.scrollWidth;
      if (!period || (animation.current && Math.abs(period - width.current) < .5)) return;
      const offset = position(); animation.current?.cancel(); width.current = period;
      // The browser's compositor owns the continuous loop, independent of React
      // renders, Framer's frame scheduler and WebView visibility callbacks.
      animation.current = rail.animate([
        { transform: 'translate3d(0,0,0)' },
        { transform: `translate3d(${-period}px,0,0)` },
      ], { duration: period / PIXELS_PER_SECOND * 1000, iterations: Infinity, easing: 'linear' });
      animation.current.currentTime = ((-offset % period) + period) % period / PIXELS_PER_SECOND * 1000;
      syncPlayback();
    };
    measure();
    const resize = new ResizeObserver(measure); resize.observe(list);
    // Keep the compositor loop independent of WebView intersection reporting.
    // The browser naturally suspends background tabs; accessibility and dragging
    // remain the only explicit pause controls.
    window.addEventListener('pageshow', syncPlayback);
    return () => { resize.disconnect(); window.removeEventListener('pageshow', syncPlayback); animation.current?.cancel(); animation.current = null; };
  }, [position, syncPlayback]);
  useEffect(syncPlayback, [still, paused, syncPlayback]);
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.classList.remove('is-dragging'); syncPlayback();
  };
  return <section className="academy-client-banner" aria-labelledby="academy-client-title">
    <div className="academy-container academy-client-heading"><p className="academy-eyebrow">ניסיון שמגיע מהשטח</p><h2 id="academy-client-title">מותגים שעבדתי איתם.</h2><p>הניסיון מהמותגים האלה מגיע איתי לכל סמינר.</p></div>
    <div ref={viewport} className="academy-client-viewport" dir="ltr" role="region" aria-label="לוגואים של לקוחות. אפשר לגרור, להזיז במקשי החצים, ולהשהות או להפעיל במקש רווח" aria-keyshortcuts="ArrowLeft ArrowRight Space" tabIndex={0} data-motion-mode={still ? 'reduced' : paused ? 'paused' : 'automatic'}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -220 : 220); } else if (event.key === ' ' && !still) { event.preventDefault(); if (event.repeat) return; const next = !controls.current.paused; controls.current.paused = next; syncPlayback(); setPaused(next); } }}
      onPointerDown={event => { if (event.button !== 0) return; pointer.current = { id: event.pointerId, x: event.clientX }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); syncPlayback(); }}
      onPointerMove={event => { if (pointer.current?.id !== event.pointerId) return; move(event.clientX - pointer.current.x); pointer.current.x = event.clientX; }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { pointer.current = null; viewport.current?.classList.remove('is-dragging'); syncPlayback(); }}>
      <div ref={belt} className="academy-client-belt">
        {[0, 1].map(copy => <ul key={copy} ref={copy === 0 ? group : undefined} className="academy-client-logos" aria-hidden={copy === 1 ? true : undefined} aria-label={copy === 0 ? 'לקוחות ופרויקטים' : undefined}>{CLIENT_BRANDS.map(brand => <li key={brand.name}><img src={brand.logo} alt={copy === 0 ? brand.name : ''} loading="eager" decoding="async" width="180" height="70" draggable={false} /></li>)}</ul>)}
      </div>
    </div>
    <span className="sr-only" role="status">{paused ? 'תנועת הלוגואים מושהית' : ''}</span>
  </section>;
}
