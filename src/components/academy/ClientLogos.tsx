import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { CLIENT_BRANDS } from '../../data/clientBrands';
import { useMotionCapability } from '../../lib/motion/useMotionCapability';

export default function ClientLogos() {
  const still = useMotionCapability() === 'static';
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const group = useRef<HTMLUListElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const width = useRef(0);
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const x = useMotionValue(0);
  const move = useCallback((delta: number) => {
    if (!width.current) return;
    const next = x.get() + delta;
    x.set(((next % width.current) + width.current) % width.current - width.current);
  }, [x]);
  useEffect(() => {
    if (!group.current || !viewport.current) return;
    const resize = new ResizeObserver(() => { width.current = group.current?.getBoundingClientRect().width || 0; move(0); });
    resize.observe(group.current);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    intersection.observe(viewport.current);
    return () => { resize.disconnect(); intersection.disconnect(); };
  }, [move]);
  useAnimationFrame((_time, delta) => {
    if (visible && !still && !paused && !pointer.current && !document.hidden) move(-Math.min(delta, 64) * .018);
  });
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.classList.remove('is-dragging');
  };
  return <section className="academy-client-banner" aria-labelledby="academy-client-title">
    <div className="academy-container academy-client-heading"><p className="academy-eyebrow">ניסיון שמגיע מהשטח</p><h2 id="academy-client-title">מותגים שעבדתי איתם.</h2><p>הניסיון מהמותגים האלה מגיע איתי לכל סמינר.</p></div>
    <div ref={viewport} className="academy-client-viewport" dir="ltr" role="region" aria-label="לוגואים של לקוחות. אפשר לגרור, להזיז במקשי החצים, ולהשהות או להפעיל במקש רווח" aria-keyshortcuts="ArrowLeft ArrowRight Space" tabIndex={0}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -220 : 220); } else if (event.key === ' ' && !still) { event.preventDefault(); setPaused(value => !value); } }}
      onPointerDown={event => { if (event.button !== 0) return; pointer.current = { id: event.pointerId, x: event.clientX }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); }}
      onPointerMove={event => { if (pointer.current?.id !== event.pointerId) return; move(event.clientX - pointer.current.x); pointer.current.x = event.clientX; }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { pointer.current = null; viewport.current?.classList.remove('is-dragging'); }}>
      <motion.div className="academy-client-belt" style={{ x }}>
        {[0, 1].map(copy => <ul key={copy} ref={copy === 0 ? group : undefined} className="academy-client-logos" aria-hidden={copy === 1 ? true : undefined} aria-label={copy === 0 ? 'לקוחות ופרויקטים' : undefined}>{CLIENT_BRANDS.map(brand => <li key={brand.name}><img src={brand.logo} alt={copy === 0 ? brand.name : ''} loading={copy === 0 ? 'eager' : 'lazy'} decoding="async" width="180" height="70" draggable={false} /></li>)}</ul>)}
      </motion.div>
    </div>
    <span className="sr-only" role="status">{paused ? 'תנועת הלוגואים מושהית' : ''}</span>
  </section>;
}
