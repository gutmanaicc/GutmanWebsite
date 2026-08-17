import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { StudentWork } from "../data/studentWorksData";
import SectionHeader, { AccentWord } from "./SectionHeader";
import Pressable from "./Pressable";
import { useRegisterModal } from "../context/RegisterModalContext";

type Props = {
  works: StudentWork[];
};

/** כמה כרטיסים מכל צד נשארים מורכבים. מעבר לזה הם לא ברשת ולא בזיכרון. */
const NEIGHBOURS = 2;
/** לכמה כרטיסים מכל צד יש אלמנט וידאו אמיתי. */
const VIDEO_WINDOW = 1;

/**
 * קרוסלת תוצרי תלמידים.
 *
 * המיקום נגזר ממצב אחד, index, ולא נמדד מהגלילה.
 *
 * הגרסה הקודמת הייתה הפוכה: היא פרסה 27 כרטיסים בגלילה נייטיבית, האזינה
 * לאירועי scroll, ניחשה מתוך המדידה איזה כרטיס במרכז, ותיקנה את עצמה עם
 * שלושה טיימרים (programmaticUntil, userDrivingUntil, normalizeTimer)
 * ששמרו זה על זה מפני מרוצים. משם הגיעו שלוש התקלות: המספר לא תאם את
 * מה שרואים כי הוא נגזר ממדידה שהתעדכנה באיחור, הניגון נקטע כי כל תיקון
 * אינדקס הפעיל מחדש את אפקט ה-play, והחצים "לא הזיזו" כי הנורמליזציה
 * החזירה את המיקום מיד אחריהם.
 *
 * כאן index הוא מקור האמת היחיד: החצים, הנקודות והמגע כותבים אליו,
 * והמיקום, הניגון והמונה נגזרים ממנו. אין מדידה ואין טיימר שמתקן.
 */
