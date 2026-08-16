import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import SectionHeader, { AccentWord } from "./SectionHeader";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" כטיימליין ממורכז שנפתח בגלילה.
 *
 * אין כאן קו אחד רציף לאורך כל הסקשן: קו כזה חוצה את הטקסט הממורכז
 * ונראה כמו שריטה על העמוד. במקום זה כל שלב מחובר לשלב הבא במקטע קצר
 * שמתמלא בעצמו, כך שהקו מופיע רק במרווח שבין השלבים - שם הוא באמת
 * מחבר, ולא חותך.
 */

const STEPS = SITE.howItWorks;
const SPAN = 1 / STEPS.length;

/** חלון הגילוי של כל שלב לאורך ההתקדמות, עם חפיפה קלה בין שכנים */
const bandFor = (i: number) => {
  const start = i * SPAN;
  return [start, start + SPAN * 0.55] as const;
};

type StepProps = {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
  isLast: boolean;
};

const Step = ({ step, index, progress, reduced, isLast }: StepProps) => {
  const [from, to] = bandFor(index);
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const y = useTransform(progress, [from, to], [42, 0]);
  const blur = useTransform(progress, [from, to], [10, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const scale = useTransform(progress, [from, to], [0.96, 1]);

  /* העיגול נדלק ברגע שההתקדמות נוגעת בשלב */
  const dotScale = useTransform(progress, [from, from + (to - from) * 0.6], [0.6, 1]);
  const dotBg = useTransform(progress, [from, to], ["#141319", "#ff5f9e"]);
  const dotColor = useTransform(progress, [from, to], ["#6b6b6b", "#ffffff"]);
  const dotBorder = useTransform(progress, [from, to], ["rgba(255,255,255,0.16)", "#ff5f9e"]);
  const glow = useTransform(progress, [from, to], [0, 0.9]);

  /* המקטע המחבר מתמלא רק אחרי שהשלב כולו נחשף, בדרך אל השלב הבא */
  const linkFill = useTransform(progress, [to, from + SPAN], [0, 1]);

  return (
    <li className="flex flex-col items-center text-center">
      <motion.span
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold sm:h-[3.25rem] sm:w-[3.25rem] sm:text-sm"
        dir="ltr"
        style={
          reduced
            ? { background: "#ff5f9e", color: "#fff", borderColor: "#ff5f9e" }
            : { scale: dotScale, backgroundColor: dotBg, color: dotColor, borderColor: dotBorder }
        }
        aria-hidden
      >
        <motion.span
          className="pointer-events-none absolute -inset-2.5 rounded-full bg-brand/30 blur-lg"
          style={reduced ? { opacity: 0.65 } : { opacity: glow }}
          aria-hidden
        />
        <span className="relative">{String(index + 1).padStart(2, "0")}</span>
      </motion.span>

      <motion.div
        className="mx-auto mt-5 max-w-xl"
        style={reduced ? undefined : { opacity, y, filter, scale }}
      >
        <span className="section-label mb-2.5 justify-center text-bone/40">
          שלב {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-bone sm:text-[1.75rem]">
          {step.title}
        </h3>
        <p className="mx-auto mt-3.5 max-w-lg text-[15px] leading-relaxed text-bone/55 sm:text-base">
          {step.text}
        </p>
      </motion.div>

      {/* המחבר: מקטע קצר בין שלב לשלב, דוהה בשני קצותיו כדי שלא ייראה חתוך */}
      {!isLast && (
        <span
          className="relative my-9 h-16 w-px overflow-hidden sm:my-11 sm:h-20"
          aria-hidden
        >
          <span className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
          <motion.span
            className="absolute inset-0 origin-top bg-gradient-to-b from-brand/0 via-brand to-brand/0"
            style={reduced ? { scaleY: 1 } : { scaleY: linkFill }}
          />
        </span>
      )}
    </li>
  );
};

const ProcessSection = () => {
  const reduced = Boolean(useReducedMotion());
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.85", "end 0.8"],
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

        <ol ref={listRef} className="mx-auto flex max-w-3xl flex-col items-center">
          {STEPS.map((step, i) => (
            <Step
              key={step.title}
              step={step}
              index={i}
              progress={progress}
              reduced={reduced}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessSection;
