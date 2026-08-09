import { useEffect, useRef } from "react";

// קהלי היעד של האקדמיה, בלי המילה AI. לבקשת רון (9.8).
const AUDIENCES = [
  "מנהלות ומנהלי סושיאל",
  "יוצרי תוכן ועורכי וידאו",
  "סטודנטים",
  "עולם האופנה",
  "בעלי עסקים",
  "בוני דפי נחיתה",
  "מטפלים",
  "מעצבות ומעצבי פנים",
  "ADHD",
];

/**
 * רצועה נעה של קהלי היעד.
 *
 * מונעת ב-rAF במקום ב-CSS animation משתי סיבות:
 * 1. גרירה: אחיזה עם העכבר או האצבע מזיזה את הרצועה, ועם השחרור
 *    התנועה האוטומטית ממשיכה מאותה נקודה עם האינרציה של הגרירה.
 * 2. לולאה מדויקת: העטיפה מתאפסת על רוחב רצועה אחת, בלי קפיצה.
 *
 * תחת prefers-reduced-motion אין תנועה אוטומטית, אבל הגרירה עדיין עובדת,
 * כי היא תנועה שהמשתמש יוזם.
 */
const Marquee = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const strip = stripRef.current;
    if (!track || !strip) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ב-RTL הרצועה נעה שמאלה, כלומר offset חיובי מוזז ימינה. הכיוון: -1
    const AUTO_SPEED = 0.55; // px לפריים ב-60fps
    let offset = 0;
    let vel = 0; // מהירות שנותרה מגרירה, דועכת
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let stripW = 0;

    const measure = () => {
      stripW = strip.getBoundingClientRect().width;
    };

    const tick = () => {
      if (!dragging) {
        vel *= 0.95;
        if (Math.abs(vel) < 0.05) vel = 0;
        offset -= (reduced ? 0 : AUTO_SPEED) + vel;
      }
      if (stripW > 0) {
        // לולאה: מחזירים את ה-offset לטווח [-stripW, 0)
        offset = ((offset % stripW) + stripW) % stripW ? offset % stripW : 0;
        if (offset <= -stripW) offset += stripW;
        if (offset > 0) offset -= stripW;
      }
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      vel = 0;
      track.setPointerCapture(e.pointerId);
      track.dataset.grabbing = "true";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      offset += dx;
      // האינרציה נגזרת מהתנועה האחרונה, בכיוון הפוך לתנועה האוטומטית
      vel = -dx;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      delete track.dataset.grabbing;
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        /* השחרור כבר קרה */
      }
    };

    measure();
    window.addEventListener("resize", measure);
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    };
  }, []);

  // שתי רצועות זהות: כשהראשונה יוצאת מהמסך, השנייה כבר שם
  const strip = (hidden: boolean, ref?: React.Ref<HTMLDivElement>) => (
    <div className="marquee-strip" aria-hidden={hidden || undefined} ref={ref}>
      {AUDIENCES.map((t) => (
        <span className="marquee-item" key={t}>
          {t}
          <span className="marquee-dot" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" aria-label="קהלי היעד של האקדמיה">
      <div className="marquee-track" ref={trackRef}>
        {strip(false, stripRef)}
        {strip(true)}
        {strip(true)}
      </div>
    </div>
  );
};

export default Marquee;
