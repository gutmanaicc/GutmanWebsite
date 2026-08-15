import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import SectionHeader, { AccentWord } from "./SectionHeader";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" בסגנון ה-Timeline של orbix: קו אנכי בצד הפתיחה (ימין ב-RTL)
 * שמתמלא בוורוד עם הגלילה, עיגולי שלב שנדלקים, ותוכן שנכנס בהדרגה.
 */
const ProcessSection = () => {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.85", "end 0.6"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });

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
          {/* מסילת הקו + המילוי הנגלל */}
          <span className="absolute right-0 top-2 bottom-2 w-px bg-white/12" aria-hidden />
          <motion.span
            className="absolute right-0 top-2 bottom-2 w-px origin-top bg-brand"
            style={reduced ? { scaleY: 1 } : { scaleY: fill }}
            aria-hidden
          />

          {SITE.howItWorks.map((step, i) => (
            <motion.li
              key={step.title}
              className="group relative grid gap-3 py-8 pr-10 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:py-10 sm:pr-14"
              initial={reduced ? false : { opacity: 0, y: 44, filter: "blur(6px)" }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, amount: 0.55 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* עיגול על הקו שנדלק כשמגיעים אליו */}
              <motion.span
                className="absolute right-0 top-9 flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-xs font-semibold text-ink sm:top-11"
                dir="ltr"
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                whileInView={
                  reduced
                    ? undefined
                    : { scale: 1, opacity: 1, borderColor: "#ff5f9e" }
                }
                viewport={{ once: false, amount: 0.8 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </motion.span>

              <div>
                <span className="section-label mb-2">
                  שלב {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {step.title}
                </h3>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-muted sm:pt-7 sm:text-lg">
                {step.text}
              </p>

              <span className="absolute bottom-0 left-0 right-10 h-px bg-white/10 sm:right-14" aria-hidden />
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessSection;
