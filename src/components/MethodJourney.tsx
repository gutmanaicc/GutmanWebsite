import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { SITE } from "../data/site";
import SectionHeader, { AccentWord } from "./SectionHeader";

/**
 * "איך אנחנו מלמדים" כמסע גלילה.
 *
 * הסקשן גבוה בכוונה, והבמה בתוכו דביקה: הצופה גולל, והשלבים נעים לעברו
 * במרחב. השלב הפעיל נמצא במרכז, קרוב וחד; מה שלפניו נסוג לעומק ומיטשטש,
 * ומה שאחריו עוד לא הגיע. קו ורוד מודד את ההתקדמות לאורך כל הדרך.
 *
 * תנועה מופחתת מקבלת את אותם שלבים כרשימה סטטית ופשוטה.
 */

const STEPS = SITE.method;
const STAGE_VH = 62; /* גובה הגלילה שמוקצה לכל שלב */

type StepProps = {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
};

const Step = ({ step, index, progress }: StepProps) => {
  /* מיקום השלב על ציר ההתקדמות: 0 = במרכז הבמה */
  const at = index / (STEPS.length - 1);
  const span = 1 / (STEPS.length - 1);

  const distance = useTransform(progress, (p) => (p - at) / span);

  /* קרוב וחד במרכז, נסוג ומיטשטש ככל שמתרחקים ממנו לשני הכיוונים */
  const opacity = useTransform(distance, [-1.15, -0.5, 0, 0.5, 1.15], [0, 1, 1, 1, 0]);
  const y = useTransform(distance, [-1, 0, 1], [140, 0, -140]);
  const scale = useTransform(distance, [-1, 0, 1], [0.82, 1, 0.82]);
  const z = useTransform(distance, [-1, 0, 1], [-320, 0, -320]);
  const blurPx = useTransform(distance, [-1, -0.35, 0, 0.35, 1], [7, 0, 0, 0, 7]);
  const filter = useTransform(blurPx, (b) => `blur(${b}px)`);

  return (
    <motion.div
      className="absolute inset-x-0 flex flex-col items-center px-5 text-center"
      style={{ opacity, y, scale, z, filter, transformStyle: "preserve-3d" }}
    >
      <span
        className="font-display text-[11px] font-bold tracking-[0.3em] text-brand"
        dir="ltr"
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
      </span>

      <h3 className="mt-6 max-w-2xl font-display text-[clamp(1.9rem,5vw,3.4rem)] font-bold leading-[1.1] tracking-tightest text-bone">
        {step.title}
      </h3>

      <p className="mt-5 max-w-lg text-base leading-relaxed text-bone/55 sm:text-lg">{step.text}</p>
    </motion.div>
  );
};

const MethodJourney = () => {
  const reduced = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  if (reduced) {
    return (
      <section className="py-14 sm:py-20">
        <div className="container-site">
          <SectionHeader
            as="h2"
            kicker="איך אנחנו מלמדים"
            title={
              <>
                שבעה צעדים, <AccentWord>מהבעיה לשיטה</AccentWord>
              </>
            }
            center
          />
          <ol className="mx-auto mt-10 max-w-2xl space-y-px overflow-hidden rounded-[1.25rem] bg-white/10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-canvas p-6 text-center">
                <span className="text-[11px] font-medium tracking-[0.22em] text-brand" dir="ltr">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-bone">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-bone/55">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${STEPS.length * STAGE_VH + 60}vh` }}
      aria-label="איך אנחנו מלמדים"
    >
      {/* הבמה הדביקה: התוכן נשאר במסך בזמן שהגלילה מזיזה את השלבים */}
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-15" aria-hidden />

        {/* זוהר ורוד שנושם מאחורי השלב הפעיל */}
        <motion.div
          className="pointer-events-none absolute h-[560px] w-[560px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(255,95,158,0.13) 0%, rgba(255,95,158,0) 70%)",
            scale: useTransform(progress, [0, 0.5, 1], [0.75, 1.15, 0.75]),
          }}
          aria-hidden
        />

        <div className="container-site relative">
          <div className="mb-14 text-center sm:mb-16">
            <span className="section-label inline-flex text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              איך אנחנו מלמדים
            </span>
            <h2 className="display-2 mt-5 text-bone">
              שבעה צעדים, <AccentWord>מהבעיה לשיטה</AccentWord>
            </h2>
          </div>

          {/* מרחב תלת-ממדי שבו השלבים נעים לעומק */}
          <div
            className="relative h-[320px] sm:h-[340px]"
            style={{ perspective: "1100px", transformStyle: "preserve-3d" }}
          >
            {STEPS.map((step, i) => (
              <Step key={step.title} step={step} index={i} progress={progress} />
            ))}
          </div>
        </div>

        {/* מד ההתקדמות של המסע */}
        <div className="absolute bottom-12 left-1/2 w-[min(70vw,420px)] -translate-x-1/2">
          <div className="h-px w-full bg-white/12">
            <motion.div
              className="h-px origin-right bg-brand"
              style={{ scaleX: progress }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodJourney;
