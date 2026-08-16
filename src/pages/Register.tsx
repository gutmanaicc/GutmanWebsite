import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import RegisterForm from "../components/RegisterForm";
import { AccentWord } from "../components/SectionHeader";
import { ScrollReveal3D } from "../components/motion";
import { ACTIVE_COURSES } from "../data/courses";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

/** מה שהמשאיר פרטים מקבל בפועל. שלוש הבטחות קונקרטיות, בלי סופרלטיבים. */
const PROMISES = [
  {
    title: "חוזרים אליכם אישית",
    text: "לא מענה אוטומטי. נדבר על המטרה שלכם ונגיד בכנות אם הסדנה מתאימה.",
  },
  {
    title: "מקבלים את כל הפרטים",
    text: "סילבוס מלא, מבנה המפגשים, מה צריך להביא ומה יוצא מזה בסוף.",
  },
  {
    title: "תאריכים לפני כולם",
    text: "כשנפתחת קבוצה חדשה, מי שהשאיר פרטים שומע על זה ראשון.",
  },
];

const Register = () => {
  useSeo({
    title: `הרשמה | ${SITE.name}`,
    description:
      "השאירו פרטים ונחזור אליכם עם כל המידע על הסדנה שמתאימה לכם: סילבוס, מועדים ותשובות לכל שאלה.",
    path: "/register",
  });

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-20" aria-hidden />
        {/* זוהר ורוד רך מאחורי הטופס, שמושך את העין לצד שבו ממלאים */}
        <div
          className="pointer-events-none absolute left-1/4 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(255,95,158,0.16) 0%, rgba(255,95,158,0) 70%)",
          }}
          aria-hidden
        />

        <div className="container-site relative py-10 sm:py-14 lg:py-16">
          <div className="mb-8 flex w-full justify-start">
            <BackButton fallbackTo="/" />
          </div>

          {/* פתיח ממורכז */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label mb-5 text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              הרשמה
            </span>

            <h1 className="display-2 text-bone">
              נשמור לכם <AccentWord>מקום</AccentWord>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-bone/65 sm:text-lg">
              הקבוצות קטנות בכוונה, כדי שלכל משתתף יהיה מקום לשאול, לתרגל ולקבל פידבק. השאירו פרטים
              ונחזור אליכם עם כל המידע.
            </p>
          </div>

          {/* הטופס עצמו, במרכז העמוד */}
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={5} fromY={22}>
            <div
              id="registration-form"
              className="mx-auto mt-10 w-full max-w-xl scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-paper text-ink shadow-float sm:mt-12"
            >
              <div className="bg-canvas px-6 pb-7 pt-8 text-center text-bone sm:px-9">
                <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-tight sm:text-[1.75rem]">
                  השאירו פרטים
                </h2>
                <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-bone/55">
                  שלוש דקות, ואנחנו חוזרים אליכם. בלי התחייבות ובלי ספאם.
                </p>
              </div>

              <div className="px-6 pb-9 pt-7 sm:px-9">
                <RegisterForm leadSource="register-page" headless />
              </div>
            </div>
          </ScrollReveal3D>

          {/* מה מקבלים אחרי שמשאירים פרטים */}
          <ul className="mx-auto mt-12 grid max-w-4xl gap-px overflow-hidden rounded-[1.25rem] bg-white/10 sm:mt-14 sm:grid-cols-3">
            {PROMISES.map((promise, i) => (
              <li key={promise.title} className="bg-canvas p-6 text-center sm:p-7">
                <span
                  className="block text-[11px] font-medium tracking-[0.22em] text-brand"
                  dir="ltr"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 font-display text-lg font-bold leading-snug tracking-tight text-bone">
                  {promise.title}
                </h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-bone/55">{promise.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <Link
              to="/courses"
              className="inline-flex min-h-11 items-center px-2 text-sm text-bone/50 underline-offset-4 transition-colors duration-200 hover:text-bone hover:underline"
            >
              עוד לא בטוחים? לכל הסדנאות
            </Link>
          </div>
        </div>
      </section>

      {/* הסדנאות, למי שהגיע לעמוד בלי לבחור */}
      <section className="border-t border-white/10 py-12 sm:py-16">
        <div className="container-site text-center">
          <span className="section-label mb-6 inline-flex text-bone">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            הסדנאות הפתוחות
          </span>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
            {ACTIVE_COURSES.map((course) => (
              <Link
                key={course.slug}
                to={`/courses/${course.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-medium text-bone/70 transition-colors duration-300 hover:border-brand hover:text-bone"
              >
                {course.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;
