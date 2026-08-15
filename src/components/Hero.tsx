import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Pressable from "./Pressable";
import ReviewsRatingBadge from "./ReviewsRatingBadge";
import { WhatsAppIcon } from "./icons";
import { SITE } from "../data/site";
import { getInstructor } from "../data/instructorsData";

const EASE = [0.22, 1, 0.36, 1] as const;

/** שורת כותרת שנחשפת מילה-מילה מתוך מסכת overflow. */
const RevealLine = ({
  text,
  serif = false,
  delayBase = 0,
}: {
  text: string;
  serif?: boolean;
  delayBase?: number;
}) => {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className="block">
      {words.map((word, i) => (
        // הרווח חייב להיות אח של המסכה, לא בתוכה - אחרת הוא נבלע
        <span key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] pt-[0.05em] align-bottom">
            <motion.span
              className="inline-block will-change-transform"
              initial={reduced ? false : { y: "120%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: delayBase + i * 0.08, ease: EASE }}
            >
              <span className={serif ? "accent-serif" : undefined}>{word}</span>
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
};

const FadeIn = ({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const ron = getInstructor("ron-gutman");

/* הצהרות מתחלפות בתג ההירו - כולן מהקופי הקיים באתר */
const EYEBROW_CLAIMS = [
  SITE.claim,
  "לומדים דרך בנייה, לא צפייה מהצד",
  "מעל 100 ביקורות של משתתפים",
];

/** תג עם הצהרה מתחלפת כל כמה שניות, בסגנון הסליידר בהירו של orbix. */
const RotatingEyebrow = () => {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % EYEBROW_CLAIMS.length), 3800);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <span className="inline-flex min-h-[2.6rem] items-center gap-2.5 overflow-hidden rounded-full border border-white/15 bg-white/[0.05] px-4 py-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
      <span className="relative inline-grid text-[13px] font-medium text-bone/70">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={index}
            className="col-start-1 row-start-1 whitespace-nowrap"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: "-110%", opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {EYEBROW_CLAIMS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
};

/**
 * הירו פוסטר על שחור: כותרת בגודל קיר צמודה לצד הפתיחה, תג מתחלף,
 * שורת פעולה, ורצועת שוריל וידאו מעבודות התלמידים בתחתית.
 */
const Hero = () => (
  <section className="relative flex min-h-[calc(100dvh-4.25rem)] flex-col overflow-x-clip">
    {/* הבהוב ורוד עמום של המותג בפינת הקנבס */}
    <div
      className="pointer-events-none absolute -top-32 left-[-15%] h-[32rem] w-[32rem] rounded-full opacity-[0.13] blur-3xl"
      style={{ background: "radial-gradient(circle, #FF2D85 0%, transparent 65%)" }}
      aria-hidden
    />

    <div className="container-site relative z-[2] flex flex-1 flex-col justify-center py-12 sm:py-16">
      <FadeIn delay={0.05} className="self-start">
        <RotatingEyebrow />
      </FadeIn>

      <h1 className="mt-8 text-[clamp(3rem,10.5vw,10rem)] font-semibold leading-[0.98] tracking-tightest text-bone sm:mt-10">
        <RevealLine text={SITE.hero.title} delayBase={0.18} />
        <RevealLine text={SITE.hero.titleAccent} serif delayBase={0.48} />
      </h1>

      <div className="mt-9 flex flex-col gap-7 sm:mt-12 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <FadeIn delay={0.85} className="max-w-xl">
          <p className="text-base font-normal leading-relaxed text-bone/60 sm:text-lg">
            {SITE.hero.subtitle}
          </p>
        </FadeIn>

        <FadeIn delay={1.0} className="shrink-0">
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <ReviewsRatingBadge />
            <div className="flex flex-wrap items-center gap-3.5">
              <Pressable as="link" to="/courses" className="btn-primary ps-7 pe-2.5">
                {SITE.hero.primaryCta}
                {ron && (
                  <img
                    src={ron.image}
                    alt=""
                    aria-hidden
                    className="h-9 w-9 shrink-0 rounded-full object-cover object-top ring-2 ring-ink/15"
                    loading="eager"
                    draggable={false}
                  />
                )}
              </Pressable>
              <Pressable
                as="a"
                href={SITE.contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                rippleTone="pink"
              >
                <WhatsAppIcon size={19} className="shrink-0 text-[#25D366]" />
                דברו איתנו בוואטסאפ
              </Pressable>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>

    {/* רצועת שוריל: עבודת תלמידים אמיתית מתוך בנק העבודות באתר */}
    <FadeIn delay={1.2} className="container-site relative z-[2] pb-8">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10">
        <video
          src="/videos/Movie_1.mp4"
          className="h-[38vh] w-full object-cover sm:h-[44vh]"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="שוריל מתוך עבודות תלמידים"
        />
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-1.5 text-xs font-medium text-bone backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          מתוך עבודות התלמידים באתר
        </span>
      </div>
    </FadeIn>
  </section>
);

export default Hero;
