import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Reveal } from "./motion";
import { track } from "../pixel";
import type { VideoTestimonial } from "../data/videoTestimonialsData";

type Props = {
  items: VideoTestimonial[];
  /** כותרת פנימית קצרה. הסקשן שמסביב כבר נושא SectionHeader משלו */
  heading?: string;
  sub?: string;
};

/**
 * עדויות וידאו: נגן אחד גדול + רצועת פרצופים לבחירה.
 *
 * קודם זו הייתה קרוסלה מבוססת-index עם חצים, נקודות, מונה וכרטיסים
 * שכנים מדומדמים שמוקמו אבסולוטית - יותר מדי כרום סביב הווידאו, ובנייד
 * זה נראה עמוס ושבור. כאן:
 *
 *   - נגן יחיד, אנכי, שממלא את רוחב הטלפון. רק אלמנט <video> אחד בכל
 *     העמוד (לא שלושה כמו קודם).
 *   - מתחתיו רצועת תמונות פוסטר קטנות של המשתתפות. הקשה מחליפה את
 *     הווידאו בנגן. הרצועה היא <img> בלבד - אפס עלות וידאו.
 *   - הנגן מתנגן מושתק ובלולאה כשהוא בתוך המסך (IntersectionObserver,
 *     הכתוביות הצרובות נושאות את המסר). כפתור רמקול מוסיף קול, הקשה על
 *     הגוף עוצרת/מפעילה.
 *   - prefers-reduced-motion: לא מתנגן לבד. פוסטר + כפתור נגן, הקשה מנגנת.
 *
 * מסתיר את עצמו כשאין פריטים, וגם כשפוסטר נכשל בטעינה (מלכודת ה-200
 * של public/) - עדיף בלי הסקשן מנגן שבור.
 */
const VideoTestimonialStrip = ({ items, heading = "משתתפות מספרות", sub }: Props) => {
  const reduced = useReducedMotion();

  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const list = items.filter((t) => !broken.has(t.id));

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = list.find((t) => t.id === activeId) ?? list[0];

  const [playing, setPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [inView, setInView] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const played = useRef<Set<string>>(new Set());

  const markBroken = (id: string) =>
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  /* IntersectionObserver על מסגרת הנגן */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const firePlayEvent = useCallback((id: string) => {
    if (played.current.has(id)) return;
    played.current.add(id);
    /* אירוע מדידה: ההשערה שכל זה נבנה בשבילה היא ש"וידאו מחזיק
       יותר זמן". בלי האירוע אי אפשר לדעת אם מישהי צפתה */
    track("VideoTestimonialPlay", { id });
  }, []);

  /*
   * ניגון אוטומטי מושתק כשהנגן בתוך המסך ואין העדפת reduced-motion.
   * החלפת פריט או יציאה מהמסך מאפסים לפוסטר.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;

    /*
     * מושתק/לולאה נקבעים תמיד אימפרטיבית, לפני בדיקת inView. הפרופ
     * muted של <video> ב-React לא מסונכרן אמין (באג ידוע), ולכן זה
     * הסמכות היחידה על מצב הקול.
     */
    v.muted = !soundOn;
    v.loop = !soundOn;

    if (reduced || !inView) {
      v.pause();
      setPlaying(false);
      return;
    }
    v.play()
      .then(() => {
        setPlaying(true);
        firePlayEvent(active.id);
      })
      .catch(() => setPlaying(false));
  }, [active, inView, reduced, soundOn, firePlayEvent]);

  const selab = (t: VideoTestimonial, i: number) =>
    `עדות ${i + 1}${t.name ? ` של ${t.name}` : ""}`;

  const pick = (id: string) => {
    if (id === active?.id) return;
    setActiveId(id);
    setSoundOn(false);
    setPlaying(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const toggleSound = () => {
    const v = videoRef.current;
    const next = !soundOn;
    setSoundOn(next);
    if (v) {
      v.muted = !next;
      v.loop = !next;
      if (next) {
        v.play().then(() => setPlaying(true)).catch(() => undefined);
        if (active) firePlayEvent(active.id);
      }
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => undefined);
      if (active) firePlayEvent(active.id);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (list.length === 0 || !active) return null;

  /* בזמן ניגון: רק הווידאו וכפתור הקול. במנוחה: כהות + נגן + ציטוט. */
  const atRest = !playing;

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

      <Reveal variant="scale" className="mt-5 flex flex-col items-center">
        {/* ── הנגן ── */}
        <div
          ref={frameRef}
          className="relative aspect-[9/16] w-full max-w-[17rem] overflow-hidden rounded-2xl border border-white/10 bg-[#141318] shadow-card sm:max-w-[19rem]"
          style={{ maxHeight: "70vh" }}
        >
          <img
            src={active.poster}
            alt=""
            aria-hidden
            onError={() => markBroken(active.id)}
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/*
            בלי muted/loop כפרופים: הם נקבעים אימפרטיבית באפקט (ראו שם).
            בלי autoPlay: האפקט הוא המנהל היחיד של הניגון.
          */}
          <video
            ref={videoRef}
            key={active.id}
            src={active.video}
            poster={active.poster}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: playing ? 1 : 0 }}
            playsInline
            preload="metadata"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />

          {/* גוף לחיץ: הקשה עוצרת/מפעילה */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "עצירת העדות" : "הפעלת העדות"}
            className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF2D85]/60"
          >
            <span
              className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 transition-opacity duration-300 ${
                atRest ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
            <span
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                atRest ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/90 text-white shadow-lg">
                <Play className="h-6 w-6 translate-x-[1px] fill-white" />
              </span>
            </span>

            {active.quote && (
              <span
                className={`pointer-events-none absolute inset-x-0 bottom-0 p-3.5 transition-opacity duration-300 ${
                  atRest ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="block text-[15px] font-semibold leading-snug text-white drop-shadow">
                  “{active.quote}”
                </span>
              </span>
            )}
          </button>

          {/* כפתור קול */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? "השתקה" : "הפעלת קול"}
            className="absolute end-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/90 backdrop-blur-sm transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/60"
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>

        {(active.name || active.role) && (
          <div className="mt-3 text-center">
            {active.name && (
              <p className="text-sm font-semibold text-bone">{active.name}</p>
            )}
            {active.role && <p className="mt-0.5 text-xs text-bone/55">{active.role}</p>}
          </div>
        )}

        {/* ── רצועת הפרצופים ── */}
        {list.length > 1 && (
          <div
            className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1 [overscroll-behavior-x:contain]"
            role="tablist"
            aria-label="בחירת עדות"
          >
            {list.map((t, i) => {
              const on = t.id === active.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-label={selab(t, i)}
                  onClick={() => pick(t.id)}
                  className={`relative aspect-[9/16] w-12 flex-none overflow-hidden rounded-lg transition sm:w-14 ${
                    on
                      ? "ring-2 ring-[#FF2D85] ring-offset-2 ring-offset-canvas"
                      : "opacity-55 hover:opacity-90"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/60`}
                >
                  <img
                    src={t.poster}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    onError={() => markBroken(t.id)}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </Reveal>
    </div>
  );
};

export default VideoTestimonialStrip;
