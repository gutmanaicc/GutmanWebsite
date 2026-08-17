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
import { useMediaQuery } from "../lib/motion";

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
/*
 * גובה הגלילה שמוקצה לכל שלב.
 *
 * בטלפון קצר יותר: שבעה שלבים על 62vh הם מסע של כמעט 500vh, וזו גלילה
 * ארוכה מדי כשכל תנועת אצבע מכסה פחות מסך. 46vh מוריד את המסע ל-382vh
 * ושומר על אותה תחושה בלי לכלוא את המשתמש.
 */
const STAGE_VH = 62;
const STAGE_VH_LEAN = 46;

type StepProps = {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
  /** נייד: אותה כוריאוגרפיה, בלי המאפיינים שמכריחים ציור מחדש */
  lean: boolean;
};

const Step = ({ step, index, progress, lean }: StepProps) => {
  /* מיקום השלב על ציר ההתקדמות: 0 = במרכז הבמה */
  const at = index / (STEPS.length - 1);
  const span = 1 / (STEPS.length - 1);

  const distance = useTransform(progress, (p) => (p - at) / span);

  /*
   * כל שלב מחזיק את הטווח שלו חד, ומוסר אותו מהר.
   *
   * קודם השקיפות דעכה עד 1.15 ספאנים בזמן שהחדות נגמרה כבר ב-0.35,
   * ולכן בכל רגע נתון היו שניים או שלושה שלבים על המסך וכמעט כולם
   * בתוך אזור הטשטוש. זה מה שנקרא כמו "הכול מטושטש": השלב שעמדת עליו
   * אף פעם לא היה באמת לבד וחד, חוץ מהאחרון שנשאר על distance 0 בסוף
   * המסע.
   *
   * עכשיו יש רמה: עד 0.45 ספאן השלב חד ואטום לגמרי, ורק בין 0.45
   * ל-0.56 הוא מוסר את התור. המספרים לא נבחרו בעין - סרקתי את המסע
   * ומדדתי: שלב חד לגמרי נמצא על המסך 91% מהגלילה, שני שלבים נראים
   * יחד רק 11% מהזמן, ואף פעם אין מסך ריק. חלון מסירה צר יותר (0.07)
   * העלה את המספר ל-97% אבל כבר נקרא כמו חיתוך ולא כמו מעבר.
   */
  const opacity = useTransform(distance, [-0.56, -0.45, 0.45, 0.56], [0, 1, 1, 0]);
  const y = useTransform(distance, [-1, 0, 1], lean ? [96, 0, -96] : [140, 0, -140]);
  const scale = useTransform(distance, [-1, 0, 1], lean ? [0.88, 1, 0.88] : [0.82, 1, 0.82]);
  /*
   * בנייד יורדים ה-blur וה-z, ורק הם.
   *
   * blur הוא המאפיין היקר כאן: הוא מכריח רסטור מחדש של השכבה בכל פריים,
   * וכאן זה קורה על שבעה שלבים בו-זמנית בתוך מרחב preserve-3d. opacity,
   * translate ו-scale לעומת זאת נשארים אצל הקומפוזיטור וכמעט לא עולים.
   * התוצאה נראית כמעט זהה, כי במסך קטן העומק נקרא ממילא דרך הגודל
   * והשקיפות ולא דרך הטשטוש.
   *
   * חשוב: הכיבוי נעשה בתוך הערך ולא בהשמטת המפתח מ-style.
   *
   * כשמפסיקים להעביר מאפיין, framer-motion לא מאפס אותו בחזרה - הוא
   * פשוט מפסיק לעדכן אותו, וה-DOM נשאר עם הערך האחרון שנכתב. בגלל זה
   * שלבים שנתפסו באמצע מעבר כשהמצב התחלף נשארו תקועים על blur(8px)
   * בשקיפות מלאה, כלומר בדיוק "הכול מטושטש". עכשיו המפתחות קבועים
   * ורק הערך משתנה, ואין ערך יתום שאף אחד לא מנקה.
   */
  const z = useTransform(distance, [-1, 0, 1], lean ? [0, 0, 0] : [-320, 0, -320]);
  /*
   * הטשטוש נצמד לאותה רמה: חד לגמרי בטווח של השלב, ונכנס רק ביציאה.
   *
   * הרמפה נגמרת ב-0.62 ולא ב-0.8 בכוונה. השקיפות מתאפסת כבר ב-0.56,
   * ולכן רמפה ארוכה יותר הגיעה ל-1.8px בלבד כל עוד השלב עוד נראה -
   * כלומר הוא פשוט נעלם בלי להיטשטש, וזה לא מה שאמור להיקרא. עכשיו
   * הוא מגיע לכ-5px בזמן שהוא עוד על המסך, והיציאה נקראת כטשטוש.
   */
  const blurPx = useTransform(distance, [-0.62, -0.45, 0.45, 0.62], [8, 0, 0, 8]);
  const filter = useTransform(blurPx, (b) => (lean ? "none" : `blur(${b}px)`));

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

      <h3 className="mt-4 max-w-2xl font-display text-[clamp(1.6rem,5vw,3.4rem)] font-bold leading-[1.12] tracking-tightest text-bone sm:mt-6">
        {step.title}
      </h3>

      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-bone/55 sm:mt-5 sm:text-lg">
        {step.text}
      </p>
    </motion.div>
  );
};

