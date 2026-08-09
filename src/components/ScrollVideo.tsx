import { useEffect, useRef } from "react";

type Props = {
  video: string;
  videoWebm?: string;
  poster: string;
  alt?: string;
  className?: string;
  /** כמה מהגלילה דרך האלמנט מתורגמת לסרטון. 1 = כל המעבר */
  span?: number;
};

/**
 * וידאו שמתקדם עם הגלילה במקום לנגן לבד.
 *
 * שלוש החלטות שחשוב להכיר:
 * 1. הסרטון לא מנוגן אף פעם. הגלילה מזיזה את currentTime, ולכן צריך
 *    preload="auto" — בלי זה הדפדפן לא יחזיק מספיק buffer כדי לחפש.
 * 2. העדכון יושב ב-rAF יחיד וקורא getBoundingClientRect פעם אחת לפריים,
 *    ורק כשהאלמנט באמת בתוך ה-viewport. מחוץ אליו אין עבודה בכלל.
 * 3. תחת prefers-reduced-motion אין גלילה-וידאו: מוצגת התמונה הסטטית.
 *    גלילה ששולטת בזמן היא בדיוק סוג התנועה שההעדפה הזו נועדה לעצור.
 */
const ScrollVideo = ({ video, videoWebm, poster, alt = "", className, span = 1 }: Props) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = videoRef.current;
    if (!wrap || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let inView = false;
    let raf = 0;
    let target = 0;
    let current = 0;

    const tick = () => {
      raf = 0;
      if (!inView) return;

      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 כשראש האלמנט נוגע בתחתית המסך, 1 כשתחתיתו עוברת את ראשו
      const total = rect.height + vh;
      const passed = vh - rect.top;
      const p = Math.min(1, Math.max(0, passed / total)) * span;

      const dur = el.duration;
      if (Number.isFinite(dur) && dur > 0) {
        target = p * dur;
        // ריכוך: מתקרבים ליעד במקום לקפוץ אליו, כדי שהחיפוש לא ירעד
        current += (target - current) * 0.18;
        if (Math.abs(target - current) < 0.008) current = target;
        if (el.seeking === false) el.currentTime = current;
      }

      if (Math.abs(target - current) > 0.008) raf = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) schedule();
      },
      { threshold: 0 }
    );
    io.observe(wrap);

    const onReady = () => schedule();
    el.addEventListener("loadedmetadata", onReady);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      io.disconnect();
      el.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [span]);

  return (
    <div ref={wrapRef} className={className}>
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={poster}
        aria-label={alt || undefined}
        tabIndex={-1}
      >
        {videoWebm && <source src={videoWebm} type="video/webm" />}
        <source src={video} type="video/mp4" />
      </video>
    </div>
  );
};

export default ScrollVideo;
