import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import { ACTIVE_COURSES, type Course } from "../data/courses";
import { springSoft, useMotionCapability } from "../lib/motion";
import { useRegisterModal } from "../context/RegisterModalContext";
import { getMockWindowForVisual } from "./MockWindows";

/** Exact brand tokens - no off-palette colors */
const BRAND = {
  canvas: "#F4F4F2",
  ink: "#191919",
  pink: "#FF2D85",
} as const;

/** Sticky offset under site header + peek strip between stacked cards (mobile). */
const MOBILE_STICKY_BASE_PX = 80;
const MOBILE_STICKY_STEP_PX = 12;

export type StickyCourseSlide = {
  id: string;
  title: string;
  accent?: string;
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
  accent?: string;
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
    accent: "3 מסלולי משנה לעסק",
    duration: "5 מפגשים",
    format: "פרונטלי",
    level: "ללא רקע טכני",
    skills: ["CRM", "תשלומים", "דף נחיתה"],
  },
};

export function buildStickyCourseSlides(courses: Course[] = ACTIVE_COURSES): StickyCourseSlide[] {
  return courses.map((course, index) => {
    const theme = SLIDE_THEMES[index % SLIDE_THEMES.length];
    const meta = SHOWCASE_META[course.slug];
    return {
      id: course.slug,
      title: course.shortTitle,
      /*
       * בלי fallback ל-cardSubtitle: הוא בדיוק מה שיושב ב-description,
       * ולכן שני מסלולים הציגו את אותו משפט פעמיים - פעם בטיפוגרפיית
       * תצוגה ורודה וענקית, ומיד מתחת כטקסט גוף. עדיף בלי שורת אקצנט
       * מאשר עם כפילות.
       */
      accent: meta?.accent,
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
        ready: { opacity: 1, y: 0 },
        show: {
          opacity: 1,
          y: 0,
          transition: springSoft,
        },
      };

type SlideChromeProps = {
  slide: StickyCourseSlide;
  reduced: boolean;
  focused: boolean;
  /** Desktop mock window - omitted on mobile */
  showMock?: boolean;
  compact?: boolean;
};

const SlideChrome = ({ slide, reduced, focused, showMock = false, compact = false }: SlideChromeProps) => {
  const { openRegisterModal } = useRegisterModal();
  const MockWindow = getMockWindowForVisual(slide.visual);
  const isLight = slide.bg === BRAND.canvas;
  const item = revealItem(reduced);

  const primaryCta = isLight
    ? { backgroundColor: BRAND.ink, color: BRAND.canvas }
    : { backgroundColor: BRAND.canvas, color: BRAND.ink };
  const ghostCta = isLight
    ? "border-[#191919]/25 text-[#191919]"
    : "border-[#F4F4F2]/35 text-[#F4F4F2]";

  return (
    <motion.div
      className={`relative z-10 flex w-full flex-col items-center text-center opacity-100 ${
        compact ? "max-w-none px-0" : "max-w-3xl px-4 sm:px-6"
      }`}
      variants={revealContainer}
      initial="ready"
      animate={focused ? "show" : "ready"}
    >
      {showMock && (
        <motion.div variants={item} className="mb-5 hidden w-full max-w-[15.5rem] md:mb-7 md:block md:max-w-sm">
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
      )}

      <motion.p
        variants={item}
        className={`mb-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#FF2D85] ${compact ? "" : "sm:mb-2 sm:text-xs"}`}
      >
        {slide.format} · {slide.duration}
      </motion.p>

      <motion.h3
        variants={item}
        className={`font-bold leading-[1.05] tracking-tight ${
          compact
            ? "max-w-full text-[1.45rem] sm:text-[1.65rem]"
            : "max-w-2xl text-[clamp(1.75rem,7vw,3.75rem)]"
        }`}
      >
        {slide.title}
        <br />
        <em className="inline-block font-display text-[0.78em] font-extrabold italic text-[#FF2D85]">
          {slide.accent}
        </em>
      </motion.h3>

      <motion.p
        variants={item}
        className={`mt-2.5 max-w-md leading-relaxed ${
          compact ? "text-sm" : "mt-3 text-sm sm:mt-4 sm:text-base"
        } ${isLight ? "text-[#191919]/70" : "text-[#F4F4F2]/75"}`}
      >
        {slide.description}
      </motion.p>

      <motion.ul
        variants={item}
        className={`mt-3 flex flex-wrap justify-center gap-1.5 ${compact ? "" : "sm:mt-4 sm:gap-2"}`}
      >
        {slide.skills.map((skill) => (
          <li
            key={skill}
            className={`inline-flex min-h-8 items-center rounded-full border border-[#FF2D85]/35 px-3 py-1 text-xs font-medium ${
              isLight ? "bg-[#FF2D85]/5 text-[#191919]" : "bg-[#FF2D85]/15 text-[#F4F4F2]"
            }`}
          >
            {skill}
          </li>
        ))}
      </motion.ul>

      <motion.div
        variants={item}
        className={`mt-4 flex w-full flex-wrap items-center justify-center gap-2 ${
          compact ? "mt-3.5 max-w-none" : "mt-6 max-w-md sm:mt-8"
        }`}
      >
        <button
          type="button"
          className="inline-flex min-h-11 min-w-[9rem] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform active:scale-[0.98] sm:flex-none sm:min-w-[9.5rem] sm:px-5"
          style={primaryCta}
          onClick={() =>
            openRegisterModal({ courseId: slide.id, leadSource: `showcase-${slide.id}` })
          }
        >
          שמרו לי מקום
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.4} />
        </button>
        <Link
          to={slide.href}
          className={`inline-flex min-h-11 min-w-[9rem] flex-1 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-transform active:scale-[0.98] sm:flex-none sm:min-w-[9.5rem] sm:px-5 ${ghostCta}`}
        >
          לסילבוס המלא
        </Link>
      </motion.div>
    </motion.div>
  );
};

type MobileStackCardProps = {
  slide: StickyCourseSlide;
  index: number;
  total: number;
};

/** Slim fixed height for high-density mobile deck cards. */
const MOBILE_CARD_HEIGHT_PX = 148;

type MobileCardTone = "light" | "dark";

/** Colorful section palette from the reference stack (track order). */
const MOBILE_CARD_THEME: Record<
  Course["visual"],
  { bg: string; tone: MobileCardTone }
> = {
  social: { bg: "#FF2D85", tone: "dark" },
  students: { bg: "#F4F4F2", tone: "light" },
  video: { bg: "#191919", tone: "dark" },
  business: { bg: "#EDE6DC", tone: "light" },
  landing: { bg: "#F4F4F2", tone: "light" },
};

/**
 * True deck overlap (&lt; md):
 * - Per-track colorful surfaces + adaptive contrast
 * - Last card: z-50 covers the stack
 * - Slim RTL row: title / subtitle + ArrowUpLeft
 */
const MobileStackCard = ({ slide, index, total }: MobileStackCardProps) => {
  const isLast = index === total - 1;
  const stickyTop = isLast
    ? MOBILE_STICKY_BASE_PX
    : MOBILE_STICKY_BASE_PX + index * MOBILE_STICKY_STEP_PX;
  const zIndex = isLast ? 50 : 10 + index;
  const cardHeight = isLast
    ? MOBILE_CARD_HEIGHT_PX + (total - 1) * MOBILE_STICKY_STEP_PX
    : MOBILE_CARD_HEIGHT_PX;

  const theme = MOBILE_CARD_THEME[slide.visual] ?? MOBILE_CARD_THEME.students;
  const isDark = theme.tone === "dark";

  return (
    <article
      className={`sticky mb-3 box-border overflow-hidden rounded-3xl last:mb-0 ${
        isDark
          ? "shadow-[0_4px_22px_rgba(255,45,133,0.22)]"
          : "border border-zinc-900/5 shadow-[0_4px_20px_rgba(255,45,133,0.14)]"
      }`}
      style={{
        top: stickyTop,
        zIndex,
        height: cardHeight,
        backgroundColor: theme.bg,
      }}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-xl ${
          isDark ? "bg-white/10" : "bg-[#FF2D85]/15"
        }`}
        aria-hidden
      />

      <div
        className="relative flex h-full flex-row items-center justify-between gap-4 px-6 py-5"
        dir="rtl"
      >
        <div className="min-w-0 flex-1 text-right">
          <h3
            className={`mb-1.5 line-clamp-2 text-xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            {slide.title}
          </h3>
          <p
            className={`line-clamp-2 max-w-[80%] text-sm font-normal leading-relaxed ${
              isDark ? "text-white/80" : "text-zinc-600"
            }`}
          >
            {slide.description}
          </p>
        </div>

        <Link
          to={slide.href}
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-transform hover:scale-105 hover:border-[#FF2D85] hover:text-[#FF2D85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50 ${
            isDark
              ? "border-white/40 text-white"
              : "border-zinc-900/30 text-zinc-900"
          }`}
          aria-label={`לפרטי המסלול: ${slide.title}`}
        >
          <ArrowUpLeft className="h-5 w-5" aria-hidden strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
};

type CurtainProps = {
  slide: StickyCourseSlide;
  index: number;
  reduced: boolean;
};

/**
 * Desktop sibling sticky curtains (top-0 / 100dvh) with mock visuals.
 */
const CurtainSlide = ({ slide, index, reduced }: CurtainProps) => {
  const panelRef = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(index === 0);
  const isLight = slide.bg === BRAND.canvas;
  const zIndex = (index + 1) * 10;

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.55) setFocused(true);
  });

  return (
    <article
      ref={panelRef}
      className="sticky top-0 flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden"
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#FF2D85]/40" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-[#FF2D85]/15 blur-3xl"
        aria-hidden
      />

      <SlideChrome slide={slide} reduced={reduced} focused={focused} showMock />
    </article>
  );
};

type Props = {
  slides?: StickyCourseSlide[];
  /** Kept for API compat - desktop curtains are always 100dvh */
  vhPerSlide?: number;
};

const StickyCoursesShowcase = ({ slides: slidesProp }: Props) => {
  const slides = useMemo(() => slidesProp ?? buildStickyCourseSlides(), [slidesProp]);
  const level = useMotionCapability();
  const reduced = level === "static";

  if (!slides.length) return null;

  return (
    <>
      {/* Mobile: compact deck - last card z-50 fully covers stack */}
      <section
        aria-label="מסלולי האקדמיה"
        className="relative isolate z-0 px-4 pb-2 pt-1 md:hidden"
      >
        {slides.map((slide, index) => (
          <MobileStackCard
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
          />
        ))}
      </section>

      {/* Desktop: full-viewport curtain wipes with mock windows */}
      <section aria-label="מסלולי האקדמיה" className="relative hidden md:block">
        {slides.map((slide, index) => (
          <CurtainSlide key={slide.id} slide={slide} index={index} reduced={reduced} />
        ))}
      </section>
    </>
  );
};

export default StickyCoursesShowcase;
