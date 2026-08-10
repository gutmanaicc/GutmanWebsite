import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { COURSES, type Course } from "../data/courses";
import { useMotionCapability } from "../lib/motion";
import { getMockWindowForVisual } from "./MockWindows";

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

/** Brand palette washes — pink, ink, canvas, deep pink, near-black */
const SLIDE_THEMES: Array<Pick<StickyCourseSlide, "bg" | "fg" | "accentColor">> = [
  { bg: "#FF2D85", fg: "#ffffff", accentColor: "#ffffff" },
  { bg: "#121212", fg: "#f4f4f2", accentColor: "#ff5f9e" },
  { bg: "#f4f4f2", fg: "#191919", accentColor: "#ff5f9e" },
  { bg: "#191919", fg: "#f4f4f2", accentColor: "#FF2D85" },
  { bg: "#ff5f9e", fg: "#191919", accentColor: "#ffffff" },
];

type ShowcaseMeta = {
  accent: string;
  duration: string;
  format: string;
  level: string;
  skills: string[];
};

/** Outcome phrases + compact meta for each sticky card (not duplicate titles). */
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

type SlideLayerProps = {
  slide: StickyCourseSlide;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduced: boolean;
  /** Full capability — stronger arc + visual yaw */
  allowTilt: boolean;
  /** css3d+ — mild scroll unroll without heavy yaw */
  allowArc: boolean;
};

