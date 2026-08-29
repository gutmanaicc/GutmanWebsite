import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import ImageLightbox from "../components/ImageLightbox";
import Pressable from "../components/Pressable";
import RegisterForm from "../components/RegisterForm";
import ReviewsRatingBadge from "../components/ReviewsRatingBadge";
import { MotionItem, MotionSection } from "../components/course/CourseMotion";
import { ArrowIcon, CheckIcon } from "../components/icons";
import { FASHION_LP } from "../data/fashionLanding";
import { getInstructorsForCourse } from "../data/instructorsData";
import { getTestimonialsForCourse, type Testimonial } from "../data/testimonialsData";
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

const scrollToForm = () => {
  document.getElementById("lp-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const FashionLanding = () => {
  const reduced = useReducedMotion();
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);
  const testimonials = getTestimonialsForCourse(FASHION_LP.courseSlug, 3);
  const instructors = getInstructorsForCourse(FASHION_LP.courseSlug);

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
      {/* ── הירו: הכאב הרביעי, לא שם המוצר ─────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -left-20 top-6 h-40 w-40 rounded-full bg-[#FF2D85]/12 blur-3xl"
          aria-hidden
        />

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

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {FASHION_LP.hero.title}
              <br />
              <AccentWord>{FASHION_LP.hero.titleAccent}</AccentWord>
            </h1>

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
        </div>
      </section>

      {/* ── 1. מה קורה היום בשוק ──────────────────────────────── */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
          </MotionItem>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FASHION_LP.market.stats.map((stat) => (
              <MotionItem key={stat.label}>
                <div className="h-full rounded-2xl border border-white/10 bg-surface-1 p-5 text-center shadow-card">
                  <p className="font-display text-2xl font-bold tracking-tight text-[#FF2D85] sm:text-3xl">
                    <span dir="ltr">{stat.value}</span>
                    {stat.unit && <span> {stat.unit}</span>}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-bone/60">{stat.label}</p>
                </div>
              </MotionItem>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* ── 2. הכאב. הכרטיס הראשון הוא הכאב הרביעי ────────────── */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
          </MotionItem>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FASHION_LP.pain.cards.map((card, i) => (
              <MotionItem key={card.title}>
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
              </MotionItem>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* ── 3. מה השתנה ────────────────────────────────────────── */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
          </MotionItem>

          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {FASHION_LP.shift.rows.map((row) => (
              <MotionItem key={row.after}>
                <div className="grid gap-3 rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card sm:grid-cols-2 sm:gap-4 sm:p-5">
                  <p className="text-sm leading-relaxed text-bone/45 line-through decoration-bone/25">
                    {row.before}
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-bone">{row.after}</p>
                </div>
              </MotionItem>
            ))}
          </div>
        </div>
      </MotionSection>

      {/* ── 4. הפתרון ──────────────────────────────────────────── */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
          </MotionItem>

          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {FASHION_LP.solution.steps.map((step) => (
              <MotionItem key={step.step}>
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card sm:p-5">
                  <span
                    className="font-display text-xl font-bold tracking-tight text-[#FF2D85]"
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
                </div>
              </MotionItem>
            ))}
          </div>

          <MotionItem className="mx-auto mt-8 max-w-3xl">
            <div className="rounded-2xl border border-[#FF2D85]/25 bg-[#FF2D85]/[0.05] p-5 sm:p-6">
              <h3 className="font-display text-base font-bold tracking-tight text-bone sm:text-lg">
                עם מה יוצאים
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {FASHION_LP.solution.outcomes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-bone/75">
                    <CheckIcon size={13} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </MotionItem>
        </div>
      </MotionSection>

      {/* ── 5. הוכחה ───────────────────────────────────────────── */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
          </MotionItem>

          <MotionItem className="mt-6 flex justify-center">
            <ReviewsRatingBadge />
          </MotionItem>

          {/*
            המנחה יושבת בתוך ההוכחה ולא בסקשן משלה. לקהל שלא מכיר את
            האקדמיה, "מי מלמדת" הוא חלק מהשאלה אם להאמין - לא פרט טכני.
          */}
          {instructors.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              {instructors.map(({ instructor: person }) => (
                <MotionItem key={person.id}>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card sm:p-5">
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
                      <p className="text-xs font-medium text-[#FF2D85]">{person.role}</p>
                      <ul className="mt-2 space-y-1">
                        {person.credentials.slice(0, 3).map((line: string) => (
                          <li key={line} className="flex gap-2 text-sm leading-relaxed text-bone/60">
                            <CheckIcon size={12} />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </div>
          )}

          {testimonials.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <MotionItem key={item.id}>
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
                </MotionItem>
              ))}
            </div>
          )}
        </div>
      </MotionSection>

      {/* ── 6. טופס ────────────────────────────────────────────── */}
      <MotionSection id="lp-form" className="scroll-mt-20 py-10 sm:py-14">
        <div className="container-site">
          <MotionItem>
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
                    title="רוצה לבנות קמפיין אופנה"
                    sub="נחזור אליכן עם המחזור הקרוב והפרטים."
                  />
                </div>
              </div>
            </div>
          </MotionItem>
        </div>
      </MotionSection>

      {/* התנגדויות. אחרי הטופס, כמו בעמוד המסלול - מי שכבר משוכנע לא צריך אותן */}
      <MotionSection className="py-10 sm:py-14">
        <div className="container-site max-w-3xl">
          <MotionItem>
            <SectionHeader
              compact
              kicker="שאלות"
              title={
                <>
                  לפני ש<AccentWord>תשאירי פרטים</AccentWord>
                </>
              }
            />
          </MotionItem>
          <MotionItem className="mt-6">
            <FAQAccordion items={FASHION_LP.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </MotionItem>

          <MotionItem className="mt-8 flex justify-center">
            <Pressable
              type="button"
              className="btn cursor-pointer bg-[#FF2D85] text-white shadow-pill hover:brightness-105"
              rippleTone="pink"
              onClick={scrollToForm}
            >
              {FASHION_LP.hero.cta}
              <ArrowIcon />
            </Pressable>
          </MotionItem>
        </div>
      </MotionSection>

      <ImageLightbox
        src={lightbox?.image ?? null}
        alt={lightbox?.quote ?? ""}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};

export default FashionLanding;
