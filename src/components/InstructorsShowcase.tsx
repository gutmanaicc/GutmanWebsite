import { useState } from "react";
import { INSTRUCTORS, type Instructor } from "../data/instructorsData";
import SectionHeader, { AccentWord } from "./SectionHeader";

const InstructorCard = ({ instructor }: { instructor: Instructor }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#191919]">
        <img
          src={instructor.image}
          alt={instructor.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#191919]/80 to-transparent" />
        <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          {instructor.roleTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/25 bg-[#191919]/55 px-2.5 py-1 text-[11px] font-semibold text-[#F4F4F2] backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 text-right">
        <h3 className="text-lg font-bold tracking-tight text-[#191919]">{instructor.name}</h3>
        <p className="mt-1 text-sm font-medium text-[#FF2D85]">{instructor.role}</p>
        <p className={`mt-3 text-sm leading-relaxed text-zinc-600 ${expanded ? "" : "line-clamp-3"}`}>
          {instructor.bio}
        </p>
        <ul className="mt-3 space-y-1">
          {instructor.credentials.slice(0, expanded ? undefined : 2).map((cred) => (
            <li key={cred} className="text-xs text-zinc-500">
              · {cred}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 inline-flex min-h-10 items-center justify-center self-start rounded-full border border-zinc-900/15 px-4 text-sm font-semibold text-[#191919] transition-colors hover:border-[#FF2D85] hover:text-[#FF2D85]"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "פחות פרטים" : "עוד על המנחה"}
        </button>
      </div>
    </article>
  );
};

/**
 * Team showcase for Home - Ron, Hadar, Idan with portraits and expandable bios.
 */
const InstructorsShowcase = () => (
  <section className="py-12 sm:py-16 lg:py-20">
    <div className="container-site">
      <SectionHeader
        kicker="הצוות"
        title={
          <>
            המנחים שמובילים את <AccentWord>המסלולים</AccentWord>
          </>
        }
        sub="צוות קטן, ליווי צמוד, וסטנדרט גבוה - מהמייסד ועד מומחי הוויז'ואל וההנחיה המעשית."
        center
      />

      <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {INSTRUCTORS.map((instructor) => (
          <InstructorCard key={instructor.id} instructor={instructor} />
        ))}
      </div>
    </div>
  </section>
);

export default InstructorsShowcase;