const MetaBadges = ({
  slide,
  isLightBg,
}: {
  slide: StickyCourseSlide;
  isLightBg: boolean;
}) => {
  const badges = [slide.duration, slide.format, slide.level];
  return (
    <div
      className="mt-4 flex flex-wrap justify-center gap-1.5 sm:mt-5 sm:gap-2 lg:justify-start"
      style={{ transform: "translateZ(28px)" }}
    >
      {badges.map((label) => (
        <span
          key={label}
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide sm:px-3 sm:text-xs ${
            isLightBg
              ? "border border-line/80 bg-white/80 text-ink/80"
              : "border border-white/25 bg-white/10"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

const SkillBadges = ({
  skills,
  isLightBg,
}: {
  skills: string[];
  isLightBg: boolean;
}) => (
  <div
    className="mt-3 flex flex-wrap justify-center gap-1.5 sm:mt-4 sm:gap-2 lg:justify-start"
    style={{ transform: "translateZ(22px)" }}
  >
    {skills.map((skill) => (
      <span
        key={skill}
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
          isLightBg
            ? "border border-white/50 bg-white/90 text-zinc-900"
            : "border border-white/20 bg-black/30 text-white backdrop-blur-md"
        }`}
      >
        {skill}
      </span>
    ))}
  </div>
);

const SlideCopy = ({
  slide,
  isLightBg,
}: {
  slide: StickyCourseSlide;
  isLightBg: boolean;
}) => (
  <>
    <h3 className="text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.05] tracking-tight">
      {slide.title}
      <br />
      <em
        className="inline-block font-serif text-[0.72em] font-extrabold italic"
        style={{ color: slide.accentColor, transform: "skewX(-6deg)" }}
      >
        {slide.accent}
      </em>
    </h3>

    <MetaBadges slide={slide} isLightBg={isLightBg} />

    <p
      className={`mx-auto mt-3 max-w-md text-sm leading-snug sm:mt-4 sm:leading-relaxed lg:mx-0 ${
        isLightBg ? "text-ink/70" : "opacity-80"
      }`}
    >
      {slide.description}
    </p>

    <SkillBadges skills={slide.skills} isLightBg={isLightBg} />
  </>
);

const SlideLayer = ({
  slide,
  index,
  total,
  progress,
  reduced,
  allowTilt,
  allowArc,
}: SlideLayerProps) => {
  const last = Math.max(total - 1, 1);
  const center = index / last;
  const half = 0.55 / last;
  const enter = Math.max(0, center - half);
  const leave = Math.min(1, center + half);

  const opacity = useTransform(
    progress,
    index === 0
      ? [0, center + half * 0.35, leave]
      : index === total - 1
        ? [enter, center - half * 0.35, 1]
        : [enter, center - half * 0.25, center + half * 0.25, leave],
    index === 0
      ? [1, 1, 0]
      : index === total - 1
        ? [0, 1, 1]
        : [0, 1, 1, 0],
  );

  const scale = useTransform(
    progress,
    index === 0 ? [0, leave] : [enter, center, leave],
    index === 0 ? [1, 0.96] : [0.94, 1, 0.96],
  );

  const y = useTransform(
    progress,
    index === 0 ? [0, leave] : [enter, center, leave],
    index === 0 ? [0, -20] : [28, 0, -20],
  );

  const arcIn = allowTilt ? 10 : allowArc ? 4 : 0;
  const arcOut = allowTilt ? 6 : allowArc ? 2 : 0;

  // Arc unroll — tiles tip toward the camera as they hit center
  const rotateX = useTransform(
    progress,
    index === 0 ? [0, center, leave] : [enter, center, leave],
    index === 0 ? [0, 0, arcOut] : [arcIn, 0, arcOut],
  );

  // Multi-layer visual theater — stronger perspective on the mock-window panel
  const visualRotateXRaw = useTransform(
    progress,
    index === 0 ? [0, center, leave] : [enter, center, leave],
    allowTilt
      ? index === 0
        ? [0, -2, 8]
        : [14, 0, 9]
      : allowArc
        ? index === 0
          ? [0, 0, 3]
          : [6, 0, 3]
        : [0, 0, 0],
  );

  const visualRotateYRaw = useTransform(
    progress,
    index === 0 ? [0, leave] : [enter, center, leave],
    allowTilt
      ? index === 0
        ? [0, -6]
        : [8, 0, -6]
      : allowArc
        ? index === 0
          ? [0, -2]
          : [3, 0, -2]
        : index === 0
          ? [0, 0]
          : [0, 0, 0],
  );

  const visualZRaw = useTransform(
    progress,
    index === 0 ? [0, leave] : [enter, center, leave],
    allowTilt
      ? index === 0
        ? [40, 12]
        : [8, 48, 12]
      : index === 0
        ? [0, 0]
        : [0, 0, 0],
  );

  const visualRotateX = useSpring(visualRotateXRaw, { stiffness: 120, damping: 26, mass: 0.35 });
  const visualRotateY = useSpring(visualRotateYRaw, { stiffness: 120, damping: 26, mass: 0.35 });
  const visualZ = useSpring(visualZRaw, { stiffness: 130, damping: 28, mass: 0.35 });

  const MockWindow = getMockWindowForVisual(slide.visual);
  const isLightBg = slide.fg === "#191919";

  if (reduced) {
    return (
      <article
        className="relative flex min-h-[85vh] flex-col justify-center py-16"
        style={{ backgroundColor: slide.bg, color: slide.fg }}
      >
        {isLightBg && (
          <div className="pointer-events-none absolute inset-0 grid-canvas opacity-50" aria-hidden />
        )}
        <div className="deck-strip-tight relative grid w-full items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-right">
            <SlideCopy slide={slide} isLightBg={isLightBg} />
            <Link
              to={slide.href}
              className="relative mt-8 inline-flex min-h-11 w-auto shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: isLightBg ? "#191919" : "#ffffff",
                color: isLightBg ? "#ffffff" : "#191919",
              }}
            >
              לפרטי המסלול
            </Link>
          </div>
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/90 p-3 shadow-card ring-1 ring-white/10 sm:p-4">
            <MockWindow />
          </div>
        </div>
      </article>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 flex items-center overflow-hidden"
      style={{
        opacity,
        scale,
        y,
        rotateX,
        transformPerspective: 1200,
        color: slide.fg,
      }}
    >
      <div className="deck-strip-tight relative grid w-full items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div
          className="relative z-10 order-2 text-center lg:order-1 lg:text-right"
          style={{ transformStyle: "preserve-3d" }}
        >
          <SlideCopy slide={slide} isLightBg={isLightBg} />
          <Link
            to={slide.href}
            className="relative mt-8 inline-flex min-h-11 w-auto shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: isLightBg ? "#191919" : "#ffffff",
              color: isLightBg ? "#ffffff" : "#191919",
              transform: "translateZ(36px)",
            }}
          >
            לפרטי המסלול
          </Link>
        </div>

        <motion.div
          className="relative z-10 order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-md"
          style={{
            rotateX: visualRotateX,
            rotateY: visualRotateY,
            z: visualZ,
            transformPerspective: 1400,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Soft under-plane for layered depth */}
          <div
            className="pointer-events-none absolute inset-3 -z-10 rounded-[1.5rem] bg-black/10 blur-md"
            style={{ transform: "translateZ(-28px) scale(0.96)" }}
            aria-hidden
          />
          <div
            className={`overflow-hidden rounded-[1.75rem] p-3 shadow-card ring-1 sm:p-4 ${
              isLightBg
                ? "border border-white/40 bg-white ring-ink/5"
                : "border border-white/20 bg-white/95 ring-white/15"
            }`}
            style={{ transform: "translateZ(28px)" }}
          >
            <MockWindow />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

type BackgroundProps = {
  slides: StickyCourseSlide[];
  progress: MotionValue<number>;
};

/** Smoothly interpolates full-bleed background across slide brand colors */
const DynamicBackground = ({ slides, progress }: BackgroundProps) => {
  const colors = slides.map((s) => s.bg);
  const stops = slides.map((_, i) => (slides.length === 1 ? 0 : i / (slides.length - 1)));
  const backgroundColor = useTransform(progress, stops, colors);

  const showGrid = useTransform(progress, (p) => {
    if (slides.length < 2) return slides[0]?.bg === "#f4f4f2" ? 0.5 : 0;
    const idx = p * (slides.length - 1);
    const a = Math.floor(idx);
    const b = Math.min(a + 1, slides.length - 1);
    const t = idx - a;
    const lightA = slides[a]?.bg === "#f4f4f2" ? 1 : 0;
    const lightB = slides[b]?.bg === "#f4f4f2" ? 1 : 0;
    return (lightA * (1 - t) + lightB * t) * 0.55;
  });

  const gridY = useTransform(progress, [0, 1], [0, 48]);
  const orbY = useTransform(progress, [0, 1], [36, -90]);
  const orbYSlow = useTransform(progress, [0, 1], [20, -50]);

  return (
    <>
      <motion.div className="absolute inset-0" style={{ backgroundColor }} aria-hidden />
      <motion.div
        className="pointer-events-none absolute inset-0 grid-canvas"
        style={{ opacity: showGrid, y: gridY }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-24 top-[20%] h-72 w-72 rounded-full bg-white/15 blur-3xl"
        style={{ y: orbY, opacity: 0.55 }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-[10%] h-56 w-56 rounded-full bg-[#FF2D85]/20 blur-3xl"
        style={{ y: orbYSlow, opacity: 0.35 }}
        aria-hidden
      />
    </>
  );
};

type Props = {
  slides?: StickyCourseSlide[];
  vhPerSlide?: number;
};

const StickyCoursesShowcase = ({ slides: slidesProp, vhPerSlide = 100 }: Props) => {
  const slides = useMemo(() => slidesProp ?? buildStickyCourseSlides(), [slidesProp]);
  const level = useMotionCapability();
  const reduced = level === "static";
  const allowTilt = level === "full";
  const allowArc = level !== "static";
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    mass: 0.3,
  });

  if (!slides.length) return null;

  if (reduced) {
    return (
      <section aria-label="מסלולי האקדמיה">
        {slides.map((slide, index) => (
          <SlideLayer
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            progress={smoothProgress}
            reduced
            allowTilt={false}
            allowArc={false}
          />
        ))}
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      aria-label="מסלולי האקדמיה"
      className="relative"
      style={{ height: `${slides.length * vhPerSlide}vh` }}
    >
      <div className="sticky top-[4.25rem] h-[calc(100dvh-4.25rem)] overflow-hidden">
        <DynamicBackground slides={slides} progress={smoothProgress} />

        <div className="relative h-full [&_[data-reveal]]:translate-y-0 [&_[data-reveal]]:opacity-100">
          {slides.map((slide, index) => (
            <SlideLayer
              key={slide.id}
              slide={slide}
              index={index}
              total={slides.length}
              progress={smoothProgress}
              reduced={false}
              allowTilt={allowTilt}
              allowArc={allowArc}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StickyCoursesShowcase;
