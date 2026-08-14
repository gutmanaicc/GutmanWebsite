import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import BackButton from "../components/BackButton";
import ReviewsRatingBadge from "../components/ReviewsRatingBadge";
import { AccentWord } from "../components/SectionHeader";
import {
  TESTIMONIAL_FILTERS,
  getTestimonialsByCategory,
  type Testimonial,
  type TestimonialCategory,
} from "../data/testimonialsData";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const TestimonialCard = ({
  item,
  active,
  onOpen,
}: {
  item: Testimonial;
  active: boolean;
  onOpen: (item: Testimonial) => void;
}) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    tabIndex={active ? 0 : -1}
    aria-hidden={!active}
    className={`group flex w-full flex-col overflow-hidden rounded-2xl bg-[#191919] text-right transition-[border-color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50 ${
      active
        ? "border border-[#FF2D85]/50 shadow-[0_0_22px_rgba(255,45,133,0.32)]"
        : "border border-white/10 shadow-[0_10px_28px_-20px_rgba(0,0,0,0.55)]"
    }`}
  >
    <div className="flex flex-col gap-1.5 p-3.5 pb-2.5 sm:p-4 sm:pb-3">
      <span className="inline-flex w-fit rounded-full bg-[#FF2D85]/15 px-2.5 py-1 text-xs font-semibold text-[#FF2D85]">
        {item.tag}
      </span>
      <p className="text-sm font-bold leading-snug text-[#F4F4F2]">
        <span className="text-[#FF2D85]" aria-hidden>
          “
        </span>
        {item.quote}
        <span className="text-[#FF2D85]" aria-hidden>
          ”
        </span>
      </p>
      <p className="line-clamp-2 text-xs leading-relaxed text-[#F4F4F2]/65">{item.text}</p>
    </div>

    <div className="relative mx-3.5 mb-3.5 overflow-hidden rounded-xl sm:mx-4 sm:mb-4">
      <div className="h-32 w-full overflow-hidden bg-zinc-900 sm:h-36">
        <img
          src={item.image}
          alt={`צילום ביקורת: ${item.quote}`}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading={active ? "eager" : "lazy"}
          draggable={false}
        />
      </div>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[#191919]/85 to-transparent px-2 pb-2 pt-6">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-[#191919]/70 px-2.5 py-1 text-[10px] font-semibold text-[#F4F4F2] backdrop-blur-sm">
          <Search className="h-3 w-3 text-[#FF2D85]" aria-hidden />
          לחץ להודעה המלאה
        </span>
      </span>
    </div>
  </button>
);

