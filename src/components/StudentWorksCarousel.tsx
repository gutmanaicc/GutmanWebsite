import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { StudentWork } from "../data/studentWorksData";
import SectionHeader, { AccentWord } from "./SectionHeader";
import Pressable from "./Pressable";
import { useRegisterModal } from "../context/RegisterModalContext";

type Props = {
  works: StudentWork[];
};

/**
 * חץ ניווט צף: יושב במרכז הגובה של הסרטון בצד המסך, מעל שולי הקרוסלה,
 * כדי שאפשר יהיה לדפדף בסרטונים בלי להזיז את היד למעלה.
 */
const arrowClass =
  "absolute top-1/2 z-[2] inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-canvas/80 text-bone backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:border-white/60 hover:bg-white/15 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-12 sm:w-12";

/** כמה עותקים של הרשימה נמתחים על הסרט. שלושה = עותק לפני, האמצעי, ואחד אחרי. */
const COPIES = 3;

/**
 * קרוסלת תוצרי תלמידים, בלי התחלה ובלי סוף.
 *
 * הרשימה נפרסת שלוש פעמים ברצף והמשתמש תמיד עומד בעותק האמצעי. כשהוא
 * חוצה אותו, מזיזים אותו בשקט עותק אחד אחורה או קדימה - בלי אנימציה
 * ובאותו פריים של הרינדור. מכיוון שהעותקים זהים, העין לא רואה קפיצה,
 * והסרטון האחרון פשוט ממשיך לראשון.
 */
