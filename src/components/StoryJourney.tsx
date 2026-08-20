import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollReveal3D } from "./motion";
import { useMediaQuery } from "../lib/motion";

export type StoryChapter = {
  kicker: string;
  title: string;
  body: string[];
};

type Props = { chapters: StoryChapter[] };

/** משפט קצר בסוף פרק מתפקד כמסקנה, ולכן מקבל טיפול של ציטוט. */
const PULL_QUOTE_MAX = 95;

/**
 * הסיפור האישי כמסע ולא כקיר טקסט.
 *
 * בדסקטופ זו פריסה עורכית לרוחב ולא טור אחד ארוך: לכל פרק יש עמודת
 * סימון צרה עם מספר ענק וכותרת הפרק, ולצידה עמודת קריאה. הצדדים
 * מתחלפים בין הפרקים, כך שהעין נעה על פני הרוחב במקום לרדת בקו ישר.
 *
 * מידת הקריאה נשמרת: הסקשן מתרחב, אבל עמודת הטקסט עצמה חסומה בערך
 * ב-60 תווים. "רחב יותר" לא אומר שורות ארוכות יותר.
 *
 * בטלפון אין מקום לשתי עמודות, ולכן חוזרים לחוט שדרה אנכי בשוליים -
 * אותו רעיון של התקדמות, בפריסה שמתאימה לרוחב.
 */
const StoryJourney = ({ chapters }: Props) => {
  const reduced = Boolean(useReducedMotion());
  const wide = useMediaQuery("(min-width: 1024px)");
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 0.75", "end 0.9"] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <div ref={trackRef} className={`relative mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
      {/* חוט השדרה קיים רק בטלפון, שם הפריסה באמת טור אחד */}
      {!wide && (
        <div className="pointer-events-none absolute inset-y-3 start-[7px] w-px bg-white/10" aria-hidden>
          <motion.div
            className="h-full w-full origin-top bg-gradient-to-b from-brand via-brand to-brand/20"
            style={reduced ? { scaleY: 1 } : { scaleY: fill }}
          />
        </div>
      )}

      <div className={wide ? "space-y-20" : "space-y-12"}>
        {chapters.map((chapter, i) => (
          <Chapter key={chapter.title} chapter={chapter} index={i} wide={wide} reduced={reduced} />
        ))}
      </div>
    </div>
  );
};

type ChapterProps = {
  chapter: StoryChapter;
  index: number;
  wide: boolean;
  reduced: boolean;
};

const Chapter = ({ chapter, index, wide, reduced }: ChapterProps) => {
  const last = chapter.body[chapter.body.length - 1];
  const hasQuote = chapter.body.length > 1 && last.length <= PULL_QUOTE_MAX;
  const paragraphs = hasQuote ? chapter.body.slice(0, -1) : chapter.body;

  /* הצדדים מתחלפים, ולכן הרוחב של העמוד באמת בשימוש */
  const flip = index % 2 === 1;

  const ruleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ruleRef, offset: ["start 0.9", "start 0.55"] });
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (!wide) {
    return (
      <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={26}>
        <article className="relative ps-8">
          <span
            className="absolute start-0 top-2 flex h-4 w-4 items-center justify-center rounded-full border border-brand/50 bg-canvas"
            aria-hidden
          >
            <span className="block h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
          <span className="section-label text-brand">{chapter.kicker}</span>
          <h2 className="mt-3 font-display text-[1.6rem] font-bold leading-[1.15] tracking-tight text-bone">
            {chapter.title}
          </h2>
          <div className="mt-4 space-y-4">
            {paragraphs.map((p, pi) => (
              <p
                key={p}
                className={
                  pi === 0
                    ? "text-[1.0625rem] leading-relaxed text-bone/80"
                    : "text-base leading-relaxed text-bone/60"
                }
              >
                {p}
              </p>
            ))}
          </div>
          {hasQuote && (
            <p className="mt-5 border-s-2 border-brand/60 ps-4 font-display text-lg font-bold leading-snug tracking-tight text-bone">
              {last}
            </p>
          )}
        </article>
      </ScrollReveal3D>
    );
  }

  return (
    <article className="relative">
      {/* קו מפריד שנמשח פנימה בכניסה לפרק, במקום גבול סטטי */}
      <div ref={ruleRef} className="mb-10 h-px w-full bg-white/8" aria-hidden>
        <motion.div
          className="h-px w-full origin-right bg-gradient-to-l from-brand/70 to-transparent"
          style={reduced ? { scaleX: 1 } : { scaleX: draw }}
        />
      </div>

      <ScrollReveal3D from="up" intensity="quiet" fromRotateX={5} fromY={24}>
        <div className="grid grid-cols-12 items-start gap-x-10">
          {/* עמודת הסימון: מספר גדול ככרזה, לא ככפתור */}
          <div
            className={`col-span-3 ${flip ? "col-start-10 text-start" : "col-start-1 text-end"}`}
          >
            <span
              className="block font-display text-[4.5rem] font-bold leading-[0.85] tracking-tightest text-brand/25 xl:text-[5.5rem]"
              dir="ltr"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="section-label mt-3 block text-brand">{chapter.kicker}</span>
          </div>

          {/* עמודת הקריאה: רחבה מהקודם, אבל עדיין במידת קריאה */}
          <div className={`col-span-8 ${flip ? "col-start-1" : "col-start-5"}`}>
            <h2 className="max-w-2xl font-display text-[2.1rem] font-bold leading-[1.12] tracking-tight text-bone xl:text-[2.5rem]">
              {chapter.title}
            </h2>
            <div className="mt-5 space-y-4">
              {paragraphs.map((p, pi) => (
                <p
                  key={p}
                  className={
                    pi === 0
                      ? "max-w-[60ch] text-lg leading-relaxed text-bone/80"
                      : "max-w-[60ch] text-base leading-relaxed text-bone/60"
                  }
                >
                  {p}
                </p>
              ))}
            </div>
            {hasQuote && (
              <p className="mt-7 max-w-xl border-s-2 border-brand/60 ps-5 font-display text-xl font-bold leading-snug tracking-tight text-bone">
                {last}
              </p>
            )}
          </div>
        </div>
      </ScrollReveal3D>
    </article>
  );
};

export default StoryJourney;