const Reviews = () => {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<TestimonialCategory>("all");
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const programmaticUntil = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const items = useMemo(() => getTestimonialsByCategory(filter), [filter]);

  useSeo({
    title: `ביקורות | ${SITE.name}`,
    description: "מה התלמידים שלנו אומרים על המסלולים הפרונטליים של Gutman Academy.",
    path: "/reviews",
  });

  const centerCard = useCallback((index: number, smooth = true) => {
    const track = scrollerRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;

    // Absolute target scrollLeft (works in LTR and RTL; no page jump)
    // cardOffset ≡ offsetLeft when the track is the offsetParent in LTR
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
  }, [reduced]);

  const goTo = useCallback(
    (index: number) => {
      if (!items.length) return;
      const next = ((index % items.length) + items.length) % items.length;
      programmaticUntil.current = performance.now() + (reduced ? 80 : 450);
      setActiveIndex(next);
      centerCard(next, !reduced);
    },
    [items.length, centerCard, reduced],
  );

  // Instant-center index 0 on mount / filter change; re-center after layout settles
  useEffect(() => {
    setActiveIndex(0);
    programmaticUntil.current = performance.now() + 600;
    cardRefs.current = cardRefs.current.slice(0, items.length);

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
        // Only force index-0 while the initial settle window is open
        if (performance.now() <= programmaticUntil.current) run();
      });
      ro.observe(track);
      const first = cardRefs.current[0];
      if (first) ro.observe(first);
    }

    const img = cardRefs.current[0]?.querySelector("img");
    const onImg = () => run();
    img?.addEventListener("load", onImg);

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
      img?.removeEventListener("load", onImg);
    };
  }, [filter, items.length, centerCard]);

  // Keep active card centered on track resize (orientation / breakpoint)
  useEffect(() => {
    const track = scrollerRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      centerCard(activeIndex, false);
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [activeIndex, centerCard, items.length]);

  // Track active slide via swipe / manual scroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !items.length) return;

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
  }, [items]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightbox) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  // RTL: index 0 is rightmost; right arrow = -1, left arrow = +1
  const goRight = () => goTo(activeIndex - 1);
  const goLeft = () => goTo(activeIndex + 1);

  const handleCardActivate = (item: Testimonial, index: number) => {
    if (index === activeIndex) setLightbox(item);
    else goTo(index);
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-40" aria-hidden />
        <div className="container-site relative py-10 sm:py-14 lg:py-16">
          <div className="mb-4 flex w-full justify-start sm:mb-5">
            <BackButton fallbackTo="/" />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <span className="stat-pill mb-4 inline-flex border-[#FF2D85]/25 bg-[#FF2D85]/5 text-[#FF2D85]">
              ביקורות
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#191919] sm:text-4xl lg:text-5xl">
              מה התלמידים שלנו <AccentWord>אומרים</AccentWord>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-zinc-600 sm:mt-5 sm:text-lg">
              מעל 100+ סטודנטים, בעלי עסקים ויוצרי תוכן שכבר בונים תהליכי עבודה אמיתיים עם בינה מלאכותית.
            </p>
            <div className="mt-6 flex justify-center sm:mt-7">
              <ReviewsRatingBadge linked={false} />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#F4F4F2] py-12 sm:py-16">
        <div className="container-site">
          <div
            className="mb-8 flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="סינון ביקורות"
          >
            {TESTIMONIAL_FILTERS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-[#191919] text-[#F4F4F2]"
                      : "border border-zinc-900/10 bg-white text-zinc-600 hover:border-[#FF2D85]/40 hover:text-[#191919]"
                  }`}
                  onClick={() => setFilter(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">אין ביקורות בקטגוריה זו כרגע.</p>
          ) : (
            <div className="relative w-full">
              {/* Desktop arrows — aligned to the compact card column */}
              <div className="mx-auto mb-3 hidden w-full max-w-[320px] items-center justify-between md:flex">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={goRight}
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-900/15 bg-white text-[#191919] transition-colors duration-200 hover:border-[#FF2D85] hover:text-[#FF2D85]"
                    aria-label="הביקורת מימין"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={goLeft}
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-900/15 bg-white text-[#191919] transition-colors duration-200 hover:border-[#FF2D85] hover:text-[#FF2D85]"
                    aria-label="הביקורת משמאל"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  {activeIndex + 1} / {items.length}
                </p>
              </div>

              {/* dir=rtl: index 0 starts on the right. Half-card padding lets first/last sit dead-center. */}
              <div
                ref={scrollerRef}
                className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-[max(1rem,calc(50%-160px))] pb-1.5 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] sm:gap-3.5 md:px-[calc(50%-160px)] [&::-webkit-scrollbar]:hidden"
                dir="rtl"
                style={{ scrollPaddingInline: "max(1rem, calc(50% - 160px))" }}
              >
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      data-slide-index={index}
                      className={`w-[320px] max-w-[calc(100vw-2rem)] shrink-0 snap-center transition-[opacity,transform] duration-300 ease-out ${
                        isActive ? "z-[1] scale-100 opacity-100" : "scale-90 opacity-30"
                      }`}
                    >
                      <div className="mx-auto w-full">
                        <TestimonialCard
                          item={item}
                          active={isActive}
                          onOpen={() => handleCardActivate(item, index)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination dots — RTL: index 0 = rightmost */}
              <div
                className="mx-auto mt-4 flex w-full max-w-[320px] items-center justify-center gap-1.5"
                dir="rtl"
                role="tablist"
                aria-label="ניווט ביקורות"
              >
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={`ביקורת ${index + 1}`}
                    className={`h-2 cursor-pointer rounded-full transition-all duration-200 ${
                      index === activeIndex
                        ? "w-5 bg-[#FF2D85]"
                        : "w-2 bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    onClick={() => goTo(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[80] m-0 h-full max-h-none w-full max-w-none bg-[#191919]/80 p-0 backdrop:bg-transparent"
        onClose={() => setLightbox(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setLightbox(null);
        }}
        aria-labelledby={titleId}
      >
        {lightbox && (
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#191919] shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="min-w-0 text-right">
                  <p className="text-[11px] font-semibold text-[#FF2D85]">{lightbox.tag}</p>
                  <h2 id={titleId} className="mt-1 text-base font-bold text-[#F4F4F2] sm:text-lg">
                    {lightbox.quote}
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-[#F4F4F2] hover:border-[#FF2D85] hover:text-[#FF2D85]"
                  onClick={() => setLightbox(null)}
                  aria-label="סגירת תצוגה"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img
                src={lightbox.image}
                alt={`ביקורת מלאה: ${lightbox.quote}`}
                className="max-h-[70vh] w-full object-contain bg-black"
              />
              <p className="px-4 py-4 text-sm leading-relaxed text-[#F4F4F2]/75 sm:px-5">
                {lightbox.text}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default Reviews;
