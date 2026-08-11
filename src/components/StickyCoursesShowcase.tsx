import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { COURSES, type Course } from "../data/courses";
import { springSoft, useMotionCapability } from "../lib/motion";
import { useRegisterModal } from "../context/RegisterModalContext";
import { getMockWindowForVisual } from "./MockWindows";

/** Exact brand tokens — no off-palette colors */
const BRAND = {
  canvas: "#F4F4F2",
  ink: "#191919",
  pink: "#FF2D85",
} as const;

export type StickyCourseSlide = {
  id: string;
  title: string;
  accent: string;
  href: string;
  visual: Course["visual"];
  /** Full-bleed brand background for this slide */
  bg: string;
  /** Title color on that background */
  fg: string;
  accentColor: string;
  duration: string;
  format: string;
  level: string;
  description: string;
  skills: string[];
};

/** Alternating ink / canvas curtains only */
const SLIDE_THEMES: Array<Pick<StickyCourseSlide, "bg" | "fg" | "accentColor">> = [
  { bg: BRAND.ink, fg: BRAND.canvas, accentColor: BRAND.pink },
  { bg: BRAND.canvas, fg: BRAND.ink, accentColor: BRAND.pink },
  { bg: BRAND.ink, fg: BRAND.canvas, accentColor: BRAND.pink },
  { bg: BRAND.canvas, fg: BRAND.ink, accentColor: BRAND.pink },
  { bg: BRAND.ink, fg: BRAND.canvas, accentColor: BRAND.pink },
];

type ShowcaseMeta = {
  accent: string;
  duration: string;
  format: string;
  level: string;
  skills: string[];
};

const SHOWCASE_META: Record<string, ShowcaseMeta> = {
  "social-media-ai": {
    accent: "עובד AI לכל לקוח",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "ללא ניסיון קודם",
    skills: ["ChatGPT", "בסיס ידע", "אוטומציות"],
  },
  "ai-for-students": {
    accent: "מערכת לימודים אישית",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "ללא ניסיון קודם",
    skills: ["סיכומים", "תרגול", "הכנה למבחן"],
  },
  "ai-video-content": {
    accent: "סרטון מוכן לפרסום",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "מתאים לכל רמה",
    skills: ["תסריט", "וידאו AI", "עריכה"],
  },
  "ai-business-systems": {
    accent: "CRM ומעקב תשלומים",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "ללא רקע טכני",
    skills: ["CRM", "תשלומים", "דשבורד"],
  },
  "ai-landing-page": {
    accent: "בנייה והשקה מאפס",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "ללא ניסיון קודם",
    skills: ["קופי", "Wireframe", "בנייה עם AI"],
  },
};

export function buildStickyCourseSlides(courses: Course[] = COURSES): StickyCourseSlide[] {
  return courses.map((course, index) => {
    const theme = SLIDE_THEMES[index % SLIDE_THEMES.length];
    const meta = SHOWCASE_META[course.slug];
    return {
      id: course.slug,
      title: course.shortTitle,
      accent: meta?.accent ?? course.cardSubtitle,
      href: `/courses/${course.slug}`,
      visual: course.visual,
      duration: meta?.duration ?? "5 מפגשים",
      format: meta?.format ?? "פרונטלי",
      level: meta?.level ?? "ללא ניסיון קודם",
      description: course.cardSubtitle,
      skills: meta?.skills ?? course.topics.slice(0, 3),
      ...theme,
    };
  });
}

/**
 * Content is always mounted & visible (ready).
 * "show" only adds a one-shot focus settle — never opacity: 0.
 */
