import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from "lucide-react";
import { Reveal } from "./motion";
import { track } from "../pixel";
import type { VideoTestimonial } from "../data/videoTestimonialsData";

type Props = {
  items: VideoTestimonial[];
  /** כותרת פנימית קצרה. הסקשן שמסביב כבר נושא SectionHeader משלו */
  heading?: string;
  sub?: string;
};

/** כמה כרטיסים מכל צד נשארים מורכבים. מעבר לזה לא ברשת ולא בזיכרון. */
const NEIGHBOURS = 2;
/** לכמה כרטיסים מכל צד יש אלמנט וידאו אמיתי. */
const VIDEO_WINDOW = 1;

/**
 * קרוסלת עדויות וידאו של משתתפות.
 *
 * זהה במכוון לקרוסלת התוצרים (StudentWorksCarousel): index הוא מקור
 * האמת היחיד, הכרטיס הפעיל במרכז בקנה מידה מלא והשכנים מדומדמים
 * ומוקטנים, חצים בצדדים, מונה ונקודות למטה, וגרירה במגע. ההבדל היחיד
 * הוא שכאן זה תת-בלוק בתוך סקשן ההוכחה (בלי <section> משלו ובלי CTA),
 * והכיתוב מתחת הוא שם ותפקיד המשתתפת.
 *
 * מסתיר את עצמו כשאין פריטים.
 */
