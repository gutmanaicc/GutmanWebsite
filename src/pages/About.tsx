import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import BackButton from "../components/BackButton";
import ClosingCta from "../components/ClosingCta";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import { ScrollReveal3D } from "../components/motion";
import MethodJourney from "../components/MethodJourney";
import { ArrowIcon } from "../components/icons";
import { SITE } from "../data/site";
import { ACTIVE_COURSES } from "../data/courses";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";

const PORTRAIT = "/images/ron-portrait.jpg";

/** פרקי הסיפור. הטקסט נשמר כפי שנמסר, מפוצל לפרקים כדי שיהיה נוח לקרוא. */
const STORY = [
  {
    kicker: "ההתחלה",
    title: "מצילום ווידאו לבינה מלאכותית",
    body: [
      "אקדמיית Gutman נולדה מתוך הדרך האישית והמקצועית שלי. התחלתי בעולם הצילום, הווידאו ויצירת התוכן, עבדתי עם עסקים ומותגים, ובהמשך נכנסתי עמוק לעולם הבינה המלאכותית והבנתי שאנחנו נמצאים בתחילתו של שינוי עצום בדרך שבה אנשים עובדים, יוצרים ומתפרנסים.",
    ],
  },
  {
    kicker: "נקודת המפנה",
    title: "מה שהחיים לימדו אותי על זמן",
    body: [
      "אבל הדרך שלי לא הייתה רק מקצועית. בגיל 25 אובחנתי עם סרטן הודג'קין בשלב 4 ועברתי 12 טיפולי כימותרפיה. התקופה הזאת שינתה את הדרך שבה אני מסתכל על זמן, פחד, קריירה ועל הדברים שאני רוצה לעשות בחיים.",
      "תוך כדי עברתי גם תהליך CBT משמעותי, עולם שהכניס לחיים שלי כלים להתמודדות, חשיבה ועבודה עצמית, ובהמשך אפילו מצאתי את עצמי עומד מול קהל ומשתף מהניסיון ומהדרך שעברתי.",
    ],
  },
  {
    kicker: "התובנה",
    title: "ידע שווה משהו רק כשהוא משנה משהו",
    body: [
      "כל החוויות האלה התחברו בסופו של דבר לאותה תפיסה: ידע הוא באמת בעל ערך רק כשהוא משנה משהו בחיים שלך.",
      "וזו בדיוק הסיבה שבניתי את אקדמיית Gutman.",
    ],
  },
  {
    kicker: "הגישה",
    title: "לא עוד קורס שנשאר פתוח באמצע",
    body: [
      "לא רציתי ליצור עוד מקום שמלמד אנשים על AI, ולא עוד קורס דיגיטלי שקונים בהתלהבות ונשאר פתוח איפשהו באמצע. רציתי לבנות מקום שבו אנשים מגיעים, עובדים בידיים, שואלים שאלות, מתנסים ויוצאים עם יכולת חדשה שהם יכולים לקחת ישירות לחיים ולעבודה שלהם.",
    ],
  },
  {
    kicker: "המבנה",
    title: "כל סדנה נבנית סביב מקצוע אמיתי",
    body: [
      "לכן כל מסלול באקדמיה נבנה סביב מקצוע, צורך או בעיה אמיתית. מנהלי סושיאל לומדים איך להפוך את ה-AI לכוח עבודה שמשרת אותם ואת הלקוחות שלהם. יוצרים ועורכי וידאו לומדים לייצר דברים שבעבר דרשו צוותים ותקציבים גדולים. מטפלים לומדים איך הטכנולוגיה יכולה להשתלב בעבודה שלהם. סטודנטים, אנשי אופנה, בעלי עסקים ואנשי מקצוע נוספים לומדים את ה-AI מתוך העולם שלהם ולא בצורה כללית ומנותקת.",
    ],
  },
];

const VISION =
  "החזון שלי הוא שאקדמיית Gutman תהיה המקום שאליו מגיעים אנשים שרוצים להיות בצד שמוביל את השינוי ולא בצד שמנסה להדביק אותו. מקום שמחבר בין טכנולוגיה, יצירתיות, ניסיון חיים ועבודה מעשית, ושכל אדם שיוצא ממנו לא רק מכיר עוד כמה כלים, אלא באמת יודע לעשות איתם משהו שלא ידע לעשות קודם.";

