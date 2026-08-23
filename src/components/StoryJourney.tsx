import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ScrollReveal3D } from "./motion";

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
 * פריסה עורכית אחת לכל הרוחבים. קודם היו כאן שתי פריסות נפרדות לגמרי -
 * שני עצי JSX עם אותו תוכן משוכפל - והן נסחפו זו מזו: בדסקטופ היה מספר
 * ענק ככרזה וקו מפריד שנמשח בכניסה, ובטלפון לא היה אף אחד משניהם, אלא
 * חוט שדרה עם נקודות שלא קיים בדסקטופ. אותו סיפור נראה כמו שני עיצובים.
 *
 * עכשיו יש מבנה אחד, וההבדל בין המסכים הוא רק סידור: בדסקטופ עמודת
 * הסימון והקריאה יושבות זו לצד זו והצדדים מתחלפים בין הפרקים, ובטלפון
 * אותם רכיבים בדיוק נערמים. הפיצול לשתי עמודות הוא הדבר היחיד שלא שורד
 * ברוחב 375: עמודת קריאה של 240px היא כ-33 תווים לשורה, הרבה מתחת למידה
 * שאפשר לקרוא בה ברצף.
 *
 * המעבר נעשה במחלקות lg: ולא ב-useMediaQuery, כדי שלא יהיה הבזק של
 * פריסה שגויה בפריים הראשון לפני שהמדידה חוזרת.
 */
const StoryJourney = ({ chapters }: Props) => {
  const reduced = Boolean(useReducedMotion());

  return (
    <div className="relative mx-auto max-w-3xl lg:max-w-6xl">
      <div className="space-y-14 lg:space-y-20">
        {chapters.map((chapter, i) => (
          <Chapter key={chapter.title} chapter={chapter} index={i} reduced={reduced} />
        ))}
      </div>
    </div>
  );
};

type ChapterProps = {
  chapter: StoryChapter;
  index: number;
  reduced: boolean;
};

const Chapter = ({ chapter, index, reduced }: ChapterProps) => {
  const last = chapter.body[chapter.body.length - 1];
  const hasQuote = chapter.body.length > 1 && last.length <= PULL_QUOTE_MAX;
  const paragraphs = hasQuote ? chapter.body.slice(0, -1) : chapter.body;

  /* הצדדים מתחלפים בדסקטופ, ולכן הרוחב של העמוד באמת בשימוש */
  const flip = index % 2 === 1;

  const ruleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ruleRef, offset: ["start 0.9", "start 0.55"] });
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <article className="relative">
      {/* קו מפריד שנמשח פנימה בכניסה לפרק, במקום גבול סטטי */}
      <div ref={ruleRef} className="mb-8 h-px w-full bg-white/8 lg:mb-10" aria-hidden>
        <motion.div
          className="h-px w-full origin-right bg-gradient-to-l from-brand/70 to-transparent"
          style={reduced ? { scaleX: 1 } : { scaleX: draw }}
        />
      </div>

      <ScrollReveal3D from="up" intensity="quiet" fromRotateX={5} fromY={24}>
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-10">
          {/*
            * עמודת הסימון: מספר גדול ככרזה, לא ככפתור.
            *
            * היישור נעשה ב-flex ולא ב-text-align, כי ל-span של המספר יש
            * dir="ltr" (לסדר הספרות), ו-text-align: start נפתר מול הכיוון
            * של האלמנט עצמו - כלומר שמאל. כך המספר נחת בצד שמאל בזמן
            * שהכותרת מיושרת לימין. יישור flex נקבע לפי כיוון המכל, ולכן
            * ה-dir של הילד לא מזיז אותו.
            *
            * המספר נצמד לשוליים החיצוניים של העמוד: בפרקים האי-זוגיים
            * עמודת הסימון עוברת לצד השני, ואיתה גם הצמדתו.
            */}
          <div
            className={`mb-5 flex flex-col items-start lg:mb-0 lg:col-span-3 ${
              flip ? "lg:col-start-10 lg:items-end" : "lg:col-start-1 lg:items-start"
            }`}
          >
            <span
              className="block font-display text-[3.25rem] font-bold leading-[0.85] tracking-tightest text-brand/25 sm:text-[4rem] lg:text-[4.5rem] xl:text-[5.5rem]"
              dir="ltr"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="section-label mt-2 block text-brand lg:mt-3">{chapter.kicker}</span>
          </div>

          {/* עמודת הקריאה: רחבה, אבל עדיין במידת קריאה */}
          <div className={`lg:col-span-8 ${flip ? "lg:col-start-1" : "lg:col-start-5"}`}>
            <h2 className="font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight text-bone sm:text-[2rem] lg:max-w-2xl lg:text-[2.1rem] xl:text-[2.5rem]">
              {chapter.title}
            </h2>
            <div className="mt-4 space-y-4 lg:mt-5">
              {paragraphs.map((p, pi) => (
                <p
                  key={p}
                  className={
                    pi === 0
                      ? "max-w-[60ch] text-[1.0625rem] leading-relaxed text-bone/80 lg:text-lg"
                      : "max-w-[60ch] text-base leading-relaxed text-bone/60"
                  }
                >
                  {p}
                </p>
              ))}
            </div>
            {hasQuote && (
              <p className="mt-5 max-w-xl border-s-2 border-brand/60 ps-4 font-display text-lg font-bold leading-snug tracking-tight text-bone lg:mt-7 lg:ps-5 lg:text-xl">
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
