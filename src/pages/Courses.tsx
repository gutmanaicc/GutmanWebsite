import { useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import CourseCard from "../components/CourseCard";
import { AccentWord } from "../components/SectionHeader";
import { ScrollReveal3D, StaggerGroup, StaggerItem } from "../components/motion";
import { PRIMARY_COURSES } from "../data/courses";
import { COURSE_COUNT, SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const ALL = "all";

/** Bento spans for the full (unfiltered) primary-track layout. */
const BENTO_SPANS = [
  "md:col-span-2 lg:col-span-7",
  "md:col-span-1 lg:col-span-5",
  "md:col-span-1 lg:col-span-6",
  "md:col-span-1 lg:col-span-6",
];

const Courses = () => {
  const [filter, setFilter] = useState(ALL);
  const categories = useMemo(() => [...new Set(PRIMARY_COURSES.map((c) => c.category))], []);

  const filtered = filter === ALL ? PRIMARY_COURSES : PRIMARY_COURSES.filter((c) => c.category === filter);
  const isBento = filter === ALL && filtered.length === PRIMARY_COURSES.length;

  useSeo({
    title: `מסלולים | ${SITE.name}`,
    description: `כל ${COURSE_COUNT} המסלולים הפרונטליים של ${SITE.name}. בחרו לפי תחום ומטרה.`,
    path: "/courses",
  });

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
              מסלולים
            </span>
            <h1 className="display-2 text-bone">
              המסלולים המעשיים שלנו <AccentWord>ללימודי AI</AccentWord>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-bone/60 sm:text-lg">
              בחרו את המסלול המותאם למקצוע, לעסק ולמטרה שלכם - לימודים פרונטליים מבוססי תוצר מעשי.
            </p>
          </div>
        </div>
      </section>

      <div className="py-12 sm:py-16">
        <div className="container-site">
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="סינון מסלולים">
            <button
              type="button"
              role="tab"
              aria-selected={filter === ALL}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition-colors duration-300 ${
                filter === ALL
                  ? "border-bone bg-bone text-ink"
                  : "border-white/20 text-bone/60 hover:border-white/50 hover:text-bone"
              }`}
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
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition-colors duration-300 ${
                  filter === cat
                    ? "border-bone bg-bone text-ink"
                    : "border-white/20 text-bone/60 hover:border-white/50 hover:text-bone"
                }`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="deck-strip">
            <StaggerGroup
              key={filter}
              className={
                isBento
                  ? "grid auto-rows-fr gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-12"
                  : "grid gap-5 sm:gap-6 md:grid-cols-2"
              }
              stagger={0.07}
            >
              {filtered.map((course, i) => {
                const sourceIndex = PRIMARY_COURSES.indexOf(course);
                const span = isBento ? BENTO_SPANS[sourceIndex] ?? "lg:col-span-4" : "";
                const featured = isBento && sourceIndex === 0;

                return (
                  <StaggerItem key={course.slug} className={`${span} h-full`}>
                    <ScrollReveal3D className="h-full" fromRotateX={featured ? 12 : 10} fromY={featured ? 32 : 26}>
                      <CourseCard course={course} index={i} featured={featured} unroll={false} />
                    </ScrollReveal3D>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
