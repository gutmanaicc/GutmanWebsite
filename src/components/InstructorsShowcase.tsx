import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { INSTRUCTORS, type Instructor } from "../data/instructorsData";
import InstructorBioModal, { type InstructorBio } from "./InstructorBioModal";
import SectionHeader, { AccentWord } from "./SectionHeader";
import { popupJustClosed } from "../lib/scrollLock";

/**
 * המנחים כפרופילים עגולים ממורכזים: תמונה, שם ותפקיד מתחתיה. הכל לחיץ,
 * והביוגרפיה המלאה נפתחת בפופאפ במקום להעמיס את הסקשן.
 */
export const InstructorAvatar = ({
  instructor,
  bio,
  onOpen,
  size = "lg",
}: {
  instructor: Instructor;
  bio: string;
  onOpen: (value: InstructorBio) => void;
  size?: "lg" | "md";
}) => {
  const reduced = useReducedMotion();
  const dimension = size === "lg" ? "h-40 w-40 sm:h-48 sm:w-48" : "h-32 w-32 sm:h-36 sm:w-36";

  return (
    <motion.button
      type="button"
      className="group flex flex-col items-center text-center focus:outline-none"
      onClick={() => !popupJustClosed() && onOpen({ instructor, bio })}
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      aria-label={`${instructor.name}, ${instructor.role}. לצפייה בפרופיל`}
    >
      <span className="relative block">
        {/* טבעת ורודה שנדלקת בהובר, ומרמזת שאפשר ללחוץ */}
        <span
          className="pointer-events-none absolute -inset-1.5 rounded-full border border-brand/0 transition-colors duration-300 group-hover:border-brand/60 group-focus-visible:border-brand/60"
          aria-hidden
        />
        <img
          src={instructor.image}
          alt={instructor.name}
          className={`${dimension} rounded-full object-cover object-center ring-1 ring-white/15 transition-[filter] duration-500 group-hover:brightness-110`}
          loading="lazy"
          draggable={false}
        />
      </span>

      <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-bone sm:text-[1.4rem]">
        {instructor.name}
      </h3>
      <p className="mt-1.5 text-sm font-medium text-brand">{instructor.role}</p>
      <span className="mt-3 text-xs text-bone/35 transition-colors duration-300 group-hover:text-bone/70">
        לצפייה בפרופיל
      </span>
    </motion.button>
  );
};

const InstructorsShowcase = () => {
  const [bio, setBio] = useState<InstructorBio>(null);

  return (
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="container-site">
        <SectionHeader
          kicker="הצוות"
          title={
            <>
              המנחים שמובילים את <AccentWord>הסדנאות</AccentWord>
            </>
          }
          sub="צוות קטן, ליווי צמוד, וסטנדרט גבוה. לחצו על מנחה כדי לקרוא עליו."
          center
        />

        <div className="mt-14 flex flex-wrap items-start justify-center gap-x-14 gap-y-14 sm:gap-x-20">
          {INSTRUCTORS.filter((i) => i.published !== false).map((instructor) => (
            <InstructorAvatar
              key={instructor.id}
              instructor={instructor}
              bio={instructor.trackBios.general ?? instructor.bio}
              onOpen={setBio}
            />
          ))}
        </div>
      </div>

      <InstructorBioModal value={bio} onClose={() => setBio(null)} />
    </section>
  );
};

export default InstructorsShowcase;