const VideoTestimonialStrip = ({ items, heading = "משתתפות מספרות", sub }: Props) => {
  const count = items.length;
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [inView, setInView] = useState(false);
  /*
   * ברירת מחדל: קול דלוק. הדפדפן חוסם ניגון אוטומטי עם קול בלי מחוות
   * משתמש, ולכן אפקט הניגון מנסה קודם עם קול, ואם נדחה נופל למושתק
   * ומכבה את הדגל - וכפתור הרמקול חוזר להיות "הפעלת קול".
   */
  const [soundOn, setSoundOn] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const played = useRef<Set<string>>(new Set());
  /*
   * soundOn דרך ref, לא dep של אפקט הניגון. הקשה על כפתור הקול משנה
   * רק את video.muted; אם היא הייתה dep, האפקט היה רץ מחדש, מאפס את
   * playing והווידאו היה "נעצר" (opacity 0, פוסטר) עד שאירוע playing
   * חדש יחזור - וכשהוא כבר מנגן הוא לא יורה אירוע כזה.
   */
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  /* מרחק מעגלי מסומן: -half..half, כדי שהמעבר בין האחרון לראשון לא יעוף */
  const half = Math.floor(count / 2);
  const deltaOf = useCallback(
    (i: number) => {
      if (count === 0) return 0;
      const raw = (((i - index) % count) + count) % count;
      return raw > half ? raw - count : raw;
    },
    [index, count, half],
  );

  const step = useCallback(
    (n: number) => setIndex((prev) => (count === 0 ? 0 : ((prev + n) % count + count) % count)),
    [count],
  );
  /* RTL: פריט 0 הוא הימני ביותר, ולכן החץ השמאלי מתקדם ברשימה */
  const goNext = useCallback(() => step(1), [step]);
  const goPrev = useCallback(() => step(-1), [step]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageWidth(e.contentRect.width));
    ro.observe(el);
    setStageWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cardWidth = Math.min(Math.max(stageWidth * 0.66, 200), 260);
  const gap = stageWidth < 480 ? 14 : 20;

  /*
   * לא מאפסים soundOn בהחלפת כרטיס: אם המשתמש השתיק, נשאר מושתק; אם
   * הדפדפן חסם קול בכרטיס הראשון, נשאר מושתק (וכפתור הקול זמין). רק
   * הטעינה הראשונה מתחילה עם קול דלוק.
   */

  /*
   * ניגון: הפעיל מנגן, כל השאר עצורים ומאופסים. מנסים קודם עם קול;
   * הדפדפן דוחה ניגון אוטומטי עם קול בלי מחוות משתמש, ואז נופלים
   * למושתק (הכתוביות הצרובות נושאות את המסר) ומכבים את soundOn.
   */
  useEffect(() => {
    setPlaying(false);
    setBlocked(false);

    videoRefs.current.forEach((video, i) => {
      if (i !== index || !inView) {
        video.pause();
        if (i !== index) video.currentTime = 0;
        return;
      }
      video.muted = !soundOnRef.current;
      video.playsInline = true;
      video.play().catch(() => {
        if (soundOnRef.current) {
          /* ניגון עם קול נחסם - נפילה למושתק */
          video.muted = true;
          setSoundOn(false);
          video.play().catch(() => setBlocked(true));
        } else {
          setBlocked(true);
        }
      });

      const item = items[i];
      if (item && !played.current.has(item.id)) {
        played.current.add(item.id);
        /* אירוע מדידה: ההשערה שכל זה נבנה בשבילה היא ש"וידאו מחזיק
           יותר זמן". בלי האירוע אי אפשר לדעת אם מישהי צפתה */
        track("VideoTestimonialPlay", { id: item.id });
      }
    });
  }, [index, inView, items]);

  /*
   * הקשה על כפתור הקול: משנה רק את video.muted. השתקה לא עוצרת - הווידאו
   * ממשיך לרוץ עם הכתוביות הצרובות. לא נוגע ב-playing ולא מריץ מחדש את
   * אפקט הניגון.
   */
  const toggleSound = () => {
    const video = videoRefs.current.get(index);
    const next = !soundOn;
    setSoundOn(next);
    if (!video) return;
    video.muted = !next;
    if (video.paused) video.play().then(() => setPlaying(true)).catch(() => undefined);
  };

  /* שחרור אחרי המחווה הראשונה של המשתמש (חסימת iOS במצב חיסכון). */
  useEffect(() => {
    if (!blocked) return;
    const retry = () => {
      const video = videoRefs.current.get(index);
      if (!video) return;
      video.muted = true;
      video.play().then(() => setBlocked(false)).catch(() => undefined);
    };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("touchstart", retry, opts);
    window.addEventListener("scroll", retry, opts);
    window.addEventListener("pointerdown", retry, opts);
    return () => {
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("scroll", retry);
      window.removeEventListener("pointerdown", retry);
    };
  }, [blocked, index]);

  /* גרירה במגע. סף קצר, כדי שהחלקה קלה כבר תעביר כרטיס. */
  const dragX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const startX = dragX.current;
    dragX.current = null;
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < 40) return;
    /* גרירה ימינה מביאה למרכז את הכרטיס שמשמאל, וב-RTL זה index + 1 */
    if (dx > 0) goNext();
    else goPrev();
  };

  if (!count) return null;

  const arrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-bone backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <Reveal>
        <div className="text-center">
          <h3 className="font-display text-[17px] font-bold tracking-tight text-bone sm:text-lg">
            {heading}
          </h3>
          {sub && (
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-bone/60">{sub}</p>
          )}
        </div>
      </Reveal>

      <div className="relative mt-6">
        <div
          ref={stageRef}
          /* overflow-hidden חובה: הכרטיסים השכנים ממוקמים אבסולוטית
             ונדחפים החוצה, ובלי החיתוך הם יוצרים גלילה אופקית בעמוד */
          className="relative mx-auto overflow-hidden touch-pan-y select-none"
          style={{ height: cardWidth ? cardWidth * (16 / 9) + 64 : undefined }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragX.current = null)}
        >
          <button
            type="button"
            onClick={goPrev}
            className={`${arrowClass} right-1 sm:right-2 lg:right-4`}
            aria-label="העדות הקודמת"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            className={`${arrowClass} left-1 sm:left-2 lg:left-4`}
            aria-label="העדות הבאה"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>

          {items.map((item, i) => {
            const d = deltaOf(i);
            if (Math.abs(d) > NEIGHBOURS) return null;

            const isActive = d === 0;
            const hasVideo = Math.abs(d) <= VIDEO_WINDOW;
            /* RTL: הבא יושב משמאל, ולכן ההיסט שלילי ככל שמתקדמים */
            const x = -d * (cardWidth + gap);
            const line1 = item.name ?? item.quote ?? "";
            const line2 = item.role ?? "";

            return (
              <article
                key={item.id}
                className="absolute top-0 rounded-3xl border shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]"
                style={{
                  width: cardWidth,
                  left: "50%",
                  transform: `translateX(calc(-50% + ${x}px)) scale(${isActive ? 1 : 0.88})`,
                  opacity: isActive ? 1 : 0.35,
                  zIndex: 10 - Math.abs(d),
                  transition: reduced
                    ? undefined
                    : "transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 420ms cubic-bezier(0.22,1,0.36,1)",
                  borderColor: isActive ? "rgba(255,45,133,0.5)" : "rgba(255,255,255,0.1)",
                }}
                aria-hidden={!isActive}
              >
                <button
                  type="button"
                  className="relative block aspect-[9/16] w-full overflow-hidden rounded-t-3xl bg-[#141318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  tabIndex={isActive ? undefined : -1}
                  onClick={() => (isActive ? undefined : setIndex(i))}
                  aria-label={isActive ? `עדות ${i + 1}` : `עבור לעדות ${i + 1}`}
                >
                  <img
                    src={item.poster}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={Math.abs(d) <= 1 ? "eager" : "lazy"}
                    decoding="async"
                    aria-hidden
                  />

                  {hasVideo && (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(i, el);
                        else videoRefs.current.delete(i);
                      }}
                      src={item.video}
                      poster={item.poster}
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                      style={{ opacity: isActive && playing ? 1 : 0 }}
                      playsInline
                      preload={isActive ? "auto" : "metadata"}
                      onPlaying={() => isActive && (setPlaying(true), setBlocked(false))}
                      onPause={() => isActive && setPlaying(false)}
                      onEnded={() => isActive && goNext()}
                    />
                  )}

                  {isActive && blocked && inView && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                        <Play className="h-6 w-6 fill-white" aria-hidden />
                      </span>
                    </span>
                  )}
                </button>

                {/* כפתור קול קטן, רק על הכרטיס הפעיל. אח של כפתור הווידאו
                    ולא מקונן בו (button בתוך button לא חוקי). */}
                {isActive && (
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={soundOn ? "השתקה" : "הפעלת קול"}
                    className="absolute end-2.5 top-2.5 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white/90 backdrop-blur-sm transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  </button>
                )}

                <div className="rounded-b-3xl bg-[#141318] px-3 py-3 text-center">
                  <p className="truncate text-sm font-semibold text-bone">{line1}</p>
                  {line2 && <p className="mt-0.5 truncate text-xs text-bone/50">{line2}</p>}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm font-medium text-bone/50" dir="ltr">
          {index + 1} / {count}
        </p>

        <div
          className="mt-3 flex items-center justify-center gap-2"
          dir="rtl"
          role="tablist"
          aria-label="ניווט עדויות"
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`עדות ${i + 1}`}
              className="flex h-11 w-6 items-center justify-center"
              onClick={() => setIndex(i)}
            >
              <span
                className={`block h-2.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-brand" : "w-2.5 bg-white/25"
                }`}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoTestimonialStrip;
