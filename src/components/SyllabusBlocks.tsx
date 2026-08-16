import { motion, useReducedMotion } from "framer-motion";
import type { MarketingSyllabus } from "../data/syllabi";

/**
 * הסילבוס כפי שהמבקר קורא אותו: משפט פתיחה, שלבי למידה כבלוקים קצרים,
 * ובסוף אזור מודגש של "בסיום הסדנה". במובייל כל בלוק עומד בפני עצמו
 * ולא נבלע בגוש טקסט אחד.
 */
const SyllabusBlocks = ({ syllabus }: { syllabus: MarketingSyllabus }) => {
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-base leading-relaxed text-bone/70 sm:text-lg">{syllabus.intro}</p>

      <ol className="mt-10 space-y-px overflow-hidden rounded-[1.25rem] bg-white/10">
        {syllabus.blocks.map((block, i) => (
          <motion.li
            key={block.title}
            className="group relative bg-canvas p-6 transition-colors duration-500 sm:p-7"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="pointer-events-none absolute inset-y-0 right-0 w-px origin-top scale-y-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-y-100"
              aria-hidden
            />
            <span
              className="text-[11px] font-medium tracking-[0.22em] text-bone/30"
              dir="ltr"
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-bone sm:text-[1.35rem]">
              {block.title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-bone/55">{block.text}</p>
          </motion.li>
        ))}
      </ol>

      {/* מה יוצאים איתו - האזור שצריך להיקרא ראשון בסריקה מהירה */}
      <motion.div
        className="mt-8 rounded-[1.25rem] border border-brand/35 bg-brand/[0.07] p-6 sm:p-8"
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="section-label mb-3 flex text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          בסיום הסדנה
        </span>
        <p className="font-display text-lg font-bold leading-snug tracking-tight text-bone sm:text-2xl">
          {syllabus.outcome}
        </p>
      </motion.div>
    </div>
  );
};

export default SyllabusBlocks;
