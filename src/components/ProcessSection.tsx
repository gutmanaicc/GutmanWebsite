import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import SectionHeader, { AccentWord } from "./SectionHeader";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" כטיימליין שנחשף בגלילה: קו ורוד בצד הפתיחה (ימין ב-RTL)
 * שנמתח עם הגלילה, וכל שלב עולה מהחושך בדיוק ברגע שהקו מגיע אליו.
 * הכל נגזר מאותו scrollYProgress, כך שהקו והתוכן נעים ביחד ולא בנפרד.
 */

const STEPS = SITE.howItWorks;
/** חלון הגילוי של כל שלב לאורך ההתקדמות, עם חפיפה קלה בין שכנים */
const bandFor = (i: number) => {
  const span = 1 / STEPS.length;
  const start = i * span;
  return [start, start + span * 0.55] as const;
};

type StepProps = {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
};

const Step = ({ step, index, progress, reduced }: StepProps) => {
  const [from, to] = bandFor(index);
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const y = useTransform(progress, [from, to], [42, 0]);
  const blur = useTransform(progress, [from, to], [8, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  /* העיגול נדלק מעט אחרי שהקו חוצה אותו */
  const dotScale = useTransform(progress, [from, from + (to - from) * 0.6], [0.5, 1]);
  const dotBg = useTransform(progress, [from, to], ["#0d0c11", "#ff5f9e"]);
  const dotColor = useTransform(progress, [from, to], ["#6b6b6b", "#ffffff"]);
  const dotBorder = useTransform(progress, [from, to], ["rgba(255,255,255,0.18)", "#ff5f9e"]);

  const motionStyle = reduced ? undefined : { opacity, y, filter };

  return (
    <motion.li
      className="relative grid gap-3 py-9 pr-10 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-12 sm:pr-14"
      style={motionStyle}
    >
      <motion.span
        className="absolute right-0 top-10 flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border text-xs font-semibold sm:top-14"
        dir="ltr"
        style={
          reduced
            ? { background: "#ff5f9e", color: "#fff", borderColor: "#ff5f9e" }
            : { scale: dotScale, backgroundColor: dotBg, color: dotColor, borderColor: dotBorder }
        }
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")}
      </motion.span>

      <div>
        <span className="section-label mb-2">שלב {String(index + 1).padStart(2, "0")}</span>
        <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-bone sm:text-[1.8rem]">
          {step.title}
        </h3>
      </div>
      <p className="max-w-xl text-base leading-relaxed text-bone/55 sm:pt-8 sm:text-lg">{step.text}</p>

      <span className="absolute bottom-0 left-0 right-10 h-px bg-white/10 sm:right-14" aria-hidden />
    </motion.li>
  );
};

const ProcessSection = () => {
  const reduced = Boolean(useReducedMotion());
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.9", "end 0.75"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.5 });

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="container-site">
        <SectionHeader
          index="05"
          kicker="איך זה עובד"
          title={
            <>
              חמישה שלבים. <AccentWord>אפס ניחושים.</AccentWord>
            </>
          }
        />

        <ol ref={listRef} className="relative mr-4 sm:mr-6">
          {/* מסילה עמומה + מילוי ורוד שנמתח עם הגלילה */}
          <span className="absolute right-0 top-2 bottom-2 w-px bg-white/10" aria-hidden />
          <motion.span
            className="absolute right-0 top-2 bottom-2 w-px origin-top bg-brand"
            style={reduced ? { scaleY: 1 } : { scaleY: progress }}
            aria-hidden
          />

          {STEPS.map((step, i) => (
            <Step key={step.title} step={step} index={i} progress={progress} reduced={reduced} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessSection;