const MethodJourney = () => {
  /*
   * מסך מגע מקבל את המסע, לא את הרשימה.
   *
   * קודם נייד נפל לרשימה הסטטית משתי סיבות אמיתיות: הגרסה המונפשת הריצה
   * filter: blur על שבעה שלבים בתוך preserve-3d בכל פריים של גלילה, והבמה
   * בגובה קבוע חתכה טקסט עברי ארוך. שתיהן נפתרו במקום להשבית את הסקשן -
   * ה-blur וה-z יורדים בנייד (ראו ההערה ב-Step), הטיפוגרפיה והמרווחים
   * קטנים כדי להיכנס לבמה, והמסע קוצר מ-494vh ל-382vh.
   *
   * רשימה סטטית נשארת רק למי שביקש תנועה מופחתת, ששם היא הדבר הנכון.
   */
  const coarse = useMediaQuery("(pointer: coarse)");
  const reduced = Boolean(useReducedMotion());
  const lean = coarse;
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  /*
   * חייב לשבת מעל ה-return המוקדם.
   *
   * קודם ה-useTransform הזה נקרא בתוך ה-JSX של הענף המונפש, כלומר אחרי
   * ה-return. כשהתנאי מתהפך בין רינדורים React מקבל מספר הוקים שונה
   * וזורק "Rendered fewer hooks than expected", והעמוד כולו קורס.
   */
  const glowScale = useTransform(progress, [0, 0.5, 1], [0.75, 1.15, 0.75]);

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
      style={{ height: `${STEPS.length * (lean ? STAGE_VH_LEAN : STAGE_VH) + 60}vh` }}
      aria-label="איך אנחנו מלמדים"
    >
      {/* הבמה הדביקה: התוכן נשאר במסך בזמן שהגלילה מזיזה את השלבים */}
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-15" aria-hidden />

        {/*
          * זוהר ורוד מאחורי השלב הפעיל.
          *
          * בנייד הוא לא נושם: הנשימה היא scale על שכבה מטושטשת, כלומר
          * רסטור מחדש של עיגול 560px בכל פריים - בדיוק סוג העבודה שבגללה
          * הסקשן הזה הושבת בטלפון מלכתחילה. סטטי הוא נראה כמעט אותו דבר.
          */}
        <motion.div
          className="pointer-events-none absolute h-[380px] w-[380px] rounded-full blur-3xl sm:h-[560px] sm:w-[560px]"
          style={{
            background: "radial-gradient(circle, rgba(255,95,158,0.13) 0%, rgba(255,95,158,0) 70%)",
            ...(lean ? {} : { scale: glowScale }),
          }}
          aria-hidden
        />

        <div className="container-site relative">
          <div className="mb-8 text-center sm:mb-16">
            <span className="section-label inline-flex text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              איך אנחנו מלמדים
            </span>
            <h2 className="display-2 mt-4 text-bone sm:mt-5">
              שבעה צעדים, <AccentWord>מהבעיה לשיטה</AccentWord>
            </h2>
          </div>

          {/* מרחב תלת-ממדי שבו השלבים נעים לעומק */}
          <div
            className="relative h-[300px] sm:h-[340px]"
            style={{ perspective: "1100px", transformStyle: "preserve-3d" }}
          >
            {STEPS.map((step, i) => (
              <Step key={step.title} step={step} index={i} progress={progress} lean={lean} />
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
