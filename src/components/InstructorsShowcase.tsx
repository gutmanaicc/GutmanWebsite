import { INSTRUCTORS, type Instructor } from "../data/instructorsData";
import SectionHeader, { AccentWord } from "./SectionHeader";

const InstructorCard = ({ instructor }: { instructor: Instructor }) => (
  <article className="flex h-full flex-col items-center rounded-3xl border border-white/12 bg-white/[0.03] p-7 text-center">
    {/* דיוקן עגול בסגנון תמונת פרופיל, לא חצי כרטיס */}
    <img
      src={instructor.image}
      alt={instructor.name}
      className="h-32 w-32 rounded-full object-cover object-center ring-1 ring-white/15 sm:h-36 sm:w-36"
      loading="lazy"
      draggable={false}
    />

    <h3 className="mt-5 text-xl font-semibold tracking-tight text-bone">{instructor.name}</h3>
    <p className="mt-1 text-sm font-medium text-brand">{instructor.role}</p>

    <p className="mt-4 text-sm leading-relaxed text-bone/60">{instructor.bio}</p>

    <ul className="mt-4 space-y-1.5">
      {instructor.credentials.map((cred) => (
        <li key={cred} className="text-xs leading-relaxed text-bone/40">
          {cred}
        </li>
      ))}
    </ul>

    <div className="mt-5 flex flex-wrap justify-center gap-1.5">
      {instructor.roleTags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-bone/55"
        >
          {tag}
        </span>
      ))}
    </div>
  </article>
);

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