const About = () => {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  /*
   * בלי זה כותרת הסקשן של העמוד נשארת בלתי נראית לצמיתות: SectionHeader
   * נושא data-reveal, והכלל [data-reveal]:not(.revealed) הוא opacity-0.
   * useReveal הוא מי שמוסיף את .revealed, והעמוד הזה פשוט לא קרא לו.
   */
  useReveal();

  useSeo({
    title: `אודות | ${SITE.name}`,
    description:
      "הסיפור מאחורי האקדמיה של גוטמן: הדרך של רון גוטמן מצילום ווידאו אל הבינה המלאכותית, והתפיסה שכל סדנה נבנית סביב מקצוע אמיתי.",
    path: "/about",
    schema: [orgSchema()],
  });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div>
      {/* פתיחה: הפורטרט והכותרת זה לצד זה, הפורטרט נע לאט יותר בגלילה */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-20" aria-hidden />
        <div className="container-site relative py-10 sm:py-14">
          <div className="mb-8 flex justify-start">
            <BackButton fallbackTo="/" />
          </div>

          {/* עמודה ממורכזת: הפורטרט למעלה, ומתחתיו הכותרת והתגיות */}
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="relative w-[min(78%,20rem)]">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10">
                <motion.img
                  src={PORTRAIT}
                  alt="רון גוטמן, מייסד האקדמיה"
                  className="aspect-[4/5] w-full object-cover object-top"
                  style={reduced ? undefined : { y: portraitY, scale: portraitScale }}
                  loading="eager"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(13,12,17,0.75) 0%, rgba(13,12,17,0) 45%)",
                  }}
                  aria-hidden
                />
              </div>
              {/* זוהר ורוד עדין מאחורי הפורטרט */}
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,95,158,0.14) 0%, rgba(255,95,158,0) 70%)",
                }}
                aria-hidden
              />
            </div>

            <span className="section-label mb-4 mt-10 text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              אודות
            </span>
            <h1 className="display-1 text-bone">
              אני רון גוטמן,
              <br />
              <AccentWord>ובניתי את האקדמיה</AccentWord>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-bone/65 sm:text-lg">
              {SITE.founder.title} · {SITE.tagline}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {["צילום ווידאו", "יצירת תוכן", "בינה מלאכותית", "הנחיה פרונטלית"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-medium text-bone/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* הסיפור: פרקים ממוספרים שנחשפים בגלילה */}
      <section className="py-14 sm:py-20">
        <div className="container-site max-w-3xl">
          {STORY.map((chapter, i) => (
            <ScrollReveal3D key={chapter.title} from="up" intensity="quiet" fromRotateX={6} fromY={28}>
              <article className="border-t border-white/10 py-10 first:border-t-0 first:pt-0 sm:py-12">
                <div className="flex items-baseline justify-center gap-4">
                  <span className="text-[11px] font-medium tracking-[0.22em] text-brand" dir="ltr" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="section-label text-bone">{chapter.kicker}</span>
                </div>

                <h2 className="mt-5 text-center font-display text-2xl font-bold leading-snug tracking-tight text-bone sm:text-[2rem]">
                  {chapter.title}
                </h2>

                <div className="mt-5 space-y-4">
                  {chapter.body.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-bone/65 sm:text-[1.0625rem]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            </ScrollReveal3D>
          ))}
        </div>
      </section>

      {/* איך אנחנו מלמדים: מסע גלילה */}
      <MethodJourney />

      {/* החזון, כבלוק מודגש */}
      <section className="pb-14 sm:pb-20">
        <div className="container-site max-w-3xl">
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={24}>
            <div className="rounded-[1.5rem] border border-brand/30 bg-brand/[0.06] p-7 text-center sm:p-10">
              <span className="section-label mb-4 text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                החזון
              </span>
              <p className="mx-auto max-w-2xl font-display text-lg font-bold leading-snug tracking-tight text-bone sm:text-2xl">
                {VISION}
              </p>
            </div>
          </ScrollReveal3D>
        </div>
      </section>

      {/* סיום: לאן ממשיכים מכאן */}
      <section className="border-t border-white/10 py-14 sm:py-20">
        <div className="container-site">
          <SectionHeader
            as="h2"
            kicker="הסדנאות"
            title={
              <>
                כל סדנה נבנית סביב <AccentWord>מקצוע אמיתי</AccentWord>
              </>
            }
            center
          />

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {ACTIVE_COURSES.map((course) => (
              <Link
                key={course.slug}
                to={`/courses/${course.slug}`}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-bone/70 transition-colors duration-300 hover:border-brand hover:text-bone"
              >
                {course.shortTitle}
                <span
                  className="-translate-x-1 text-brand opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden
                >
                  <ArrowIcon size={13} />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/courses"
              className="group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-bone/35 px-8 text-sm font-medium text-bone transition-colors duration-500 hover:border-bone/70 hover:text-ink sm:text-[15px]"
            >
              <span
                className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                aria-hidden
              />
              <span className="relative">לכל הסדנאות</span>
            </Link>
          </div>
        </div>
      </section>

      {/* הסיפור האישי הוא נכס האמון החזק באתר, והעמוד נגמר קודם בלי לבקש כלום */}
      <ClosingCta
        leadSource="about-closing"
        title={
          <>
            עכשיו ספרו לי <AccentWord>עליכם.</AccentWord>
          </>
        }
        sub="קראתם את הסיפור שלי. אשמח לשמוע מה אתם רוצים לבנות, ולהגיד לכם בכנות אם ואיך אנחנו יכולים לעזור."
        cta="השאירו פרטים ונדבר"
      />
    </div>
  );
};

export default About;
