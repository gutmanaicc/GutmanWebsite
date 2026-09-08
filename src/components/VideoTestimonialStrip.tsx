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

/** כמה כרטיסים מכל צד נשארים מורכבים ב-DOM. מעבר לזה לא מרונדרים. */
const NEIGHBOURS = 2;
/** לכמה כרטיסים מכל צד יש אלמנט <video> אמיתי. שאר הכרטיסים הם div. */
const VIDEO_WINDOW = 1;

/**
 * קרוסלת עדויות וידאו, לתוך סקשן ההוכחה בדף הנחיתה.
 *
 * אותו מנגנון כמו StudentWorksCarousel של התוצרים: index הוא מקור האמת
 * היחיד. החצים, הנקודות והגרירה כותבים אליו; המיקום, הניגון והמונה
 * נגזרים ממנו. אין מדידת גלילה ואין טיימרים שמתקנים מיקום.
 *
 * ── ניגון ──
 * רק הכרטיס שבמרכז מתנגן, אוטומטית, מושתק ובלולאה. כל השאר עצורים
 * ומאופסים לפריים הראשון. הניגון קורה רק כשהקרוסלה בתוך חלון הצפייה
 * (IntersectionObserver) - דפדפן עוצר מיוזמתו וידאו מושתק שרץ מחוץ למסך,
 * וזה היה נקרא בטעות כחסימת ניגון.
 *
 * מדוע מושתק: ניגון אוטומטי בלי מחוות משתמש מותר רק כשהווידאו מושתק.
 * הכתוביות צרובות בקובץ ולכן המסר עובר גם בלי קול. כפתור קטן מוסיף קול.
 *
 * לא <section> ולא container-site: יושב בתוך סקשן קיים ("לא הבטחות.
 * תוצרים והודעות."), בין כרטיסי המנחים לעדויות הטקסט.
 *
 * מסתיר את עצמו כשאין פריטים, וגם כשקובץ וידאו נכשל בטעינה (המלכודת של
 * public/ שמחזיר 200 עם HTML במקום 404).
 */
