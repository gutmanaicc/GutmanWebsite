import { useMemo, useState } from "react";
import CourseCard from "../components/CourseCard";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import { ScrollReveal3D, StaggerGroup, StaggerItem } from "../components/motion";
import { COURSES } from "../data/courses";
import { COURSE_COUNT, SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const ALL = "all";

/** Bento spans for the full (unfiltered) 5-course layout. */
const BENTO_SPANS = [
  "md:col-span-2 lg:col-span-7",
  "md:col-span-1 lg:col-span-5",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-1 lg:col-span-4",
  "md:col-span-2 lg:col-span-4",
];

const Courses = () => {
  const [filter, setFilter] = useState(ALL);
  const categories = useMemo(() => [...new Set(COURSES.map((c) => c.category))], []);

  const filtered = filter === ALL ? COURSES : COURSES.filter((c) => c.category === filter);
  const isBento = filter === ALL && filtered.length === COURSES.length;

  useSeo({
    title: `מסלולים | ${SITE.name}`,
    description: `כל ${COURSE_COUNT} המסלולים הפרונטליים של ${SITE.name}. בחרו לפי תחום ומטרה.`,
    path: "/courses",
  });

  return (
    <div className="py-16 sm:py-20">
      <div className="container-site">
        <SectionHeader
          as="h1"
          kicker="מסלולים"
          title={
            <>
              בחרו את <AccentWord>המסלול</AccentWord> שלכם
            </>
          }
          sub="חמישה מסלולים מעשיים. כל אחד מסתיים בתוצר אמיתי."
        />

        <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="סינון מסלולים">
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
              const sourceIndex = COURSES.indexOf(course);
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
  );
};

export default Courses;
