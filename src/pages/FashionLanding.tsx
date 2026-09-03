import { useEffect, useState } from "react";
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
import HeroScrollCue from "../components/landing/HeroScrollCue";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import { CountUp, KineticHeading, Reveal, ScrollLine, ScrollScrub } from "../components/motion";
import { ArrowIcon, CheckIcon } from "../components/icons";
import { FASHION_LP } from "../data/fashionLanding";
import { getInstructor, getInstructorsForCourse } from "../data/instructorsData";
import { FASHION_STILLS } from "../data/fashionWorks";
import { getStudentWorksForCourse } from "../data/studentWorksData";
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

const FashionLanding = () => {
  const reduced = useReducedMotion();
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
        */}
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

        <div className="container-site relative py-12 sm:py-16 lg:py-20">
          <motion.div
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
            initial={reduced ? false : { opacity: 0, y: 14 }}
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
            רצועת התהליך.
            flex-wrap ולא רשת בעלת חמש עמודות: חמישה צמתים ברוחב טלפון
            היו נדחסים או דוחפים גלילה אופקית, וזה אילוץ קשיח באתר.
            בעטיפה הם מסתדרים לשתי שורות ושומרים על אותו קצב קריאה.
          */}
          <motion.ol
            className="mx-auto mt-9 flex max-w-2xl flex-wrap items-stretch justify-center gap-y-3"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            aria-label="התהליך בסדנה"
          >
            {FASHION_LP.pipeline.map((node, i) => {
              const last = i === FASHION_LP.pipeline.length - 1;
              return (
                <li key={node.label} className="flex items-center">
                  {/*
                    ההשהיה נגזרת מהאינדקס: הרצועה נבנית מימין לשמאל כמו
                    הקריאה, וכך היא מספרת רצף במקום להופיע כגוש אחד.
                  */}
                  <Reveal variant="scale" delay={i * 0.08} amount={0.4}>
                  <div
                    className={`rounded-xl border px-3 py-2 text-center transition-colors ${
                      last
                        ? "border-[#FF2D85]/40 bg-[#FF2D85]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`block text-[13px] font-semibold leading-none ${
                        last ? "text-[#FF2D85]" : "text-bone/85"
                      }`}
                    >
                      {node.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-none text-bone/40">
                      {node.hint}
                    </span>
                  </div>
                  </Reveal>
                  {!last && (
                    /* ArrowIcon מצביע שמאלה, כלומר "קדימה" ב-RTL */
                    <span className="mx-1.5 text-bone/25 sm:mx-2" aria-hidden>
                      <ArrowIcon size={14} />
                    </span>
                  )}
                </li>
              );
            })}
          </motion.ol>

          {/*
            בזרימה ולא absolute bottom: ההירו הזה אינו במסך מלא, ורמז
            שממוקם לתחתיתו היה נוחת על הסקשן שמתחת במקום לסגור את ההירו.
          */}
          <HeroScrollCue className="mt-10 sm:mt-12" />
        </div>
      </section>

      {/* ── 1. מה קורה היום בשוק ──────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              compact
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

      {/* ── 2. הכאב. הכרטיס הראשון הוא הכאב הרביעי ────────────── */}
      <section className="py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              compact
              kicker={FASHION_LP.pain.kicker}
              title={
                <>
                  {FASHION_LP.pain.title} <AccentWord>{FASHION_LP.pain.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.pain.sub}
            />
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {/*
              מסכה ולא עלייה: ארבעה כרטיסים שעולים יחד נראים כמו רשת
              שנטענה, ומסכה שנפתחת מימין קוראת כמו טקסט שנחשף. הכרטיס
              הראשון בלי השהיה כי הוא הכאב שנפתחים בו.
            */}
            {FASHION_LP.pain.cards.map((card, i) => (
              <Reveal key={card.title} variant="mask" delay={i * 0.09}>
                {/*
                  הכרטיס הראשון מסומן ויזואלית. הוא הכאב שנפתחים בו,
                  ובלי הבדל הוא נבלע ברשת של ארבעה כרטיסים זהים.
                */}
                <article
                  className={`h-full rounded-2xl border p-5 shadow-card ${
                    i === 0
                      ? "border-[#FF2D85]/35 bg-[#FF2D85]/[0.06]"
                      : "border-white/10 bg-surface-1"
                  }`}
                >
                  <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-bone">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-bone/60">{card.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. מה השתנה ────────────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              compact
              kicker={FASHION_LP.shift.kicker}
              title={
                <>
                  {FASHION_LP.shift.title} <AccentWord>{FASHION_LP.shift.titleAccent}</AccentWord>
                </>
              }
              sub={FASHION_LP.shift.sub}
            />
          </Reveal>

          {/*
            כותרות העמודות מוצגות פעם אחת מעל הרשימה, ולא בכל שורה.
            בלעדיהן הקו החוצה בצד הימני נקרא כמו טעות עריכה ולא כמו
            "ככה עשו קודם", וארבע השורות מתערבבות לרשימה אחת ארוכה.
          */}
          <div className="mx-auto mt-8 max-w-3xl">
            <Reveal>
              <div className="mb-2 hidden grid-cols-2 gap-4 px-5 sm:grid">
                <span className="text-xs font-semibold uppercase tracking-wide text-bone/35">
                  {FASHION_LP.shift.beforeLabel}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#FF2D85]">
                  {FASHION_LP.shift.afterLabel}
                </span>
              </div>
            </Reveal>

            <div className="space-y-3">
              {/*
                המסכה נפתחת מה-inline-start, כלומר מימין ב-RTL: העין
                פוגשת קודם את "הדרך הישנה" ורק אחריה את מה שהחליף אותה.
                זה בדיוק סדר הקריאה של הטיעון בשורה.
              */}
              {FASHION_LP.shift.rows.map((row, i) => (
                <Reveal key={row.after} variant="mask" delay={i * 0.07}>
                  <div className="relative grid gap-3 overflow-hidden rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card sm:grid-cols-2 sm:gap-4 sm:p-5">
                    {/*
                      פס ורוד דק על שפת ה"אחרי". ב-RTL העמודה השנייה היא
                      השמאלית, ולכן הפס יושב ב-inset-inline-end ולא ב-left,
                      וגם מתהפך נכון אם הכיוון ישתנה אי פעם.
                    */}
                    <span
                      className="pointer-events-none absolute inset-y-0 end-0 hidden w-px bg-gradient-to-b from-transparent via-[#FF2D85]/40 to-transparent sm:block"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-bone/40 line-through decoration-bone/25">
                      {row.before}
                    </p>
                    <p className="flex items-start gap-2 text-sm font-medium leading-relaxed text-bone">
                      <span className="mt-0.5 flex-none text-[#FF2D85]" aria-hidden>
                        <ArrowIcon size={14} />
                      </span>
                      <span>{row.after}</span>
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. הפתרון ──────────────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              compact
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

          {/*
            מסילה אנכית שמחברת את חמשת המפגשים.
            חמישה כרטיסים זהים נקראו כרשימת נושאים שאפשר לקחת מהם אחד;
            המסילה אומרת שזה מסלול שמתקדם, ושהתוצר נמצא בסוף שלו. היא
            יושבת ב-inset-inline-start (start) ולא ב-right, כדי שהיא
            תישאר בצד הנכון בכל כיוון.
          */}
          <div className="relative mx-auto mt-8 max-w-3xl">
            {/*
              המסילה נמתחת לפי התקדמות הגלילה בסקשן, במקום גרדיאנט קבוע.
              זה מה שהופך את חמשת המפגשים ממסמך למסלול: הקו מתקדם יחד עם
              הגולשת, ומגיע לצומת האחרון בדיוק כשהיא מגיעה אליו.
              הצבע נשאב מ-currentColor דרך text-, לכן אין כאן צבע קשיח נוסף.
            */}
            <ScrollLine className="pointer-events-none absolute inset-y-6 start-[39px] hidden w-px text-[#FF2D85]/55 sm:block" />

            <ol className="space-y-3">
              {FASHION_LP.solution.steps.map((step, i) => (
                <Reveal key={step.step} delay={i * 0.06} amount={0.3}>
                  <li className="relative flex gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card transition-colors duration-300 hover:border-[#FF2D85]/30 sm:p-5">
                    <span
                      className={`relative z-[1] flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border font-display text-sm font-bold tracking-tight ${
                        i === FASHION_LP.solution.steps.length - 1
                          ? "border-[#FF2D85]/50 bg-[#FF2D85] text-white"
                          : "border-[#FF2D85]/30 bg-canvas text-[#FF2D85]"
                      }`}
                      dir="ltr"
                    >
                      {step.step}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold tracking-tight text-bone sm:text-lg">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-bone/60">{step.body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          {/*
            ארבעת התוצרים כרשומות נפרדות ולא כרשימת תבליטים.
            זה מה שהגולשת מקבלת ביד, וברשימה צפופה בתוך תיבה אחת הוא
            נקרא כמו "מה נלמד" ולא כמו "מה יהיה שלך בסוף".
          */}
          <Reveal className="mx-auto mt-8 max-w-3xl">
            <div className="rounded-2xl border border-[#FF2D85]/25 bg-[#FF2D85]/[0.05] p-5 sm:p-6">
              <h3 className="font-display text-base font-bold tracking-tight text-bone sm:text-lg">
                עם מה יוצאים
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {FASHION_LP.solution.outcomes.map((item, i) => (
                  <Reveal
                    key={item}
                    as="li"
                    variant="scale"
                    delay={i * 0.08}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-canvas/40 p-3.5 text-sm leading-relaxed text-bone/80"
                  >
                    <span
                      className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#FF2D85]/15 text-[#FF2D85]"
                      aria-hidden
                    >
                      <CheckIcon size={13} />
                    </span>
                    <span>{item}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
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
      />

      {/* ── 5. הוכחה ───────────────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <div className="container-site">
          <Reveal>
            <SectionHeader
              compact
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
            המסגרת המוסדית לפני המנחה: קודם "מי אלה בכלל", ואז "מי מלמדת".
            הכרטיס קומפקטי מזה של הדר בכוונה, כדי שהיא תישאר העוגן.
          */}
          {founder && (
            <Reveal className="mx-auto mt-8 max-w-3xl" variant="blur">
              <button
                type="button"
                /* popupJustClosed חוסם פתיחה מחדש כשסגירת הפופאפ בלחיצה
                   בחוץ נוחתת על הכרטיס שמתחתיה */
                onClick={() =>
                  !popupJustClosed() &&
                  setInstructorBio({
                    instructor: founder,
                    bio: founder.trackBios.general ?? founder.bio,
                  })
                }
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 text-start shadow-card transition-colors duration-200 hover:border-[#FF2D85]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50 sm:p-5"
              >
                <img
                  src={founder.image}
                  alt={founder.name}
                  loading="lazy"
                  className="h-12 w-12 flex-none rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  {/* שם ואז תפקיד בשורה נפרדת, בדיוק כמו בכרטיס של הדר
                      שמתחתיו. שני כרטיסי אנשים סמוכים במבנה שונה נקראים
                      כמו שני רכיבים שהודבקו זה ליד זה. */}
                  <h3 className="font-display text-base font-bold tracking-tight text-bone">
                    {founder.name}
                  </h3>
                  <p className="text-xs font-medium text-brand">{FASHION_LP.founder.roleLabel}</p>
                  <p className="mt-2 text-sm leading-relaxed text-bone/60">
                    {FASHION_LP.founder.line}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-bone/55">
                    {FASHION_LP.founder.more}
                    <ArrowIcon size={12} />
                  </span>
                </div>
              </button>
            </Reveal>
          )}

          {/*
            המנחה יושבת בתוך ההוכחה ולא בסקשן משלה. לקהל שלא מכיר את
            האקדמיה, "מי מלמדת" הוא חלק מהשאלה אם להאמין - לא פרט טכני.
          */}
          {instructors.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              {instructors.map(({ instructor: person, bio }) => (
                <Reveal key={person.id} variant="blur">
                  {/*
                    גם כרטיס המנחה לחיץ. שני כרטיסי אנשים סמוכים שאחד
                    מהם נפתח והשני לא הם חוסר עקביות שהמשתמשת מרגישה
                    מיד, וגם חבל: לכל מנחה יש ביו מלא בדאטה שהעמוד
                    הציג ממנו רק שלוש שורות.
                  */}
                  <button
                    type="button"
                    onClick={() => !popupJustClosed() && setInstructorBio({ instructor: person, bio })}
                    className="flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 text-start shadow-card transition-colors duration-200 hover:border-[#FF2D85]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50 sm:p-5">
                    <img
                      src={person.image}
                      alt={person.name}
                      loading="lazy"
                      className="h-16 w-16 flex-none rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-display text-base font-bold tracking-tight text-bone">
                        {person.name}
                      </h3>
                      <p className="text-xs font-medium text-brand">{person.role}</p>
                      <ul className="mt-2 space-y-1">
                        {person.credentials.slice(0, 3).map((line: string) => (
                          <li key={line} className="flex gap-2 text-sm leading-relaxed text-bone/60">
                            <CheckIcon size={12} />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-bone/55">
                        עוד על {person.shortName ?? person.name}
                        <ArrowIcon size={12} />
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}

          {testimonials.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item, i) => (
                <Reveal key={item.id} variant="scale" delay={i * 0.1}>
                  <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface-1 p-5 shadow-card">
                    <p className="font-display text-lg font-bold leading-snug tracking-tight text-bone">
                      {item.quote}
                    </p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/55">{item.text}</p>
                    {item.author && (
                      <span className="mt-4 text-xs font-medium text-bone/50">{item.author}</span>
                    )}
                    <button
                      type="button"
                      /* popupJustClosed חוסם פתיחה מחדש כשסגירת הלייטבוקס
                         בלחיצה בחוץ נוחתת על הכרטיס שמתחתיה */
                      onClick={() => !popupJustClosed() && setLightbox(item)}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-xs font-medium text-bone/55 transition-colors hover:text-brand"
                    >
                      לצפייה בהודעה המקורית
                      <ArrowIcon size={13} />
                    </button>
                  </article>
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
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {FASHION_LP.form.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                    {FASHION_LP.form.sub}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-white/85">
                    {FASHION_LP.form.bullets.map((line) => (
                      <li key={line} className="flex gap-2">
                        <CheckIcon size={13} />
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
      <section className="py-10 sm:py-14">
        <div className="container-site max-w-3xl">
          <Reveal>
            <SectionHeader
              compact
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
