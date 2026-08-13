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
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-40" aria-hidden />
        <div className="container-site relative py-10 sm:py-14 lg:py-16">
          <div className="mb-4 flex w-full justify-start sm:mb-5">
            <BackButton fallbackTo="/" />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <span className="stat-pill mb-4 inline-flex border-[#FF2D85]/25 bg-[#FF2D85]/5 text-[#FF2D85]">
              מסלולים
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#191919] sm:text-4xl lg:text-5xl">
              המסלולים המעשיים שלנו <AccentWord>ללימודי AI</AccentWord>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-zinc-600 sm:mt-5 sm:text-lg">
              בחרו את המסלול המותאם למקצוע, לעסק ולמטרה שלכם - לימודים פרונטליים מבוססי תוצר מעשי.
            </p>
          </div>
        </div>
      </section>

      <div className="py-12 sm:py-16">
        <div className="container-site">
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="סינון מסלולים">
            <button
              type="button"
              role="tab"
              aria-selected={filter === ALL}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === ALL ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"
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
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  filter === cat ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"
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
                  ? "grid auto-rows-fr gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12"
                  : "grid gap-4 sm:gap-5 md:grid-cols-2"
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