const StudentWorksCarousel = ({ works }: Props) => {
  const reduced = useReducedMotion();
  const { openRegisterModal } = useRegisterModal();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const programmaticUntil = useRef(0);
  /** חלון שבו הגלילה האופקית באמת הגיעה מהמשתמש (מגע, גלגלת, מקלדת) */
  const userDrivingUntil = useRef(0);
  const normalizeTimer = useRef(0);

  const count = works.length;
  /** האינדקס שממנו מתחילים: תחילת העותק האמצעי */
  const origin = count;
  const slides = useMemo(
    () => Array.from({ length: count * COPIES }, (_, i) => works[i % count]),
    [works, count],
  );

  const [activeIndex, setActiveIndex] = useState(origin);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [showToggleIcon, setShowToggleIcon] = useState<"play" | "pause" | null>(null);
  /*
   * ספארי בנייד חוסם הפעלה אוטומטית במצב חיסכון בסוללה וגם כשהמדיה
   * עדיין לא מוכנה. בלי לדעת שזה קרה, הכרטיס נשאר שחור והמשתמש חושב
   * שהאתר שבור. כאן שומרים את המצב ומציגים כפתור נגינה גדול.
   */
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [activeReady, setActiveReady] = useState(false);
  /*
   * "באמת מנגן", ולא "נטען" ולא "אמור לנגן".
   *
   * זה מה שמכריע אם מראים את הווידאו או את הפוסטר. readyState לא מספיק
   * כי סרטון טעון-אך-עצור מצייר את הפריים הראשון, והוא שחור כאן.
   */
  const [activePlaying, setActivePlaying] = useState(false);

  /** מראה של activeIndex, לשימוש בתוך מאזינים שלא נרשמים מחדש בכל רינדור */
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  const centerCard = useCallback(
    (index: number, smooth = true) => {
      const track = scrollerRef.current;
      const card = cardRefs.current[index];
      if (!track || !card) return;

      /*
       * מרכוז יחסי ולא מוחלט: ב-RTL כרום סופר scrollLeft בטווח שלילי,
       * ולכן חישוב "יעד מוחלט" נחתך ל-0 והכרטיס נתקע בקצה. הפרש בין
       * מרכז הכרטיס למרכז המסילה במרחב המסך עובד זהה בשני הכיוונים.
       */
      const cardRect = card.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const delta = cardRect.left + cardRect.width / 2 - (trackRect.left + trackRect.width / 2);
      if (Math.abs(delta) < 1) return;

      track.scrollBy({
        left: delta,
        behavior: smooth && !reduced ? "smooth" : "auto",
      });
    },
    [reduced],
  );

  /**
   * מחזיר את המשתמש לעותק האמצעי אחרי שהגלילה נחה.
   * הקפיצה מיידית ובלי אנימציה, ולכן היא לא נראית.
   */
  const scheduleNormalize = useCallback(
    (index: number, delay: number) => {
      window.clearTimeout(normalizeTimer.current);
      const target = (((index % count) + count) % count) + origin;
      if (target === index) return;

      normalizeTimer.current = window.setTimeout(() => {
        programmaticUntil.current = performance.now() + 400;
        centerCard(target, false);
        setActiveIndex(target);
      }, delay);
    },
    [centerCard, count, origin],
  );

  const goTo = useCallback(
    (index: number) => {
      if (!count) return;

      /*
       * יעד שנופל מחוץ למסילה מקופל מיד לעותק האמצעי.
       *
       * המסילה מרנדרת count * COPIES כרטיסים בלבד, ו-goTo נקרא גם עם
       * activeIndex + 1 - מהחצים ומסיום סרטון. בכרטיס האחרון זה מכוון
       * לאינדקס שלא קיים: centerCard לא מוצא ref ויוצא בשקט, וכלום לא
       * זז עד שה-normalize מגיע כמעט שנייה אחר כך. הקיפול נותן את אותו
       * תוכן בדיוק, רק במיקום שקיים על המסילה.
       */
      const total = count * COPIES;
      const target =
        index < 0 || index >= total ? (((index % count) + count) % count) + origin : index;

      programmaticUntil.current = performance.now() + (reduced ? 100 : 700);
      setActiveIndex(target);
      setPausedByUser(false);
      centerCard(target, !reduced);
      scheduleNormalize(target, reduced ? 120 : 680);
    },
    [count, centerCard, reduced, scheduleNormalize, origin],
  );

  /*
   * מרכוז הכרטיס הפותח.
   *
   * הפריסה לא יציבה מיד: פונטים, תמונות ומדיה כבדה מזיזים את המסילה
   * עוד כמה מאות מילישניות אחרי הרינדור הראשון. לכן ממרכזים שוב ושוב
   * לאורך חלון הזנקה ארוך, ומשתיקים בינתיים את המעקב אחרי הגלילה
   * הידנית כדי שלא "יגלוש" לכרטיס השני.
   */
  useEffect(() => {
    if (!count) return;
    const SETTLE_MS = 1600;
    programmaticUntil.current = performance.now() + SETTLE_MS;
    cardRefs.current = cardRefs.current.slice(0, count * COPIES);

    let cancelled = false;
    const run = () => {
      if (!cancelled) centerCard(origin, false);
    };

    run();
    const raf = requestAnimationFrame(run);
    const timers = [50, 150, 350, 700, 1100, 1500].map((ms) => window.setTimeout(run, ms));

    /* גם סיום טעינת הפונטים מזיז את הפריסה */
    document.fonts?.ready.then(run).catch(() => undefined);
    window.addEventListener("load", run);

    const track = scrollerRef.current;
    let ro: ResizeObserver | undefined;
    if (track && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (performance.now() <= programmaticUntil.current) run();
      });
      ro.observe(track);
      const first = cardRefs.current[origin];
      if (first) ro.observe(first);
    }

    const stop = window.setTimeout(() => {
      ro?.disconnect();
      ro = undefined;
    }, SETTLE_MS + 100);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(window.clearTimeout);
      window.clearTimeout(stop);
      window.removeEventListener("load", run);
      ro?.disconnect();
    };
  }, [count, origin, centerCard]);

  useEffect(() => () => window.clearTimeout(normalizeTimer.current), []);

  // Keep active card centered on track resize
  useEffect(() => {
    const track = scrollerRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      centerCard(activeIndex, false);
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [activeIndex, centerCard]);

  /*
   * מעקב אחרי הכרטיס הפעיל בגרירה ידנית.
   *
   * שתי מלכודות שנפלנו בהן כאן:
   *
   * 1. IntersectionObserver לא מתאים למדידה הזו. כשכמה כרטיסים נראים
   *    במלואם בתוך המסילה, ה-ratio של כולם הוא 1 והבחירה ביניהם הופכת
   *    שרירותית. לכן מודדים מרחק מהמרכז.
   *
   * 2. הדפדפן מאפס לבדו את מיקום הגלילה האופקי כשהעמוד נגלל והמסילה
   *    מקבלת פריסה מחדש, והקרוסלה "קופצת" לכרטיס אקראי. לכן מבדילים
   *    בין גלילה שהמשתמש יזם - מגע, גלגלת או מקלדת על המסילה - לבין
   *    גלילה שקרתה מעצמה, ואת השנייה פשוט מחזירים למקום.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !count) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const now = performance.now();
      if (now < programmaticUntil.current) return;

      if (now > userDrivingUntil.current) {
        /* גלילה שאיש לא ביקש: מחזירים את הכרטיס הנוכחי למרכז */
        programmaticUntil.current = now + 250;
        centerCard(activeRef.current, false);
        return;
      }
      /* תנופת מגע ממשיכה אחרי שהאצבע עזבה, ולכן מאריכים את החלון */
      userDrivingUntil.current = now + 400;

      const trackRect = scroller.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;

      let best = origin;
      let bestDistance = Infinity;
      for (const card of scroller.querySelectorAll<HTMLElement>("[data-slide-index]")) {
        const idx = Number(card.dataset.slideIndex);
        if (Number.isNaN(idx)) continue;
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - trackCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = idx;
        }
      }

      setActiveIndex((prev) => (prev === best ? prev : best));
      /* גם גרירה ידנית מוחזרת לעותק האמצעי, אחרי שהאצבע עוזבת והתנופה נחה */
      scheduleNormalize(best, 700);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    const markUserDriving = () => {
      userDrivingUntil.current = performance.now() + 1200;
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    for (const type of ["pointerdown", "touchstart", "wheel", "keydown"] as const) {
      scroller.addEventListener(type, markUserDriving, { passive: true });
    }

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      for (const type of ["pointerdown", "touchstart", "wheel", "keydown"] as const) {
        scroller.removeEventListener(type, markUserDriving);
      }
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count, origin, scheduleNormalize, centerCard]);

  // Autoplay active, pause others
  useEffect(() => {
    setAutoplayBlocked(false);
    setActiveReady(false);
    setActivePlaying(false);

    videoRefs.current.forEach((video, index) => {
      if (index === activeIndex && !pausedByUser) {
        /* חייב להיות מושתק לפני play, אחרת iOS דוחה את הבקשה */
        video.muted = true;
        video.setAttribute("muted", "");
        video.playsInline = true;
        if (video.readyState >= 2) setActiveReady(true);
        const playPromise = video.play();
        if (playPromise) {
          playPromise
            .then(() => setAutoplayBlocked(false))
            .catch(() => setAutoplayBlocked(true));
        }
      } else {
        video.pause();
        if (index !== activeIndex) video.currentTime = 0;
      }
    });
  }, [activeIndex, pausedByUser, slides]);

  const toggleActivePlayback = () => {
    const video = videoRefs.current.get(activeIndex);
    if (!video) return;

    if (video.paused) {
      setPausedByUser(false);
      video.muted = true;
      /* הלחיצה עצמה היא מחוות משתמש, ולכן כאן ההפעלה כבר מותרת */
      video.play().then(() => setAutoplayBlocked(false)).catch(() => undefined);
      setShowToggleIcon("play");
    } else {
      video.pause();
      setPausedByUser(true);
      setShowToggleIcon("pause");
    }
    window.setTimeout(() => setShowToggleIcon(null), 700);
  };

  if (!count) return null;

  // RTL: index 0 is rightmost; right arrow = -1, left arrow = +1
  const goRight = () => goTo(activeIndex - 1);
  const goLeft = () => goTo(activeIndex + 1);
  /** המיקום בתוך הרשימה האמיתית, בלי קשר לעותק שבו אנחנו עומדים */
  const logicalIndex = ((activeIndex % count) + count) % count;

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
          {/* החצים יושבים על הצדדים בגובה הסרטון, כדי שהגלילה תהיה נוחה */}
          <div className="relative">
            <button
              type="button"
              onClick={goRight}
              className={`${arrowClass} right-1 sm:right-2 lg:right-4`}
              aria-label="הסרטון מימין"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goLeft}
              className={`${arrowClass} left-1 sm:left-2 lg:left-4`}
              aria-label="הסרטון משמאל"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>

            <div
              ref={scrollerRef}
              /* הריפוד בצדדים שווה בדיוק לחצי מסילה פחות חצי כרטיס, אחרת
                 הכרטיס הראשון והאחרון לא יכולים להגיע למרכז המסך */
              className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-min(36vw,140px))] pb-3 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] md:gap-5 md:px-[calc(50%-110px)] lg:px-[calc(50%-120px)] [&::-webkit-scrollbar]:hidden"
              dir="rtl"
              style={{ scrollPaddingInline: "0px" }}
            >
              {slides.map((work, index) => {
                const isActive = index === activeIndex;
                const distance = Math.abs(index - activeIndex);
                /*
                 * רק חלון קטן סביב הכרטיס הפעיל מקבל אלמנט וידאו אמיתי.
                 *
                 * הלופ פורש את הרשימה שלוש פעמים, וזה הגיע ל-27 אלמנטי
                 * וידאו בעמוד. לאייפון יש תקרה קשיחה על מספר הסרטונים
                 * שאפשר לטעון בו-זמנית, ומעליה הם פשוט לא נטענים - כך
                 * שכל הקרוסלה נשארה שחורה בנייד. עכשיו יש חמישה לכל היותר.
                 */
                const hasVideo = distance <= 2;
                /*
                 * none ולא metadata לשכנים.
                 *
                 * ספארי ב-iOS מתעלם מ-preload ברשת סלולרית ובמצב חיסכון,
                 * ולכן metadata לא באמת הביא כלום שם - אבל בדסקטופ הוא כן
                 * משך תשעה קבצים במקביל. עכשיו הפוסטר מכסה את המצב הסטטי
                 * והבייטים של הווידאו נטענים רק לכרטיס שעומדים עליו.
                 */
                const preload = isActive ? "auto" : "none";

                return (
                  <article
                    key={`${work.id}-${index}`}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    data-slide-index={index}
                    className={`relative w-[min(72vw,280px)] shrink-0 snap-center overflow-hidden rounded-3xl border transition-[box-shadow,transform,border-color,opacity] duration-300 md:w-[220px] lg:w-[240px] ${
                      isActive
                        ? "z-[1] scale-100 border-[#FF2D85]/50 opacity-100 shadow-[0_0_28px_rgba(255,45,133,0.35)]"
                        : "scale-90 border-white/10 opacity-30"
                    }`}
                    aria-hidden={distance > 2 ? true : undefined}
                  >
                    <button
                      type="button"
                      className="relative block aspect-[9/16] w-full overflow-hidden bg-[#191919] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50"
                      tabIndex={distance > 2 ? -1 : undefined}
                      onClick={() => {
                        if (isActive) toggleActivePlayback();
                        else goTo(index);
                      }}
                      aria-label={
                        isActive
                          ? pausedByUser
                            ? `נגן: ${work.title}`
                            : `השהה: ${work.title}`
                          : `עבור לסרטון: ${work.title}`
                      }
                    >
                      {/*
                        * הפוסטר הוא שכבת הבסיס, תמיד, גם מתחת לווידאו.
                        *
                        * אטריביוט poster לבדו לא מספיק: ברגע שלווידאו יש
                        * דאטה הדפדפן מפסיק לצייר אותו ומצייר את הפריים
                        * הנוכחי - והפריים הראשון בסרטונים האלה שחור, כי
                        * הם נפתחים בדעיכה משחור. כך כרטיס עצור נראה שחור
                        * גם כשהוא נטען במלואו. תמונה אמיתית מתחת פותרת
                        * גם את זה וגם את המקרה שבו לא ירד אף בייט.
                        */}
                      <img
                        src={work.poster}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading={distance <= 2 ? "eager" : "lazy"}
                        decoding="async"
                        aria-hidden
                      />

                      {/*
                        * הווידאו נחשף רק כשהוא באמת מנגן.
                        *
                        * בסוף הסרטון עוברים לכרטיס הבא ולא חוזרים עליו
                        * בלופ. muted מוגדר ידנית על האלמנט כי React לא
                        * משקף אותו כאטריביוט וספארי בנייד מסרב להפעיל
                        * אוטומטית בלעדיו.
                        */}
                      {hasVideo && (
                        <video
                          ref={(el) => {
                            if (el) {
                              videoRefs.current.set(index, el);
                              el.muted = true;
                              el.setAttribute("muted", "");
                            } else {
                              videoRefs.current.delete(index);
                            }
                          }}
                          src={work.video}
                          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                          style={{ opacity: isActive && activePlaying ? 1 : 0 }}
                          muted
                          autoPlay={isActive}
                          playsInline
                          preload={preload}
                          poster={work.poster}
                          onLoadedData={() => isActive && setActiveReady(true)}
                          onCanPlay={() => isActive && setActiveReady(true)}
                          onPlaying={() => isActive && setActivePlaying(true)}
                          onPause={() => isActive && setActivePlaying(false)}
                          onWaiting={() => isActive && setActivePlaying(false)}
                          onEnded={() => {
                            if (isActive) goTo(index + 1);
                          }}
                        />
                      )}

                      {/*
                        * ספינר רק כשבאמת נטען משהו, ובלי לכסות את הפוסטר.
                        *
                        * קודם הוא היה אטום על #191919 והופיע בכל מצב שבו
                        * activeReady עוד false. בטלפון שחוסם ניגון אוטומטי
                        * הווידאו לא מתחיל להיטען בכלל, כלומר activeReady
                        * נשאר false לנצח - והריבוע האטום הסתיר את הפוסטר
                        * ואת הסרטון גם יחד. זה מה שנראה כמו "לא נטען".
                        */}
                      {isActive && hasVideo && !activeReady && !autoplayBlocked && (
                        <span
                          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30"
                          aria-hidden
                        >
                          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand" />
                        </span>
                      )}

                      {/* ההפעלה האוטומטית נחסמה - נותנים למשתמש להפעיל בלחיצה */}
                      {isActive && autoplayBlocked && !pausedByUser && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                            <Play className="h-6 w-6 fill-white" />
                          </span>
                        </span>
                      )}

                      <AnimatePresence>
                        {isActive && showToggleIcon && (
                          <motion.span
                            key={showToggleIcon}
                            initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          >
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#191919]/55 text-white backdrop-blur-sm">
                              {showToggleIcon === "play" ? (
                                <Play className="h-6 w-6 fill-white" />
                              ) : (
                                <Pause className="h-6 w-6 fill-white" />
                              )}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {isActive && pausedByUser && !showToggleIcon && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FF2D85] text-white shadow-lg">
                            <Play className="h-5 w-5 fill-white" />
                          </span>
                        </span>
                      )}
                    </button>

                    <div className="bg-white/[0.04] px-3 py-3 text-center">
                      <h3 className="truncate text-sm font-semibold text-bone">{work.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-bone/50">{work.author}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-medium text-bone/50" dir="ltr">
            {logicalIndex + 1} / {count}
          </p>

          {/* Pagination dots, same RTL order as slides (index 0 = rightmost) */}
          <div
            className="mt-3 flex items-center justify-center gap-2"
            dir="rtl"
            role="tablist"
            aria-label="ניווט סרטונים"
          >
            {works.map((work, index) => (
              <button
                key={work.id}
                type="button"
                role="tab"
                aria-selected={index === logicalIndex}
                aria-label={`סרטון ${index + 1}`}
                className="flex h-11 w-6 items-center justify-center"
                onClick={() => goTo(origin + index)}
              >
                <span
                  className={`block h-2.5 rounded-full transition-all ${
                    index === logicalIndex ? "w-6 bg-brand" : "w-2.5 bg-white/25"
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
         * שתלמידים באמת בנו - והקרוסלה נגמרה קודם בלי לבקש ממנו כלום,
         * בעמוד הבית ובעמודי הקורס גם יחד.
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
