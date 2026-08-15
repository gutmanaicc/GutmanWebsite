import { motion, useReducedMotion } from "framer-motion";
import Pressable from "./Pressable";
import ReviewsRatingBadge from "./ReviewsRatingBadge";
import { WhatsAppIcon } from "./icons";
import HeroBackdrop from "./motion/hero/HeroBackdrop";
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

/**
 * הירו במלוא גובה המסך בשפת orbix: תווית מיקום, כותרת ענקית שנחשפת
 * מילה-מילה עם מילת סריף נטויה, הוכחה חברתית, וזוג גלולות מרחפות.
 */
const Hero = () => (
  <section className="relative flex min-h-[calc(100dvh-4.25rem)] flex-col overflow-x-clip overflow-y-hidden">
    <div className="absolute inset-0 opacity-55">
      <HeroBackdrop />
    </div>

    <div className="container-site relative z-[2] flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <FadeIn delay={0.05}>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink/75 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {SITE.claim}
          </span>
        </FadeIn>

        <h1 className="display-1 mt-7 text-ink sm:mt-9">
          <RevealLine text={SITE.hero.title} delayBase={0.18} />
          <RevealLine text={SITE.hero.titleAccent} serif delayBase={0.42} />
        </h1>

        <FadeIn delay={0.75} className="mx-auto mt-6 max-w-2xl sm:mt-7">
          <p className="text-base font-normal leading-relaxed text-ink/70 sm:text-lg md:text-xl">
            {SITE.hero.subtitle}
          </p>
        </FadeIn>

        <FadeIn delay={0.9} className="mt-7 sm:mt-8">
          <ReviewsRatingBadge />
        </FadeIn>

        <FadeIn delay={1.0} className="mt-7 sm:mt-9">
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Pressable as="link" to="/courses" className="btn-primary ps-7 pe-2.5">
              {SITE.hero.primaryCta}
              {ron && (
                <img
                  src={ron.image}
                  alt=""
                  aria-hidden
                  className="h-9 w-9 shrink-0 rounded-full object-cover object-top ring-2 ring-white/25"
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
        </FadeIn>

        <FadeIn delay={1.15} className="mt-6">
          <a
            href="#finder"
            className="text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {SITE.hero.secondaryCta}
          </a>
        </FadeIn>
      </div>
    </div>

    {/* רמז גלילה - קו דק שנושם */}
    <div className="pointer-events-none relative z-[2] mb-6 flex justify-center" aria-hidden>
      <motion.span
        className="block h-10 w-px bg-ink/25"
        initial={{ scaleY: 0.3, opacity: 0 }}
        animate={{ scaleY: [0.3, 1, 0.3], opacity: 1 }}
        transition={{
          opacity: { delay: 1.4, duration: 0.5 },
          scaleY: { delay: 1.4, duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ transformOrigin: "top" }}
      />
    </div>
  </section>
);

export default Hero;
