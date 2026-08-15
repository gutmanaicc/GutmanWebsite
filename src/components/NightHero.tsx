import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { SITE } from "../data/site";

/**
 * הירו בלילה: ציור מלא מסך של שדה פורח מתחת לשמי כוכבים, עם טיפוגרפיית
 * תצוגה סריפית במרכז. התמונה חיה - לופ פלינדרום שקט של עשב שנע ומסכים
 * שנושמים, שנפתח מעל התמונה הסטטית רק כשהוא מוכן לנגן. הרקע נע לאט יותר
 * מהתוכן בגלילה, והכותרת עולה מטשטוש לחדות. תנועה מופחתת נשארת סטטית.
 */

const IMAGE = "/images/hero-night.jpg";
const VIDEO_WEBM = "/videos/hero-night.webm";
const VIDEO_MP4 = "/videos/hero-night.mp4";

const EASE = [0.22, 1, 0.36, 1] as const;

/** עולה מלמטה עם טשטוש שנפתח, בהשהיה מדורגת */
const rise = (delay: number) => ({
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: EASE, delay },
  },
});

const NightHero = () => {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  /**
   * הווידאו מתגלה בדעיכה מעל התמונה רק ברגע שהוא באמת מנגן. יש סביבות
   * (iframe בלי allow-autoplay, חיסכון בסוללה) שחוסמות ניגון אוטומטי עד
   * למחווה של המשתמש, ולכן כל אינטראקציה ראשונה מנסה שוב.
   */
  useEffect(() => {
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;

    const reveal = () => setVideoReady(true);
    video.addEventListener("playing", reveal);

    const attempt = () => {
      const play = video.play();
      if (play) play.catch(() => undefined);
    };
    attempt();

    const events = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"] as const;
    const retry = () => {
      if (video.paused) attempt();
      else events.forEach((e) => window.removeEventListener(e, retry));
    };
    events.forEach((e) => window.addEventListener(e, retry, { passive: true }));

    return () => {
      video.removeEventListener("playing", reveal);
      events.forEach((e) => window.removeEventListener(e, retry));
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  /* הרקע נשאר מאחור: זז מעט ומתעמעם בזמן שהתוכן מפנה את המקום */
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-canvas px-5 pb-24 pt-28 sm:px-8 sm:pb-28"
    >
      {/* הציור */}
      <motion.div
        className="absolute inset-0 z-0"
        style={reduced ? undefined : { y: bgY, scale: bgScale }}
        aria-hidden
      >
        <img
          src={IMAGE}
          alt=""
          className="h-full w-full object-cover object-bottom"
          fetchPriority="high"
          decoding="async"
        />
        {!reduced && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-[1200ms] ease-out"
            style={{ opacity: videoReady ? 1 : 0 }}
            poster={IMAGE}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src={VIDEO_WEBM} type="video/webm" />
            <source src={VIDEO_MP4} type="video/mp4" />
          </video>
        )}
      </motion.div>

      {/* שכבות קריאות: כהה למעלה לניווט, הילה מרכזית לטקסט, מעבר לקנבס למטה */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,9,14,0.55) 0%, rgba(10,9,14,0.12) 24%, rgba(10,9,14,0) 50%, rgba(13,12,17,0.55) 90%, #0d0c11 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(58% 40% at 50% 44%, rgba(10,9,14,0.5) 0%, rgba(10,9,14,0.16) 62%, rgba(10,9,14,0) 100%)",
        }}
        aria-hidden
      />

      <motion.div
        className="relative z-[2] w-full max-w-3xl text-center text-bone"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        initial="hidden"
        animate="show"
      >
        <motion.span
          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-bone/55 sm:text-xs"
          variants={reduced ? undefined : rise(0.1)}
        >
          <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
          {SITE.hebrewName}
        </motion.span>

        <motion.h1
          className="mt-7 font-serif font-medium leading-[1.12] tracking-tight text-bone"
          style={{ fontSize: "clamp(2.4rem, 7.2vw, 5.25rem)" }}
          variants={reduced ? undefined : rise(0.24)}
        >
          במקום שבו רעיון
          <br />
          הופך למשהו <span className="text-brand">אמיתי</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-7 max-w-lg text-[15px] leading-relaxed text-bone/65 sm:text-base"
          variants={reduced ? undefined : rise(0.42)}
        >
          {SITE.tagline}. לומדים דרך בנייה, בזמן אמת, ויוצאים עם תוצר אמיתי שנשאר איתכם.
        </motion.p>

        <motion.div
          className="mt-11 flex flex-wrap items-center justify-center gap-3"
          variants={reduced ? undefined : rise(0.58)}
        >
          <Link
            to="/courses"
            className="group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-bone/35 px-8 text-sm font-medium text-bone transition-colors duration-500 hover:border-bone/70 hover:text-ink sm:text-[15px]"
          >
            <span
              className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
              aria-hidden
            />
            <span className="relative">{SITE.hero.primaryCta}</span>
          </Link>

          <a
            href="#finder"
            className="inline-flex min-h-12 items-center justify-center px-5 text-sm text-bone/55 underline-offset-[6px] transition-colors duration-300 hover:text-bone hover:underline sm:text-[15px]"
          >
            {SITE.hero.secondaryCta}
          </a>
        </motion.div>
      </motion.div>

      {/* רמז גלילה */}
      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 z-[2] -translate-x-1/2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        aria-hidden
      >
        <span className="block h-12 w-px overflow-hidden bg-bone/15">
          <motion.span
            className="block h-1/3 w-px bg-bone/70"
            animate={reduced ? undefined : { y: ["-100%", "300%"] }}
            transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
      </motion.div>
    </section>
  );
};

export default NightHero;
