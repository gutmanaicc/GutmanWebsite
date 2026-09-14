import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import ImageLightbox from "../components/ImageLightbox";
import InstructorBioModal, { type InstructorBio } from "../components/InstructorBioModal";
import Pressable from "../components/Pressable";
import RegisterForm from "../components/RegisterForm";
import ReviewsRatingBadge from "../components/ReviewsRatingBadge";
import StudentWorksCarousel from "../components/StudentWorksCarousel";
import FashionStillsShowcase from "../components/FashionStillsShowcase";
import VideoTestimonialStrip from "../components/VideoTestimonialStrip";
import HeroScrollCue from "../components/landing/HeroScrollCue";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import PainBento from "../components/landing/PainBento";
import ShiftList from "../components/landing/ShiftList";
import SolutionStepper from "../components/landing/SolutionStepper";
import { CountUp, KineticHeading, Reveal, ScrollScrub } from "../components/motion";
import { useMotionCapability } from "../lib/motion";
import { ArrowIcon, CheckIcon } from "../components/icons";
import { FASHION_LP } from "../data/fashionLanding";
import { getInstructor, getInstructorsForCourse } from "../data/instructorsData";
import { FASHION_STILLS } from "../data/fashionWorks";
import { getStudentWorksForCourse } from "../data/studentWorksData";
import { getVideoTestimonialsForCourse } from "../data/videoTestimonialsData";
import { getTestimonialsForCourse, type Testimonial } from "../data/testimonialsData";
import { REGISTRATION_FORM_ID, scrollToRegistrationForm } from "../lib/registration";
import { popupJustClosed } from "../lib/scrollLock";
import { trackStandard } from "../pixel";
import { faqSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";

/**
 * דף נחיתה לקמפיין הממומן של סדנת האופנה.
 *
 * למה עמוד נפרד ולא שינוי של /courses/ai-fashion:
 *
 * 1. עמוד המסלול משרת גם תנועה אורגנית, שכבר מכירה את האקדמיה והגיעה
 *    לבדוק מוצר ספציפי. הקהל של הקמפיין הפוך בדיוק - הוא לא מכיר את
 *    רון ולא חיפש סדנת AI. אותו עמוד לא יכול לפתוח בשתי נקודות פתיחה.
 * 2. סדר הסקשנים כאן נקבע מול כאוס מדיה ואינו סדר עמוד המוצר. ב-
 *    CourseDetail הסדר קבוע לכל המסלולים, ושינוי שלו היה מזיז גם את
 *    ארבעת המסלולים האחרים.
 * 3. הקמפיין רץ לעמוד הקיים מ-03.09 ואין להפיל אותו באמצע. שני עמודים
 *    חיים במקביל מאפשרים להשוות ביצועים ואז להעביר תנועה.
 *
 * ה-leadSource נפרד (lp-ai-fashion) בדיוק כדי שההשוואה הזאת תהיה
 * אפשרית ב-CRM ולא רק ב-Meta.
 *
 * הכותרות והסקשנים נקראים מ-src/data/fashionLanding.ts. אין כאן טקסט
 * שיווקי מוטמע, כדי שאפשר יהיה לתקן קופי בלי לגעת בקומפוננטה.
 */

/*
 * הטופס נושא את המזהה הקנוני של האתר ולא מזהה מקומי.
 *
 * קודם הוא היה id="lp-form", ולכן getRegistrationSection לא מצא אותו:
 * כפתור "השאירו פרטים" שבהדר בדק אם יש טופס בעמוד, קיבל תשובה שלילית,
 * וניווט ל-/register. כלומר הכפתור הבולט ביותר בעמוד היה גם פתח
 * המילוט הכי גדול ממנו, ובדרך הליד היה נרשם תחת מקור אחר.
 */
const scrollToForm = () => scrollToRegistrationForm({ focus: false });

/**
 * טווח מספרי בתוך ערך סטטיסטי, אם יש כזה.
 *
 * רק אחד משלושת המספרים בסקשן השוק הוא באמת מספר ("20-50"); השניים
 * האחרים הם מילים ("שבועות", "ימים ספורים"). במקום להוסיף שדה לדאטה
 * שיהיה ריק בשני שלישים מהמקרים, הזיהוי נעשה כאן: זו החלטת תצוגה,
 * לא עובדה על התוכן.
 */
const parseRange = (value: string): [number, number] | null => {
  const match = /^(\d+)-(\d+)$/.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

/*
 * גוף הנחש של רצועת התהליך בנייד, בקואורדינטות ה-viewBox (0..100).
 *
 * הקו בנוי כרצף של חמישה מקטעים ישרים אנכיים בקצה (x=94 מימין, x=6
 * משמאל, בדיוק מרכז הסמן) ובין כל שניים עקומת C אחת. הכלל שמונע
 * חציית מלל: המקטע הישר מכסה את גובה הסמן, והעקומה יוצאת ממנו צמודה
 * לקצה (x~90 בזון של הכיתוב) ומתרחקת למרכז רק אחרי שהיא מתחת לשורה
 * האחרונה של ה-hint. הכיתוב עצמו מוזח 16% פנימה מהקצה, כך שנשאר מרווח.
 *
 * הבקרה הראשונה של כל C יושבת על אותו x כמו הקצה שממנו יוצאים
 * והאחרונה על אותו x כמו הקצה שאליו נכנסים, ולכן המשיק בכל חיבור
 * בין קטע ישר לעקומה אנכי: אין "ברך", הנחש זורם כקו אחד. הבקרה
 * הראשונה רחוקה יותר מהקצה כדי שהקו "ידבק" לו רגע לפני שהוא נשטח.
 * המקטע האחרון נעצר ב-y=91, מרכז סמן 05 בדיוק - אין זנב מעברו.
 */
const SNAKE_PATH =
  "M94 2 V8.5 C94 17.5 6 17.5 6 21.5 V30 C6 39 94 39 94 43 V51.5 C94 60.5 6 60.5 6 64.5 V73 C6 82 94 82 94 86 V91";

const FashionLanding = () => {
  /*
   * גם עם prefers-reduced-motion כבוי, בנייד ה-level הוא "css3d" ולא
   * "full". להירו הזה יש רק תנועת כניסה, לא WebGL, אבל ההקלטות ב-Clarity
   * הראו נחיתות מ-IG שהסתיימו לפני שההירו נצבע: motion.div שמתחיל
   * ב-opacity:0 מוסיף פריים שלם של המתנה ל-Framer על מכשיר שכבר איטי.
   * heroAnimated מגביל את הכניסה המונפשת ואת הילות הרקע ל-full בלבד
   * (מצביע עדין, בלי חיסכון בנתונים), ובכל מכשיר אחר ההירו נצבע גלוי
   * מהפריים הראשון.
   */
  const motionLevel = useMotionCapability();
  const heroAnimated = motionLevel === "full";
  /*
   * משיכת הקו של הנחש בנייד. css3d עדיין מקבל אותה (מצביע גס אינו בקשה
   * לעצור תנועה, בדיוק כמו ב-useStillMotion), רק static ו-
   * prefers-reduced-motion מכבים. כשהיא כבויה המחלקות לא נוספות בכלל
   * וה-CSS מצייר את הקו במצבו הסופי.
   */
  const prefersReducedMotion = useReducedMotion();
  const snakeDraws = motionLevel !== "static" && prefersReducedMotion !== true;
  /*
   * אורך הקו על המסך, לחישוב stroke-dasharray/dashoffset של המשיכה.
   *
   * למה זה לא קבוע: vector-effect="non-scaling-stroke" מוציא את ה-dash
   * ממרחב ה-viewBox ומציב אותו במרחב המסך, כדי שעובי הקו לא ימתח יחד
   * עם preserveAspectRatio="none". זה אומר שאורך המשיכה תלוי בגודל
   * המיכל בפועל בפיקסלים - שמשתנה גם ברוחב מסך (20rem מקסימום, אבל
   * container-site יכול לצמצם אותו) וגם בכל שינוי ל-font-size של ה-root
   * (34rem מתורגם לפיקסלים אחרים). קבוע קשיח (1400, שכוון פעם אחת לגודל
   * ישן) נשבר בשקט בכל שינוי כזה: המשיכה מסתיימת עם offset:0 לפני שהיא
   * מכסה את כל אורך הקו החדש, והתוצאה קו שנעצר ממש לפני 05 בלי שגיאה
   * בשום מקום. המדידה כאן דוגמת נקודות אמיתיות מה-path ומתרגמת אותן
   * לפיקסלים לפי הגודל הנוכחי של ה-svg, כך שהיא נכונה בכל רוחב מסך
   * ובכל font-size, כולל שינוי עתידי.
   */
  const snakePathRef = useRef<SVGPathElement>(null);
  const snakeSvgRef = useRef<SVGSVGElement>(null);
  const [snakeDashLength, setSnakeDashLength] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const path = snakePathRef.current;
      const svg = snakeSvgRef.current;
      if (!path || !svg) return;
      const svgRect = svg.getBoundingClientRect();
      if (!svgRect.width || !svgRect.height) return;
      const scaleX = svgRect.width / 100;
      const scaleY = svgRect.height / 100;
      const totalLength = path.getTotalLength();
      const SAMPLES = 200;
      let onScreenLength = 0;
      let prev: { x: number; y: number } | null = null;
      for (let i = 0; i <= SAMPLES; i += 1) {
        const point = path.getPointAtLength((totalLength * i) / SAMPLES);
        const current = { x: point.x * scaleX, y: point.y * scaleY };
        if (prev) onScreenLength += Math.hypot(current.x - prev.x, current.y - prev.y);
        prev = current;
      }
      /* מרווח קטן קבוע כדי שהמשיכה תמיד תשלים עד הסוף גם עם עיגול פיקסלים */
      setSnakeDashLength(Math.ceil(onScreenLength) + 4);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const snakeDashStyle = snakeDashLength
    ? ({ "--snake-len": snakeDashLength } as React.CSSProperties)
    : undefined;
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);
  const [instructorBio, setInstructorBio] = useState<InstructorBio>(null);
  /* נפרד מ-lightbox של ההמלצות: שם המקור הוא Testimonial ולא נתיב תמונה */
  const testimonials = getTestimonialsForCourse(FASHION_LP.courseSlug, 3);
  const instructors = getInstructorsForCourse(FASHION_LP.courseSlug);
  /*
   * רון נשלף לפי מזהה ולא דרך getInstructorsForCourse.
   *
   * המיפוי של ai-fashion מצביע על הדר בלבד, וזה נכון: היא המנחה של
   * הסדנה. הוספת רון למיפוי הייתה מציגה אותו גם בעמוד המסלול ובכל
   * מקום אחר שנגזר מאותו מקור, ומשנה עמודים שלא ביקשנו לשנות.
   */
  const founder = getInstructor(FASHION_LP.founder.instructorId);
  /*
   * דרך אותו מנגנון שכל שאר עמודי המסלול משתמשים בו, ולא רשימה נפרדת.
   * כך /courses/ai-fashion מציג בדיוק את אותם תוצרים אוטומטית, בלי
   * שני מקורות דאטה שצריך לזכור לעדכן ביחד.
   */
  const works = getStudentWorksForCourse(FASHION_LP.courseSlug);
  /*
   * עדויות וידאו של משתתפות. ריק עד שמוסיפים קבצים ל-videoTestimonialsData,
   * ואז VideoTestimonialStrip מציג רצועה בתוך סקשן ההוכחה, מעל עדויות הטקסט.
   */
  const videoTestimonials = getVideoTestimonialsForCourse(FASHION_LP.courseSlug);
  /*
   * רון והדר כרשימה אחת, לשני העיגולים בסקשן ההוכחה.
   *
   * רון מגיע מ-getInstructor (מסגרת מוסדית, roleLabel מקוצר), הדר מ-
   * getInstructorsForCourse (המנחה של הסדנה, ה-role המלא שלה). המיזוג
   * כאן ולא בדאטה כי שני המקורות שונים בכוונה - ראו ההערות שליד כל אחד.
   */
  const proofPeople = [
    ...(founder
      ? [{ person: founder, role: FASHION_LP.founder.roleLabel, bio: founder.trackBios.general ?? founder.bio }]
      : []),
    ...instructors.map(({ instructor, bio }) => ({ person: instructor, role: instructor.role, bio })),
  ];

  useSeo({
    title: FASHION_LP.seo.title,
    description: FASHION_LP.seo.description,
    path: FASHION_LP.path,
    schema: [faqSchema(FASHION_LP.faq.map((f) => ({ question: f.q, answer: f.a })))],
  });

  useReveal([FASHION_LP.path]);

  useEffect(() => {
    trackStandard("ViewContent", {
      content_type: "product",
      content_ids: [FASHION_LP.leadSource],
      content_name: FASHION_LP.seo.title,
      content_category: "קריאייטיב ואופנה",
    });
  }, []);

  return (
    <div className="course-detail-page">
      {/*
        פס ההתקדמות קיים כאן ולא במעטפת הגלובלית.
        הוא נועד לדף ארוך שאין ממנו יציאה, שבו השאלה "כמה עוד" היא הסיבה
        הנפוצה לנטישה באמצע. בשאר האתר יש ניווט שעונה על אותה שאלה.
      */}
      <ScrollProgressBar />

      {/* ── הירו: הכאב הרביעי, לא שם המוצר ─────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-50" aria-hidden />
        {/*
          שתי ההילות נעות בקצב שונה מהתוכן ובכיוונים מנוגדים.
          זה מה שנותן להירו עומק בלי להוסיף תמונה: העין קוראת שתי שכבות
          שזזות בקצב שונה כמרחק, וזה עובד גם כשאין שום נכס ויזואלי בעמוד.
          ScrollScrub חושף רק ציר אנכי, ולכן אין סיכון לגלילה אופקית.

          מוצגות רק כש-heroAnimated: blur-3xl על שתי הילות שמונעות מ-scroll
          listener + spring הוא עלות ריצה אמיתית, ובדיוק בשניות שההירו צריך
          להצטייר בהן על מכשיר איטי אין לזה מקום. .grid-canvas מעליהן נשאר
          תמיד כי הוא גרדיאנט CSS סטטי בלי שום עלות JS.
        */}
        {heroAnimated && (
          <>
            <ScrollScrub
              className="pointer-events-none absolute -left-20 top-6 h-40 w-40"
              y={[-40, 70]}
              scale={[0.9, 1.15]}
            >
              <div className="h-full w-full rounded-full bg-[#FF2D85]/12 blur-3xl" aria-hidden />
            </ScrollScrub>
            <ScrollScrub
              className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56"
              y={[60, -50]}
            >
              <div className="h-full w-full rounded-full bg-[#FF2D85]/[0.07] blur-3xl" aria-hidden />
            </ScrollScrub>
          </>
        )}

        <div className="container-site relative py-12 sm:py-16 lg:py-20">
          <motion.div
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
            initial={heroAnimated ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="stat-pill mb-3 inline-flex border-[#FF2D85]/25 bg-[#FF2D85]/5 text-[#FF2D85]">
              {FASHION_LP.hero.kicker}
            </span>

            {/*
              הכותרת נחשפת מילה אחרי מילה. זה הרגע הראשון שהגולשת רואה
              בעמוד, והיא הגיעה ממודעה בלי להכיר את האקדמיה: חשיפה
              הדרגתית מכריחה לקרוא את המשפט במקום לסרוק אותו.

              breakBeforeAccent שומר על הקומפוזיציה בשתי שורות. השבירה
              מכוונת: הכאב בשורה אחת, ההבטחה מתחתיה. accentClassName
              מקבל בדיוק את המחלקה של AccentWord, שהיא סגנון גופן וצבע
              ולכן עובדת גם כשהיא חלה על כל מילה בנפרד.
            */}
            <KineticHeading
              as="h1"
              className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl"
              text={FASHION_LP.hero.title}
              accent={FASHION_LP.hero.titleAccent}
              accentClassName="accent-serif not-italic"
              breakBeforeAccent
              eager
            />

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {FASHION_LP.hero.sub}
            </p>

            <p className="mt-4 text-sm font-medium text-muted">{FASHION_LP.hero.scheduleNote}</p>

            <div className="mt-6">
              <Pressable
                type="button"
                className="btn cursor-pointer bg-[#FF2D85] text-white shadow-pill hover:brightness-105"
                rippleTone="pink"
                onClick={scrollToForm}
              >
                {FASHION_LP.hero.cta}
                <ArrowIcon />
              </Pressable>
            </div>
          </motion.div>

          {/*
            רצועת התהליך, שתי פריסות נפרדות:

            נייד - "נחש" מקצה לקצה: כל צומת על צד אחר של המסך, מחוברים
            בקו S רציף אחד שמתפתל למטה. המספר יושב על הקו בקצה, והכיתוב
            לצידו לכיוון המרכז. ה-flex-wrap הקודם נשבר ל-3+2 מכוער; כאן
            המסלול עצמו מצייר את הרצף.

            המיכל ב-dir="ltr" כדי שקואורדינטות ה-SVG, ה-left/right של
            הסמנים וכיוון ה-S יסתדרו יחד; כל כיתוב חוזר ל-rtl בנפרד.

            דסקטופ (sm ומעלה) - שרשרת אופקית של צ'יפים עם חצים, כמו קודם.
          */}
          <motion.div
            className="mt-8 sm:mt-9"
            initial={heroAnimated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {/* ── נייד: נחש מקצה לקצה ── */}
            <div dir="ltr" className="relative mx-auto h-[34rem] w-full max-w-[20rem] sm:hidden">
              {/*
                גוף הנחש (ה-d ב-SNAKE_PATH). הקו צמוד לקצה (x=94 או x=6,
                מרכז הסמן) דרך כל הזון של הכיתוב, ומתפתל למרכז רק בפער
                האנכי שאין בו טקסט. כך הקו לעולם לא חוצה מלל.
                preserveAspectRatio="none" מותח את ה-viewBox לגובה המיכל,
                non-scaling-stroke שומר עובי קו אחיד. בגלל אותה תכונה
                אורך המשיכה (stroke-dasharray/dashoffset) נמדד במרחב המסך
                ולא ב-viewBox, ו-pathLength לא נורמל נכון תחת מתיחה
                לא-אחידה בכרום - לכן snakeDashStyle מודד אותו בפועל
                (ראו ההערה ליד snakeDashLength למעלה) ומזריק אותו כמשתנה
                CSS, במקום מספר קבוע שנשבר בשקט בכל שינוי גודל.

                שני path על אותו d: התחתון מטושטש ומשמש הילה שנותנת לוורוד
                נפח בלי לעבות את הקו החד שמעליו.
              */}
              <svg
                ref={snakeSvgRef}
                className="pointer-events-none absolute inset-0 h-full w-full text-[#FF2D85]/60"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className={snakeDraws ? "fashion-snake-glow" : undefined}
                  d={SNAKE_PATH}
                  fill="none"
                  stroke="#FF2D85"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.45}
                  style={{ filter: "blur(3px)" }}
                />
                <path
                  ref={snakePathRef}
                  className={snakeDraws ? "fashion-snake-line" : undefined}
                  d={SNAKE_PATH}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={snakeDashStyle}
                />
              </svg>

              <ol aria-label="התהליך בסדנה">
                {FASHION_LP.pipeline.map((node, i) => {
                  const last = i === FASHION_LP.pipeline.length - 1;
                  const right = i % 2 === 0; // 0,2,4 בצד ימין
                  /* top לכל צומת = תחילת המקטע הישר-בקצה בנתיב */
                  const top = [2, 23.5, 45, 66.5, 88][i];
                  return (
                    <li
                      key={node.label}
                      className="absolute inset-x-0"
                      style={{ top: `${top}%` }}
                    >
                      <Reveal variant="scale" delay={i * 0.07} amount={0.5}>
                        <div className="relative">
                          {/*
                            הסמן על הקו, בקצה. ה-box-shadow הכפול: טבעת
                            אטומה בצבע הקנבס חותכת מרווח נקי בין הקו לעיגול
                            ("חרוז על חוט"), ומתחתיה נגיעת ורוד רכה לעומק.
                            צומת 05 מלא וזוהר כי הוא היעד, לא עוד שלב.
                          */}
                          <span
                            className={`absolute top-0 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums leading-none tracking-[0.02em] ${
                              right ? "right-[1%]" : "left-[1%]"
                            } ${
                              last
                                ? "border-[#FF2D85] bg-[#FF2D85] text-white shadow-[0_0_0_5px_#0d0c11,0_0_22px_rgba(255,45,133,0.55)]"
                                : "border-[#FF2D85]/70 bg-canvas text-[#FF2D85] shadow-[0_0_0_5px_#0d0c11,0_2px_12px_-4px_rgba(255,45,133,0.45)]"
                            }`}
                            aria-hidden
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>

                          {/* הכיתוב לצד הסמן, לכיוון המרכז. pt-[3px] כדי
                              שהשורה הראשונה תתיישר אופטית עם מרכז הסמן */}
                          <div
                            dir="rtl"
                            className={`absolute top-0 pt-[3px] ${
                              right
                                ? "right-[16%] left-[6%] text-right"
                                : "left-[16%] right-[6%] text-left"
                            }`}
                          >
                            <span
                              className={`block text-[15px] font-semibold leading-snug ${
                                last ? "text-[#FF2D85]" : "text-bone"
                              }`}
                            >
                              {node.label}
                            </span>
                            <span className="mt-1 block text-[11.5px] font-medium leading-snug text-bone/55">
                              {node.hint}
                            </span>
                          </div>
                        </div>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/*
              ── דסקטופ: שרשרת אופקית ──
              צ'יפים גדולים יותר מקודם (היה px-3 py-2, טקסט 13px/10px),
              אבל בלי max-w שמכריח שבירה: ברוחב הישן ה-ol היה מוגבל
              ל-max-w-2xl ואז ל-max-w-3xl, וזה בדיוק מה ששבר - חמישה
              צ'יפים גדולים יותר כבר לא נכנסו לרוחב המוגבל, ו-flex-wrap
              (שנשאר כרשת ביטחון) הפיל את "וידאו" לשורה שנייה במרכז.
              max-w-4xl נותן מספיק רוחב, ו-lg:flex-nowrap מבטיח שורה אחת
              מ-1024px ומעלה בלי לגעת ב-sm/md הצרים יותר, ששם flex-wrap
              עדיין מגן מפני גלילה אופקית. ההגדלה עצמה במרווחים (px, מרווח
              בין צ'יפים) ולא בגודל הפונט - כך הרוחב הכולל צפוי וניתן
              לחישוב, במקום להמר על רוחב טקסט עברי בגופן גדול יותר.
              בלי לגעת בנחש הנייד - שתי הפריסות בלתי תלויות (sm:hidden
              מול sm:flex) ולא חולקות שום מידה.
            */}
            <ol
              className="mx-auto hidden max-w-4xl flex-row flex-wrap items-stretch justify-center gap-y-4 sm:flex lg:flex-nowrap"
              aria-label="התהליך בסדנה"
            >
              {FASHION_LP.pipeline.map((node, i) => {
                const last = i === FASHION_LP.pipeline.length - 1;
                return (
                  <li key={node.label} className="flex items-center">
                    <Reveal variant="scale" delay={i * 0.07} amount={0.4}>
                      <div
                        className={`rounded-2xl border px-6 py-4 text-center transition-colors ${
                          last
                            ? "border-[#FF2D85]/40 bg-[#FF2D85]/10"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <span
                          className={`block whitespace-nowrap text-[15px] font-semibold leading-none ${
                            last ? "text-[#FF2D85]" : "text-bone/85"
                          }`}
                        >
                          {node.label}
                        </span>
                        <span className="mt-2 block whitespace-nowrap text-xs leading-none text-bone/40">
                          {node.hint}
                        </span>
                      </div>
                    </Reveal>
                    {!last && (
                      /* ArrowIcon מצביע שמאלה = "קדימה" ב-RTL */
                      <span className="mx-4 text-bone/25 lg:mx-6" aria-hidden>
                        <ArrowIcon size={20} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </motion.div>

          {/*
            בזרימה ולא absolute bottom: ההירו הזה אינו במסך מלא, ורמז
            שממוקם לתחתיתו היה נוחת על הסקשן שמתחת במקום לסגור את ההירו.
          */}
          <HeroScrollCue className="mt-10 sm:mt-12" />
        </div>
      </section>

      {/* ── 1. מה קורה היום בשוק ──────────────────────────────── */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              kicker={FASHION_LP.market.kicker}
              title={
                <>
                  {FASHION_LP.market.title} <AccentWord>{FASHION_LP.market.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.market.sub}
            />
          </Reveal>

          {/*
            שלושת המספרים הם למעשה שתי טענות: כמה זה עולה היום, וכמה זמן
            זה לוקח לפני ואחרי. הכרטיס השלישי הוא ה"אחרי", וכשהשלושה
            נראו זהים הוא נבלע ביניהם במקום לסגור את הטיעון.
          */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FASHION_LP.market.stats.map((stat, i) => {
              const isAfter = i === FASHION_LP.market.stats.length - 1;
              const range = parseRange(stat.value);
              return (
                <Reveal key={stat.label} variant="scale" delay={i * 0.1}>
                  <div
                    className={`group relative h-full overflow-hidden rounded-2xl border p-5 text-center shadow-card transition-[border-color,transform] duration-300 hover:-translate-y-1 ${
                      isAfter
                        ? "border-[#FF2D85]/40 bg-[#FF2D85]/[0.07]"
                        : "border-white/10 bg-surface-1 hover:border-white/25"
                    }`}
                  >
                    {/* זוהר עדין שנדלק בהובר, רק על הכרטיס שמרחפים מעליו */}
                    <span
                      className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#FF2D85]/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                      aria-hidden
                    />
                    <p
                      className={`relative font-display text-2xl font-bold tracking-tight sm:text-3xl ${
                        isAfter ? "text-[#FF2D85]" : "text-bone"
                      }`}
                    >
                      {/*
                        המספר נספר כלפי מעלה, המילים לא. ספירה על "שבועות"
                        היא סתם רעש; על עלות של עשרות אלפי שקלים היא הדבר
                        שגורם לגולשת לעצור ולקרוא את השורה שמתחת.
                      */}
                      {range ? (
                        <span dir="ltr">
                          <CountUp to={range[0]} duration={1.1} />-
                          <CountUp to={range[1]} duration={1.5} />
                        </span>
                      ) : (
                        <span dir="ltr">{stat.value}</span>
                      )}
                      {stat.unit && <span> {stat.unit}</span>}
                    </p>
                    <p className="relative mt-2 text-sm leading-relaxed text-bone/60">
                      {stat.label}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. הכאב. בנטו אייקונים, האריח הראשון הוא הדיפרנציאטור ─ */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              kicker={FASHION_LP.pain.kicker}
              title={
                <>
                  {FASHION_LP.pain.title} <AccentWord>{FASHION_LP.pain.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.pain.sub}
            />
          </Reveal>

          <PainBento cards={FASHION_LP.pain.cards} />
        </div>
      </section>

      {/* ── 3. מה השתנה ────────────────────────────────────────── */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              kicker={FASHION_LP.shift.kicker}
              title={
                <>
                  {FASHION_LP.shift.title} <AccentWord>{FASHION_LP.shift.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.shift.sub}
            />
          </Reveal>

          <ShiftList
            rows={FASHION_LP.shift.rows}
            beforeLabel={FASHION_LP.shift.beforeLabel}
            afterLabel={FASHION_LP.shift.afterLabel}
          />
        </div>
      </section>

      {/* ── 4. הפתרון: סטפר אינטראקטיבי + רשת תוצרים ──────────── */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              kicker={FASHION_LP.solution.kicker}
              title={
                <>
                  {FASHION_LP.solution.title}{" "}
                  <AccentWord>{FASHION_LP.solution.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.solution.sub}
            />
          </Reveal>

          <SolutionStepper
            steps={FASHION_LP.solution.steps}
            outcomes={FASHION_LP.solution.outcomes}
            outcomesTitle="עם מה יוצאים"
          />
        </div>
      </section>

      {/* ── 5א. תוצרים בתנועה, לפני ההוכחה בטקסט ───────────────── */}
      {works.length > 0 && (
        <StudentWorksCarousel
          works={works}
          kicker={FASHION_LP.works.kicker}
          title={
            <>
              {FASHION_LP.works.title} <AccentWord>{FASHION_LP.works.titleAccent}</AccentWord>
            </>
          }
          sub={FASHION_LP.works.sub}
          note={FASHION_LP.works.note}
          ctaLabel={FASHION_LP.works.cta}
          /*
           * ה-CTA גולל לטופס של הדף ולא פותח את מודאל ההרשמה הגלובלי.
           * המודאל היה רושם את הליד תחת leadSource משלו ושובר את
           * ההשוואה בין דף הנחיתה לעמוד המסלול, וגם מוציא את הגולשת
           * מזרימת העמוד לחלון שקופץ.
           */
          onCta={scrollToForm}
          /* הבקשה יורדת מכאן ומגיעה אחרי סדרת התמונות, כדי לא לקטוע
             את רצף ההוכחה באמצע */
          hideCta
          /* כותרת סקשן גדולה כמו כל שאר הסקשנים בדף הנחיתה */
          compactHeader={false}
        />
      )}

      {/*
        ── 5ב. הסדרה: אותה דמות בשלושה שוטים ──────────────────────
        רכיב משותף עם /courses/ai-fashion (FashionStillsShowcase),
        כדי ששני העמודים יציגו בדיוק את אותה רשת תמונות בלי שני
        עותקים שיכולים להיסחף זה מזה. note/ctaLabel/onCta כאן הם
        אותה בקשה משותפת שהייתה קודם אחרי הסרטונים והתמונות גם יחד -
        לא מבוקשת התחייבות, רק לגלול לטופס של הדף.
      */}
      <FashionStillsShowcase
        stills={FASHION_STILLS}
        title={FASHION_LP.stills.title}
        sub={FASHION_LP.stills.sub}
        note={FASHION_LP.works.note}
        ctaLabel={FASHION_LP.works.cta}
        onCta={scrollToForm}
        compactHeader={false}
      />

      {/* ── 5. הוכחה ───────────────────────────────────────────── */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              kicker={FASHION_LP.proof.kicker}
              title={
                <>
                  {FASHION_LP.proof.title} <AccentWord>{FASHION_LP.proof.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.proof.sub}
            />
          </Reveal>

          {/*
            linked={false} בכוונה: זה עמוד סגור, והבאדג' היה פתח המילוט
            היחיד ששרד בגוף העמוד אחרי שהניווט ירד מההדר ומהפוטר.
            המספר עושה את עבודת ההוכחה גם בלי לחיצה.
          */}
          <Reveal className="mt-6 flex justify-center">
            <ReviewsRatingBadge linked={false} />
          </Reveal>

          {/*
            שני האנשים כשני עיגולים ולא כשני מלבני טקסט.
            פורטרט + שם + תפקיד + "קראו עוד" עונים על "מי אלה" בלי פסקה;
            הביו המלא, שכולל את שיטת הלימוד של רון ואת הקרדיטים של הדר,
            נפתח בפופאפ. אותו InstructorBioModal לשניהם.
          */}
          {proofPeople.length > 0 && (
            <Reveal
              className="mx-auto mt-8 flex max-w-md flex-wrap items-start justify-center gap-x-10 gap-y-8 sm:gap-x-16"
              variant="blur"
            >
              {proofPeople.map(({ person, role, bio }) => (
                <button
                  key={person.id}
                  type="button"
                  /* popupJustClosed חוסם פתיחה מחדש כשסגירת הפופאפ בלחיצה
                     בחוץ נוחתת על העיגול שמתחתיה */
                  onClick={() => !popupJustClosed() && setInstructorBio({ instructor: person, bio })}
                  className="group flex w-28 flex-col items-center text-center focus-visible:outline-none"
                >
                  <img
                    src={person.image}
                    alt={person.name}
                    loading="lazy"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-white/10 transition duration-200 group-hover:ring-[#FF2D85]/50 group-focus-visible:ring-[#FF2D85]/60 sm:h-24 sm:w-24"
                  />
                  <span className="mt-3 font-display text-sm font-bold tracking-tight text-bone">
                    {person.name}
                  </span>
                  <span className="mt-0.5 text-xs font-medium text-brand">{role}</span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-bone/55 transition-colors group-hover:text-bone/85">
                    {FASHION_LP.team.readMore}
                    <ArrowIcon size={11} />
                  </span>
                </button>
              ))}
            </Reveal>
          )}

          {/*
            עדויות וידאו מעל עדויות הטקסט: פנים ודיבור עושים את עבודת
            האמון מהר יותר מציטוט, ולכן הן קודמות. מוסתר כשאין קבצים.
          */}
          <VideoTestimonialStrip
            items={videoTestimonials}
            heading={FASHION_LP.proof.videos.heading}
            sub={FASHION_LP.proof.videos.sub}
          />

          {/*
            עדויות הטקסט ירדו לכרטיס ציטוט בלבד: המשפט המודגש + השם.
            הפסקה המלאה של ההודעה כבר קיימת בלייטבוקס שנפתח בהקשה, ועל
            פני הכרטיס היא הייתה עוד שלוש שורות טקסט אחרי רצועת הווידאו.
          */}
          {testimonials.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <Reveal key={item.id} variant="scale" delay={i * 0.08}>
                  <button
                    type="button"
                    /* popupJustClosed חוסם פתיחה מחדש כשסגירת הלייטבוקס
                       בלחיצה בחוץ נוחתת על הכרטיס שמתחתיה */
                    onClick={() => !popupJustClosed() && setLightbox(item)}
                    className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-surface-1 p-5 text-start shadow-card transition-colors duration-200 hover:border-[#FF2D85]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50"
                  >
                    <p className="flex-1 font-display text-lg font-bold leading-snug tracking-tight text-bone">
                      “{item.quote}”
                    </p>
                    {item.author && (
                      <span className="mt-4 text-xs font-medium text-bone/50">{item.author}</span>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-bone/55">
                      לצפייה בהודעה המקורית
                      <ArrowIcon size={12} />
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. טופס ────────────────────────────────────────────── */}
      <section id={REGISTRATION_FORM_ID} className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <div className="course-register-banner relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-15" aria-hidden>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to left, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                  }}
                />
              </div>

              <div className="relative grid gap-5 lg:grid-cols-[1fr_minmax(0,400px)] lg:items-center lg:gap-6">
                <div className="text-white">
                  <span className="mb-2 inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
                    {FASHION_LP.form.kicker}
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {FASHION_LP.form.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                    {FASHION_LP.form.sub}
                  </p>
                  <ul className="mt-3 grid gap-x-4 gap-y-2 text-sm text-white/85 sm:grid-cols-2">
                    {FASHION_LP.form.bullets.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-none text-white/70" aria-hidden>
                          <CheckIcon size={13} />
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative rounded-2xl border border-white/10 bg-surface-1 shadow-card backdrop-blur-xl">
                  <RegisterForm
                    preselectedCourse={FASHION_LP.courseSlug}
                    lockCourse
                    leadSource={FASHION_LP.leadSource}
                    title={FASHION_LP.form.leadFormTitle}
                    sub="נחזור אליכן עם המחזור הקרוב והפרטים."
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* התנגדויות. אחרי הטופס, כמו בעמוד המסלול - מי שכבר משוכנע לא צריך אותן */}
      <section className="cv-section py-10 sm:py-14">
        <div className="container-site max-w-3xl">
          <Reveal>
            <SectionHeader
              kicker="שאלות"
              title={
                <>
                  לפני ש<AccentWord>תשאירי פרטים</AccentWord>
                </>
              }
            />
          </Reveal>
          <Reveal className="mt-6">
            <FAQAccordion items={FASHION_LP.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </Reveal>

          <Reveal className="mt-8 flex justify-center">
            <Pressable
              type="button"
              className="btn cursor-pointer bg-[#FF2D85] text-white shadow-pill hover:brightness-105"
              rippleTone="pink"
              onClick={scrollToForm}
            >
              {FASHION_LP.hero.cta}
              <ArrowIcon />
            </Pressable>
          </Reveal>
        </div>
      </section>

      <InstructorBioModal value={instructorBio} onClose={() => setInstructorBio(null)} />

      <ImageLightbox
        src={lightbox?.image ?? null}
        alt={lightbox?.quote ?? ""}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};

export default FashionLanding;
