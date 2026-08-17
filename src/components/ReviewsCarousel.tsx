import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Testimonial } from "../data/testimonialsData";

type Props = {
  items: Testimonial[];
  onOpen: (item: Testimonial) => void;
};

/** כמה זמן כרטיס נשאר על המסך לפני שהקרוסלה מתקדמת */
const ADVANCE_MS = 5500;
/** אחרי מגע של המשתמש, כמה זמן הקרוסלה שותקת לפני שהיא חוזרת לזוז */
const RESUME_MS = 9000;

/**
 * קרוסלת ביקורות למובייל: כרטיס אחד במסך, מתקדם לבד, עם הצצה לכרטיס הבא
 * כדי שיהיה ברור שאפשר להחליק.
 *
 * הצילום המלא לא יושב בכרטיס אלא נפתח בלחיצה. החיתוך הקודם הראה רק את
 * החלק העליון של צילום טלפון ארוך - כלומר שורת הסטטוס, בלי אף מילה
 * מההודעה - ולכן הוא רק הגביה את הכרטיס בלי להוסיף מידע.
 */
const ReviewsCarousel = ({ items, onOpen }: Props) => {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  /** חלון שבו הגלילה היא שלנו, כדי שמעקב הגלילה לא ילחם בה */
  const programmaticUntil = useRef(0);
  /** עד מתי הקידום האוטומטי מושתק בגלל מגע של המשתמש */
  const pausedUntil = useRef(0);

  const [active, setActive] = useState(0);
  const count = items.length;

  /**
   * מרכוז כרטיס.
   *
   * הפרש יחסי ולא יעד מוחלט: ב-RTL כרום סופר scrollLeft בטווח שלילי,
   * ולכן חישוב מוחלט נחתך ל-0 והכרטיס נתקע בקצה. הפרש בין מרכז הכרטיס
   * למרכז המסילה במרחב המסך עובד זהה בשני הכיוונים.
   */
  const centerCard = useCallback(
    (index: number, smooth: boolean) => {
      const track = trackRef.current;
      const card = cardRefs.current[index];
      if (!track || !card) return;

      const cardRect = card.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const delta = cardRect.left + cardRect.width / 2 - (trackRect.left + trackRect.width / 2);
      if (Math.abs(delta) < 1) return;

      /*
       * behavior מפורש ולא "auto": "auto" מפנה לערך של scroll-behavior ב-CSS,
       * ולכן קפיצה שאמורה להיות מיידית (גלישה מהסוף להתחלה, או reduced motion)
       * הייתה יוצאת חלקה בכל זאת. מכאן גם שאין scroll-smooth על המסילה.
       */
      programmaticUntil.current = performance.now() + (smooth ? 700 : 120);
      track.scrollBy({ left: delta, behavior: smooth && !reduced ? "smooth" : "instant" });
    },
    [reduced],
  );

  const goTo = useCallback(
    (index: number, smooth = true) => {
      if (!count) return;
      const next = ((index % count) + count) % count;
      setActive(next);
      centerCard(next, smooth);
    },
    [centerCard, count],
  );

  /** מגע של המשתמש עוצר את הקידום האוטומטי לזמן מה */
  const holdAutoplay = useCallback(() => {
    pausedUntil.current = performance.now() + RESUME_MS;
  }, []);

  /* מעקב אחרי גלילה ידנית: הכרטיס שמרכזו הכי קרוב למרכז המסילה הוא הפעיל */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (performance.now() < programmaticUntil.current) return;

        const trackRect = track.getBoundingClientRect();
        const mid = trackRect.left + trackRect.width / 2;
        let best = 0;
        let bestDist = Infinity;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const dist = Math.abs(rect.left + rect.width / 2 - mid);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });

        setActive((prev) => (prev === best ? prev : best));
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /*
   * הקידום האוטומטי.
   *
   * לא מתקדם כשהמשתמש נגע לאחרונה, כשהלשונית מוסתרת, או כשהקרוסלה בכלל
   * לא על המסך - אחרת המשתמש חוזר לסקשן ומוצא אותו במקום אקראי.
   */
  useEffect(() => {
    if (reduced || count < 2) return;

    const track = trackRef.current;
    if (!track) return;

    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    io.observe(track);

    const timer = window.setInterval(() => {
      if (!onScreen || document.hidden) return;
      if (performance.now() < pausedUntil.current) return;

      setActive((prev) => {
        const next = (prev + 1) % count;
        /* חזרה מהסוף להתחלה קופצת בלי אנימציה, אחרת זו סחיפה ארוכה על פני כל הרשימה */
        centerCard(next, next !== 0);
        return next;
      });
    }, ADVANCE_MS);

    return () => {
      window.clearInterval(timer);
      io.disconnect();
    };
  }, [centerCard, count, reduced]);

  if (!count) return null;

  return (
    <div className="md:hidden">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[7.5%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={holdAutoplay}
        onTouchStart={holdAutoplay}
        onWheel={holdAutoplay}
        role="group"
        aria-roledescription="קרוסלה"
        aria-label="ביקורות של משתתפים"
      >
        {items.map((item, i) => (
          <article
            key={item.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="w-[85%] shrink-0 snap-center"
            aria-roledescription="שקופית"
            aria-label={`ביקורת ${i + 1} מתוך ${count}`}
          >
            <button
              type="button"
              onClick={() => {
                holdAutoplay();
                onOpen(item);
              }}
              className="flex h-full w-full flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-right transition-colors hover:border-white/30"
            >
              <p className="text-base font-semibold leading-snug tracking-tight text-bone">
                {item.quote}
              </p>
              <p className="mt-2 line-clamp-5 text-[13px] leading-relaxed text-bone/55">
                {item.text}
              </p>
              <span className="mt-3 text-[12px] font-medium text-brand">הצילום המקורי ←</span>
            </button>
          </article>
        ))}
      </div>

      {/* בלי gap: הריווח הוויזואלי מגיע מאזורי הפגיעה עצמם */}
      <div className="mt-2 flex items-center justify-center" role="tablist" aria-label="מעבר בין ביקורות">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`ביקורת ${i + 1}`}
            onClick={() => {
              holdAutoplay();
              goTo(i);
            }}
            /* אזור פגיעה של 44px סביב נקודה של 6px: הנקודה נשארת עדינה
               ויזואלית, אבל אפשר לפגוע בה באצבע */
            className="group flex h-11 w-6 items-center justify-center"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-brand" : "w-1.5 bg-white/25"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewsCarousel;