const VideoTestimonialStrip = ({ items, heading = "משתתפות מספרות", sub }: Props) => {
  const reduced = useReducedMotion();

  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const visible = items.filter((item) => !broken.has(item.id));
  const count = visible.length;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [unmuted, setUnmuted] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [inView, setInView] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const played = useRef<Set<string>>(new Set());
  /*
   * unmuted דרך ref, לא dep של אפקט הניגון.
   *
   * כשהוא היה ב-deps, כל הקשה על כפתור הקול הריצה מחדש את כל מחזור
   * הניגון: setPlaying(false) בראש האפקט הבהב את אייקון ה"נגן" על המסך
   * עד ש-onPlaying החזיר אותו. עכשיו כפתור הקול משנה רק את video.muted,
   * ומצב הניגון לא נוגע.
   */
  const unmutedRef = useRef(unmuted);
  unmutedRef.current = unmuted;

  const markBroken = (id: string) =>
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  /* מרחק מעגלי מסומן: -half..half, כדי שהמעבר בין האחרון לראשון לא יקפוץ */
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

  /* אם כרטיס נשבר וה-index יצא מהטווח */
  useEffect(() => {
    if (count > 0 && index > count - 1) setIndex(0);
  }, [count, index]);

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

  const cardWidth = Math.min(Math.max(stageWidth * 0.62, 190), 250);
  const gap = stageWidth < 480 ? 14 : 20;

  /*
   * ניגון: הפעיל מנגן, כל השאר עצורים ומאופסים.
   * play() מוחזר כהבטחה שנדחית כשהדפדפן חוסם, ולכן נתפס במפורש למצב blocked.
   */
  /*
   * deps מכוונים: [index, inView] בלבד.
   * לא visible/items - מערכים חדשים בכל רינדור שהיו מריצים בלולאה.
   * לא unmuted - הקשה על הקול לא צריכה להריץ מחדש את מחזור הניגון
   * (ראו ההערה ליד unmutedRef). ערך ההשתקה נקרא מה-ref בזמן ריצה.
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
      const muted = !unmutedRef.current;
      video.muted = muted;
      if (muted) video.setAttribute("muted", "");
      else video.removeAttribute("muted");
      video.playsInline = true;
      video.play().catch(() => setBlocked(true));
    });
  }, [index, inView]);

  /*
   * שחרור אחרי המחווה הראשונה של המשתמש.
   * iOS חוסם ניגון אוטומטי במצב חיסכון בסוללה גם כשמושתק. אחרי מגע או
   * גלילה כלשהם הדפדפן מכיר במחווה, ואז play() מצליח.
   */
  useEffect(() => {
    if (!blocked) return;
    const retry = () => {
      const video = videoRefs.current.get(index);
      if (!video) return;
      video.muted = !unmutedRef.current;
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

  const toggleSound = () => {
    const next = !unmuted;
    setUnmuted(next);
    const active = videoRefs.current.get(index);
    if (active) active.muted = !next;
  };

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
    /* התוכן הולך עם האצבע: גרירה ימינה מביאה למרכז את הכרטיס שמשמאל,
       וב-RTL זה index + 1 */
    if (dx > 0) goNext();
    else goPrev();
  };

  if (items.length === 0 || count === 0) return null;

  const arrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-bone backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <Reveal>
        <div className="text-center">
          <h3 className="font-display text-base font-bold tracking-tight text-bone sm:text-lg">
            {heading}
          </h3>
          {sub && (
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-bone/55">{sub}</p>
          )}
        </div>
      </Reveal>

      <div className="relative mt-6">
        <div
          ref={stageRef}
          /* overflow-hidden חובה: הכרטיסים השכנים ממוקמים אבסולוטית ונדחפים
             החוצה, ובלי החיתוך הם יוצרים גלילה אופקית בעמוד */
          className="relative mx-auto overflow-hidden touch-pan-y select-none"
          style={{ height: cardWidth ? cardWidth * (16 / 9) + 56 : undefined }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragX.current = null)}
        >
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className={`${arrowClass} right-1 sm:right-2`}
                aria-label="העדות הקודמת"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goNext}
                className={`${arrowClass} left-1 sm:left-2`}
                aria-label="העדות הבאה"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
            </>
          )}

          {visible.map((item, i) => {
            const d = deltaOf(i);
            if (Math.abs(d) > NEIGHBOURS) return null;

            const isActive = d === 0;
            const hasVideo = Math.abs(d) <= VIDEO_WINDOW;
            const portrait = item.orientation !== "landscape";
            /* RTL: הבא יושב משמאל, ולכן ההיסט שלילי ככל שמתקדמים */
            const x = -d * (cardWidth + gap);

            return (
              <article
                key={item.id}
                className="absolute top-0 overflow-hidden rounded-3xl border bg-[#141318] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]"
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
                  className={`relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                    portrait ? "aspect-[9/16]" : "aspect-video"
                  }`}
                  tabIndex={isActive ? undefined : -1}
                  onClick={() => (isActive ? undefined : setIndex(i))}
                  aria-label={
                    isActive
                      ? item.name
                        ? `עדות הווידאו של ${item.name}`
                        : "עדות וידאו"
                      : `מעבר לעדות${item.name ? ` של ${item.name}` : ""}`
                  }
                >
                  {hasVideo && (
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(i, el);
                        else videoRefs.current.delete(i);
                      }}
                      src={item.video}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted={!unmuted}
                      loop
                      playsInline
                      preload={isActive ? "auto" : "metadata"}
                      onError={() => markBroken(item.id)}
                      onPlaying={() => {
                        if (!isActive) return;
                        setPlaying(true);
                        setBlocked(false);
                        if (!played.current.has(item.id)) {
                          played.current.add(item.id);
                          /* אירוע מדידה: ההשערה שכל זה נבנה בשבילה היא
                             ש"וידאו מחזיק יותר זמן". בלי האירוע אי אפשר
                             לדעת אם מישהי צפתה */
                          track("VideoTestimonialPlay", { id: item.id });
                        }
                      }}
                      onPause={() => isActive && setPlaying(false)}
                    />
                  )}

                  {/* חושך + אייקון נגן על כרטיס שאינו מנוגן */}
                  <span
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
                      isActive && playing ? "opacity-0" : "opacity-100"
                    }`}
                    aria-hidden
                  />
                  {(!isActive || blocked || !playing) && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/90 text-white shadow-lg">
                        <Play className="h-5 w-5 translate-x-[1px] fill-white" />
                      </span>
                    </span>
                  )}

                  {item.quote && (
                    <span
                      className={`pointer-events-none absolute inset-x-0 bottom-0 p-3 transition-opacity duration-200 ${
                        isActive && playing ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <span className="block text-[13px] font-medium leading-snug text-white drop-shadow">
                        “{item.quote}”
                      </span>
                    </span>
                  )}

                  {isActive && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSound();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSound();
                        }
                      }}
                      className="absolute end-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white"
                      aria-label={unmuted ? "השתקה" : "הפעלת קול"}
                    >
                      {unmuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </span>
                  )}
                </button>

                {(item.name || item.role) && (
                  <div className="px-3 py-2.5 text-center">
                    {item.name && (
                      <p className="truncate text-sm font-semibold text-bone">{item.name}</p>
                    )}
                    {item.role && <p className="mt-0.5 truncate text-xs text-bone/50">{item.role}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <p className="mt-4 text-center text-sm font-medium text-bone/50" dir="ltr">
              {index + 1} / {count}
            </p>
            <div
              className="mt-3 flex items-center justify-center gap-2"
              dir="rtl"
              role="tablist"
              aria-label="ניווט עדויות"
            >
              {visible.map((item, i) => (
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
          </>
        )}
      </div>
    </div>
  );
};

export default VideoTestimonialStrip;
