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
 * "איך זה עובד" כטיימליין ממורכז שנפתח בגלילה: קו ורוד יורד במרכז העמוד
 * ונמתח עם ההתקדמות, וכל שלב נחשף מהחושך בדיוק ברגע שהקו מגיע אליו.
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
  const y = useTransform(progress, [from, to], [46, 0]);
  const blur = useTransform(progress, [from, to], [10, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const scale = useTransform(progress, [from, to], [0.96, 1]);
  /* העיגול נדלק מעט אחרי שהקו חוצה אותו */
  const dotScale = useTransform(progress, [from, from + (to - from) * 0.6], [0.55, 1]);
  const dotBg = useTransform(progress, [from, to], ["#0d0c11", "#ff5f9e"]);
  const dotColor = useTransform(progress, [from, to], ["#6b6b6b", "#ffffff"]);
  const dotBorder = useTransform(progress, [from, to], ["rgba(255,255,255,0.18)", "#ff5f9e"]);
  const glow = useTransform(progress, [from, to], [0, 1]);

  return (
    <li className="relative flex flex-col items-center pb-14 text-center last:pb-0 sm:pb-20">
      {/* הנקודה יושבת על הקו המרכזי ונדלקת כשההתקדמות מגיעה אליה */}
      <motion.span
        className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold sm:h-12 sm:w-12 sm:text-[13px]"
        dir="ltr"
        style={
          reduced
            ? { background: "#ff5f9e", color: "#fff", borderColor: "#ff5f9e" }
            : { scale: dotScale, backgroundColor: dotBg, color: dotColor, borderColor: dotBorder }
        }
        aria-hidden
      >
        <motion.span
          className="pointer-events-none absolute -inset-2 rounded-full bg-brand/25 blur-md"
          style={reduced ? { opacity: 0.7 } : { opacity: glow }}
          aria-hidden
        />
        <span className="relative">{String(index + 1).padStart(2, "0")}</span>
      </motion.span>

      <motion.div
        className="mx-auto mt-6 max-w-xl"
        style={reduced ? undefined : { opacity, y, filter, scale }}
      >
        <span className="section-label mb-2.5 justify-center text-bone/45">
          שלב {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-bone sm:text-[1.75rem]">
          {step.title}
        </h3>
        <p className="mx-auto mt-3.5 max-w-lg text-[15px] leading-relaxed text-bone/55 sm:text-base">
          {step.text}
        </p>
      </motion.div>
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

        <ol ref={listRef} className="relative mx-auto max-w-3xl">
          {/* מסילה עמומה במרכז + מילוי ורוד שנמתח עם הגלילה */}
          <span
            className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-white/10"
            aria-hidden
          />
          <motion.span
            className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 origin-top bg-brand"
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