const revealContainer = {
  ready: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const revealItem = (reduced: boolean) =>
  reduced
    ? {
        ready: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      }
    : {
        // Visible fallback for hydration + under-wipe layers
        ready: { opacity: 1, y: 0 },
        show: {
          opacity: 1,
          y: 0,
          transition: springSoft,
        },
      };

type CurtainProps = {
  slide: StickyCourseSlide;
  index: number;
  reduced: boolean;
};

/**
 * Sibling sticky curtains (top-0 / 100dvh).
 * The active deck stays frozen & flex-centered while the next full-bleed
 * section slides up and wipes over it — no scale/shift on the pinned card.
 */
const CurtainSlide = ({ slide, index, reduced }: CurtainProps) => {
  const { openRegisterModal } = useRegisterModal();
  const panelRef = useRef<HTMLElement>(null);
  /** One-shot focus settle — content is already visible in "ready" */
  const [focused, setFocused] = useState(index === 0);

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Latch focus polish when this curtain owns the viewport; never reverse
    if (v < 0.55) setFocused(true);
  });

  const MockWindow = getMockWindowForVisual(slide.visual);
  const isLight = slide.bg === BRAND.canvas;
  const item = revealItem(reduced);
  const zIndex = (index + 1) * 10;

  const primaryCta = isLight
    ? { backgroundColor: BRAND.ink, color: BRAND.canvas }
    : { backgroundColor: BRAND.canvas, color: BRAND.ink };
  const ghostCta = isLight
    ? "border-[#191919]/25 text-[#191919]"
    : "border-[#F4F4F2]/35 text-[#F4F4F2]";

  return (
    <article
      ref={panelRef}
      className="sticky top-0 flex h-screen h-[100dvh] w-full flex-col items-center justify-center overflow-hidden"
      style={{
        zIndex,
        backgroundColor: slide.bg,
        color: slide.fg,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 grid-canvas ${
          isLight ? "opacity-55" : "opacity-[0.14]"
        }`}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FF2D85]/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-[#FF2D85]/15 blur-3xl"
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col items-center px-4 text-center opacity-100 sm:px-6"
        variants={revealContainer}
        initial="ready"
        animate={focused ? "show" : "ready"}
      >
        <motion.div variants={item} className="mb-5 w-full max-w-[15.5rem] sm:mb-7 sm:max-w-sm">
          <div
            className="glow-edge overflow-hidden rounded-[1.75rem] border border-[#FF2D85]/25 p-2.5 shadow-card sm:p-4"
            style={{
              backgroundColor: isLight ? "rgb(255 255 255 / 0.92)" : "rgb(244 244 242 / 0.96)",
              boxShadow:
                "0 0 0 1px rgb(255 45 133 / 0.12), 0 18px 40px -18px rgb(25 25 25 / 0.35)",
            }}
          >
            <MockWindow />
          </div>
        </motion.div>

        <motion.p
          variants={item}
          className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#FF2D85] sm:text-xs"
        >
          {slide.format} · {slide.duration}
        </motion.p>

        <motion.h3
          variants={item}
          className="max-w-2xl text-[clamp(1.75rem,7vw,3.75rem)] font-bold leading-[1.05] tracking-tight"
        >
          {slide.title}
          <br />
          <em className="inline-block font-serif text-[0.78em] font-extrabold italic text-[#FF2D85]">
            {slide.accent}
          </em>
        </motion.h3>

        <motion.p
          variants={item}
          className={`mt-3 max-w-md text-sm leading-relaxed sm:mt-4 sm:text-base ${
            isLight ? "text-[#191919]/70" : "text-[#F4F4F2]/75"
          }`}
        >
          {slide.description}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-3 flex flex-wrap justify-center gap-1.5 sm:mt-4 sm:gap-2"
        >
          {slide.skills.map((skill) => (
            <span
              key={skill}
              className={`inline-flex min-h-8 items-center rounded-full border border-[#FF2D85]/35 px-3 py-1 text-xs font-medium ${
                isLight ? "bg-[#FF2D85]/5 text-[#191919]" : "bg-[#FF2D85]/15 text-[#F4F4F2]"
              }`}
            >
              {skill}
            </span>
          ))}
        </motion.div>

        <motion.div
          variants={item}
          className="mt-6 flex w-full max-w-md flex-wrap items-center justify-center gap-2 sm:mt-8"
        >
          <button
            type="button"
            className="inline-flex min-h-11 min-w-[9.5rem] flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold transition-transform active:scale-[0.98] sm:flex-none"
            style={primaryCta}
            onClick={() =>
              openRegisterModal({ courseId: slide.id, leadSource: `showcase-${slide.id}` })
            }
          >
            שמרו לי מקום
          </button>
          <Link
            to={slide.href}
            className={`inline-flex min-h-11 min-w-[9.5rem] flex-1 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-transform active:scale-[0.98] sm:flex-none ${ghostCta}`}
          >
            לסילבוס המלא
          </Link>
        </motion.div>
      </motion.div>
    </article>
  );
};

type Props = {
  slides?: StickyCourseSlide[];
  /** Kept for API compat — curtains are always 100dvh */
  vhPerSlide?: number;
};

const StickyCoursesShowcase = ({ slides: slidesProp }: Props) => {
  const slides = useMemo(() => slidesProp ?? buildStickyCourseSlides(), [slidesProp]);
  const level = useMotionCapability();
  const reduced = level === "static";

  if (!slides.length) return null;

  return (
    <section aria-label="מסלולי האקדמיה" className="relative">
      {slides.map((slide, index) => (
        <CurtainSlide key={slide.id} slide={slide} index={index} reduced={reduced} />
      ))}
    </section>
  );
};

export default StickyCoursesShowcase;
