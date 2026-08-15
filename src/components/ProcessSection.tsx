import { motion, useReducedMotion } from "framer-motion";
import SectionHeader, { AccentWord } from "./SectionHeader";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" - שלבים ממוספרים בסגנון ה-Process של orbix:
 * ספרות ענקיות רפאים, שורות עם קווי שיער, והשלב מתגלה בגלילה.
 */
const ProcessSection = () => {
  const reduced = useReducedMotion();

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

        <ol className="border-t border-line">
          {SITE.howItWorks.map((step, i) => (
            <motion.li
              key={step.title}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-5 border-b border-line py-7 sm:grid-cols-[7rem_1fr_1.2fr] sm:gap-8 sm:py-9"
              initial={reduced ? false : { opacity: 0, y: 32 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                className="text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-none tracking-tightest text-ink/15 transition-colors duration-300 group-hover:text-brand"
                dir="ltr"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{step.title}</h3>
              <p className="col-span-2 text-base leading-relaxed text-muted sm:col-span-1 sm:text-lg">
                {step.text}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessSection;