const StudentWorksCarousel = ({ works }: Props) => {
  const count = works.length;
  const reduced = useReducedMotion();
  const { openRegisterModal } = useRegisterModal();

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  /*
   * האם הקרוסלה על המסך.
   *
   * זה לא אופטימיזציה אלא תנאי הכרחי: הדפדפן עוצר מיוזמתו וידאו מושתק
   * שמנגן מחוץ לחלון הצפייה. בדקתי את זה - האזנתי לאירועים וראיתי
   * play ואז pause תשע מילישניות אחריו, בזמן ש-pause() לא נקרא מהקוד
   * ולו פעם אחת. הקוד פירש את העצירה הזו כחסימת ניגון והציג כפתור
   * פליי, על סרטון שאיש עוד לא גלל אליו.
   */
  const [inView, setInView] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  /* מרחק מעגלי מסומן: -half..half, כדי שהמעבר בין האחרון לראשון לא יעוף */
  const half = Math.floor(count / 2);
  const deltaOf = useCallback(
    (i: number) => {
      const raw = ((i - index) % count + count) % count;
      return raw > half ? raw - count : raw;
    },
    [index, count, half],
  );

  const step = useCallback(
    (n: number) => setIndex((prev) => ((prev + n) % count + count) % count),
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

  const cardWidth = Math.min(Math.max(stageWidth * 0.66, 200), 260);
  const gap = stageWidth < 480 ? 14 : 20;

  /*
   * ניגון: הפעיל מנגן, כל השאר עצורים ומאופסים.
   *
   * play() מוחזר כהבטחה שנדחית כשהדפדפן חוסם, ולכן הכישלון נתפס במפורש
   * ומתורגם למצב blocked במקום להיבלע.
   */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setPlaying(false);
    setBlocked(false);

    videoRefs.current.forEach((video, i) => {
      if (i !== index || !inView) {
        video.pause();
        if (i !== index) video.currentTime = 0;
        return;
      }
      /* חייב להיות מושתק לפני play, אחרת iOS דוחה את הבקשה */
      video.muted = true;
      video.setAttribute("muted", "");
      video.playsInline = true;
      video.play().catch(() => setBlocked(true));
    });
  }, [index, inView]);

  /*
   * שחרור אחרי המחווה הראשונה של המשתמש.
   *
   * iOS חוסם ניגון אוטומטי במצב חיסכון בסוללה גם כשהווידאו מושתק, וזו
   * מגבלה של מערכת ההפעלה שאי אפשר לעקוף. מה שכן אפשר: אחרי מגע או
   * גלילה כלשהם בעמוד הדפדפן כבר מכיר במחווה, ואז play() מצליח. לכן
   * מנסים שוב פעם אחת, בלי לדרוש מהמשתמש ללחוץ על הסרטון עצמו.
   */
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
    const start = dragX.current;
    dragX.current = null;
    if (start === null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) < 40) return;
    /* גרירה שמאלה מביאה את הכרטיס שמשמאל, בדיוק כמו החץ השמאלי */
    if (dx < 0) goNext();
    else goPrev();
  };

  if (!count) return null;

  const arrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-bone backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

  return (
    <section className="py-10 sm:py-12">
      <div className="container-site">
        <SectionHeader
          compact
          kicker="תוצרים"
          title={
            <>
              עבודות של <AccentWord>תלמידים</AccentWord>
            </>
          }
          sub="סרטונים אמיתיים שנבנו במהלך המסלול - לא הדגמות מבוימות."
        />

        <div className="relative mt-6">
          <div
            ref={stageRef}
            /*
             * overflow-hidden חובה כאן: הכרטיסים השכנים ממוקמים אבסולוטית
             * ונדחפים החוצה ברוחב שני כרטיסים לכל צד. בלי החיתוך הם יצרו
             * 357px של גלילה אופקית בעמוד הקורס, וזה שובר אילוץ קשיח.
             */
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
              aria-label="הסרטון הקודם"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={`${arrowClass} left-1 sm:left-2 lg:left-4`}
              aria-label="הסרטון הבא"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>

            {works.map((work, i) => {
              const d = deltaOf(i);
              if (Math.abs(d) > NEIGHBOURS) return null;

              const isActive = d === 0;
              const hasVideo = Math.abs(d) <= VIDEO_WINDOW;
              /* RTL: הבא יושב משמאל, ולכן ההיסט שלילי ככל שמתקדמים */
              const x = -d * (cardWidth + gap);

              return (
                <article
                  key={work.id}
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
                    aria-label={isActive ? work.title : `עבור לסרטון: ${work.title}`}
                  >
                    {/*
                      * הפוסטר הוא שכבת הבסיס, תמיד.
                      *
                      * אטריביוט poster לבדו לא מספיק: ברגע שיש דאטה הדפדפן
                      * מצייר את הפריים הנוכחי, והפריים הראשון כאן שחור כי
                      * הסרטונים נפתחים בדעיכה. תמונה מתחת פותרת גם את זה
                      * וגם את המקרה שבו לא ירד אף בייט.
                      */}
                    <img
                      src={work.poster}
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
                        src={work.video}
                        poster={work.poster}
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                        style={{ opacity: isActive && playing ? 1 : 0 }}
                        muted
                        playsInline
                        /*
                          * בלי autoPlay: האפקט הוא המנהל היחיד של הניגון.
                          *
                          * האטריביוט גורם לדפדפן לנסות לנגן כבר בטעינה, גם
                          * כשהקרוסלה הרחק מתחת לקיפול, ואז הוא עוצר מיד -
                          * play ואז pause תשע מילישניות אחריו. הרעש הזה הוא
                          * שגרם לכפתור הפליי להופיע בלי סיבה.
                          */
                        preload={isActive ? "auto" : "metadata"}
                        onPlaying={() => isActive && (setPlaying(true), setBlocked(false))}
                        onPause={() => isActive && setPlaying(false)}
                        onEnded={() => isActive && goNext()}
                      />
                    )}

                    {/* רק כשמערכת ההפעלה חסמה ניגון ואי אפשר לעקוף */}
                    {isActive && blocked && inView && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                          <Play className="h-6 w-6 fill-white" aria-hidden />
                        </span>
                      </span>
                    )}
                  </button>

                  <div className="rounded-b-3xl bg-[#141318] px-3 py-3 text-center">
                    <p className="truncate text-sm font-semibold text-bone">{work.title}</p>
                    <p className="mt-0.5 truncate text-xs text-bone/50">{work.author}</p>
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
            aria-label="ניווט סרטונים"
          >
            {works.map((work, i) => (
              <button
                key={work.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`סרטון ${i + 1}`}
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

        {/*
         * בקשה צמודה לתוצרים.
         *
         * זה הרגע שבו המבקר הכי משוכנע - הוא בדיוק ראה תשעה סרטונים
         * שתלמידים באמת בנו - והקרוסלה נגמרה קודם בלי לבקש ממנו כלום.
         */}
        <div className="mt-8 flex flex-col items-center text-center">
          <p className="max-w-md text-[15px] leading-relaxed text-bone/55">
            כל אחד מהסרטונים האלה נבנה במסלול, על ידי מישהו שהתחיל מאפס.
          </p>
          <Pressable
            type="button"
            className="btn btn-brand mt-5 w-full max-w-xs sm:w-auto sm:max-w-none sm:px-8"
            rippleTone="pink"
            onClick={() => openRegisterModal({ leadSource: "student-works" })}
          >
            רוצה לבנות כאלה
          </Pressable>
        </div>
      </div>
    </section>
  );
};

export default StudentWorksCarousel;
