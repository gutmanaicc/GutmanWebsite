import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { StudentWork } from "../data/studentWorksData";
import SectionHeader, { AccentWord } from "./SectionHeader";

type Props = {
  works: StudentWork[];
};

/**
 * Horizontal student-works carousel:
 * - Mobile: snap center + peek neighbors
 * - Active slide autoplays (muted/loop); others pause
 * - Arrow / dot / swipe keep activeIndex + autoplay in sync
 */
const StudentWorksCarousel = ({ works }: Props) => {
  const reduced = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const programmaticUntil = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [showToggleIcon, setShowToggleIcon] = useState<"play" | "pause" | null>(null);

  const centerCard = useCallback(
    (index: number, smooth = true) => {
      const track = scrollerRef.current;
      const card = cardRefs.current[index];
      if (!track || !card) return;

      // Absolute target scrollLeft (works in LTR and RTL; no page jump)
      const cardOffset =
        card.getBoundingClientRect().left -
        track.getBoundingClientRect().left +
        track.scrollLeft;
      const trackCenter = track.clientWidth / 2;
      const cardCenter = cardOffset + card.clientWidth / 2;
      const targetScroll = cardCenter - trackCenter;

      track.scrollTo({
        left: targetScroll,
        behavior: smooth && !reduced ? "smooth" : "auto",
      });
    },
    [reduced],
  );

  const goTo = useCallback(
    (index: number) => {
      if (!works.length) return;
      const next = ((index % works.length) + works.length) % works.length;
      programmaticUntil.current = performance.now() + (reduced ? 80 : 450);
      setActiveIndex(next);
      setPausedByUser(false);
      centerCard(next, !reduced);
    },
    [works.length, centerCard, reduced],
  );

  // Instant-center index 0 on mount; re-center after layout settles
  useEffect(() => {
    if (!works.length) return;
    programmaticUntil.current = performance.now() + 600;
    cardRefs.current = cardRefs.current.slice(0, works.length);

    let cancelled = false;
    const run = () => {
      if (!cancelled) centerCard(0, false);
    };

    run();
    const raf = requestAnimationFrame(run);
    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 150);
    const t3 = window.setTimeout(run, 350);

    const track = scrollerRef.current;
    let ro: ResizeObserver | undefined;
    if (track && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (performance.now() <= programmaticUntil.current) run();
      });
      ro.observe(track);
      const first = cardRefs.current[0];
      if (first) ro.observe(first);
    }

    const stop = window.setTimeout(() => {
      ro?.disconnect();
      ro = undefined;
    }, 700);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(stop);
      ro?.disconnect();
    };
  }, [works.length, centerCard]);

  // Keep active card centered on track resize
  useEffect(() => {
    const track = scrollerRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      centerCard(activeIndex, false);
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [activeIndex, centerCard, works.length]);

  // Track active slide via swipe / manual scroll (skip while arrow animation runs)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !works.length) return;

    const slides = Array.from(scroller.querySelectorAll<HTMLElement>("[data-slide-index]"));
    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < programmaticUntil.current) return;

        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.slideIndex);
          if (Number.isNaN(idx)) continue;
          ratios.set(idx, entry.intersectionRatio);
        }
        let best = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = idx;
          }
        });
        setActiveIndex((prev) => (prev === best ? prev : best));
      },
      { root: scroller, threshold: [0.35, 0.5, 0.65, 0.8] },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [works]);

  // Autoplay active, pause others
  useEffect(() => {
    works.forEach((work, index) => {
      const video = videoRefs.current.get(work.id);
      if (!video) return;
      if (index === activeIndex && !pausedByUser) {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise) playPromise.catch(() => undefined);
      } else {
        video.pause();
        if (index !== activeIndex) video.currentTime = 0;
      }
    });
  }, [activeIndex, pausedByUser, works]);

  const toggleActivePlayback = () => {
    const work = works[activeIndex];
    if (!work) return;
    const video = videoRefs.current.get(work.id);
    if (!video) return;

    if (video.paused) {
      setPausedByUser(false);
      video.play().catch(() => undefined);
      setShowToggleIcon("play");
    } else {
      video.pause();
      setPausedByUser(true);
      setShowToggleIcon("pause");
    }
    window.setTimeout(() => setShowToggleIcon(null), 700);
  };

  if (!works.length) return null;

  // RTL: index 0 is rightmost; right arrow = -1, left arrow = +1
  const goRight = () => goTo(activeIndex - 1);
  const goLeft = () => goTo(activeIndex + 1);

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
          {/* Desktop controls */}
          <div className="mb-4 hidden items-center justify-between md:flex">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goRight}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-bone transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15 active:scale-95"
                aria-label="הסרטון מימין"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goLeft}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-bone transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15 active:scale-95"
                aria-label="הסרטון משמאל"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <p className="text-sm font-medium text-bone/50" dir="ltr">
              {activeIndex + 1} / {works.length}
            </p>
          </div>

          <div
            ref={scrollerRef}
            className="relative flex snap-x snap-mandatory scroll-p-4 gap-4 overflow-x-auto px-[max(1rem,calc((100%-min(92vw,1100px))/2))] pb-3 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] md:gap-5 md:px-[max(1.5rem,calc((100%-1000px)/2))] lg:px-[max(2rem,calc((100%-1100px)/2))] [&::-webkit-scrollbar]:hidden"
            dir="rtl"
            style={{ scrollPaddingInline: "max(1rem, calc(50% - 140px))" }}
          >
            {works.map((work, index) => {
              const isActive = index === activeIndex;
              return (
                <article
                  key={work.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  data-slide-index={index}
                  className={`relative w-[72%] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-3xl border transition-[box-shadow,transform,border-color,opacity] duration-300 md:w-[220px] lg:w-[240px] ${
                    isActive
                      ? "z-[1] scale-100 border-[#FF2D85]/50 opacity-100 shadow-[0_0_28px_rgba(255,45,133,0.35)]"
                      : "scale-90 border-white/10 opacity-30"
                  }`}
                >
                  <button
                    type="button"
                    className="relative block aspect-[9/16] w-full overflow-hidden bg-[#191919] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50"
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
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current.set(work.id, el);
                        else videoRefs.current.delete(work.id);
                      }}
                      src={work.video}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      loop
                      preload={isActive ? "auto" : "metadata"}
                    />

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

                  <div className="bg-white/[0.04] px-3 py-3 text-right">
                    <h3 className="truncate text-sm font-semibold text-bone">{work.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-bone/50">{work.author}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination dots, same RTL order as slides (index 0 = rightmost) */}
          <div
            className="mt-4 flex items-center justify-center gap-2"
            dir="rtl"
            role="tablist"
            aria-label="ניווט סרטונים"
          >
            {works.map((work, index) => (
              <button
                key={work.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`סרטון ${index + 1}`}
                className="flex h-11 w-6 items-center justify-center"
                onClick={() => goTo(index)}
              >
                <span
                  className={`block h-2.5 rounded-full transition-all ${
                    index === activeIndex ? "w-6 bg-brand" : "w-2.5 bg-white/25"
                  }`}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentWorksCarousel;
