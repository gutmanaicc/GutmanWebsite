import { useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import ClosingCta from "../components/ClosingCta";
import CourseCard from "../components/CourseCard";
import UpcomingCourseCard from "../components/UpcomingCourseCard";
import { AccentWord } from "../components/SectionHeader";
import { ScrollReveal3D, StaggerGroup, StaggerItem } from "../components/motion";
import { ACTIVE_COURSES } from "../data/courses";
import { UPCOMING_COURSES } from "../data/upcomingCourses";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const ALL = "all";

const Courses = () => {
  const [filter, setFilter] = useState(ALL);
  const categories = useMemo(() => [...new Set(ACTIVE_COURSES.map((c) => c.category))], []);

  const filtered =
    filter === ALL ? ACTIVE_COURSES : ACTIVE_COURSES.filter((c) => c.category === filter);

  useSeo({
    title: `סדנאות ומסלולים | ${SITE.name}`,
    description: `כל הסדנאות הפרונטליות של ${SITE.name}. סדנאות פתוחות להרשמה וסדנאות שנפתחות בקרוב.`,
    path: "/courses",
  });

  const pillClass = (active: boolean) =>
    `inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition-colors duration-300 ${
      active
        ? "border-bone bg-bone text-ink"
        : "border-white/20 text-bone/60 hover:border-white/50 hover:text-bone"
    }`;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-25" aria-hidden />
        <div className="container-site relative py-10 sm:py-14 lg:py-16">
          <div className="mb-4 flex w-full justify-start sm:mb-5">
            <BackButton fallbackTo="/" />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <span className="section-label mb-5 text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              סדנאות
            </span>
            <h1 className="display-2 text-bone">
              הסדנאות המעשיות שלנו <AccentWord>ללימודי AI</AccentWord>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-bone/60 sm:text-lg">
              בחרו את הסדנה המותאמת למקצוע, לעסק ולמטרה שלכם. לימודים פרונטליים מבוססי תוצר מעשי.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-site">
          <div
            className="mb-12 flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="סינון סדנאות"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === ALL}
              className={pillClass(filter === ALL)}
              onClick={() => setFilter(ALL)}
            >
              הכל
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={filter === cat}
                className={pillClass(filter === cat)}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* רשת אחת: הפתוחות להרשמה קודם, ומיד אחריהן אלה שבקרוב */}
          <StaggerGroup key={filter} className="grid gap-5 sm:gap-6 md:grid-cols-2" stagger={0.06}>
            {filtered.map((course) => (
              <StaggerItem key={course.slug} className="h-full">
                <ScrollReveal3D className="h-full" fromRotateX={10} fromY={26}>
                  <CourseCard course={course} unroll={false} />
                </ScrollReveal3D>
              </StaggerItem>
            ))}

            {filter === ALL &&
              UPCOMING_COURSES.map((course) => (
                <StaggerItem key={course.slug} className="h-full">
                  <ScrollReveal3D className="h-full" fromRotateX={10} fromY={26}>
                    <UpcomingCourseCard course={course} />
                  </ScrollReveal3D>
                </StaggerItem>
              ))}
          </StaggerGroup>
        </div>
      </section>

      {/* מי שהגיע לתחתית הרשת ולא בחר מסלול היה יוצא מהאתר בלי שנשאל אותו כלום */}
      <ClosingCta
        leadSource="courses-closing"
        title={
          <>
            לא בטוחים איזה מסלול <AccentWord>מתאים לכם?</AccentWord>
          </>
        }
        sub="השאירו פרטים ונעבור אתכם על האפשרויות. בלי לדחוף אתכם למשהו שלא מתאים."
        cta="עזרו לי לבחור"
      />
    </div>
  );
};

export default Courses;
