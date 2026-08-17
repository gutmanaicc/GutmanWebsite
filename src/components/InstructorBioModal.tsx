import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { XIcon } from "./icons";
import { markPopupClosed, useScrollLock } from "../lib/scrollLock";
import type { Instructor } from "../data/instructorsData";

export type InstructorBio = { instructor: Instructor; bio: string } | null;

/**
 * פרופיל המנחה בפופאפ: בועה שצפה במרכז המסך, בכל גודל מסך.
 *
 * הגרסה הקודמת נפתחה במובייל כמגירה נעוצה לתחתית, ובפלטה בהירה על אתר
 * כהה - מה שיצר שבר חד באמצע הכרטיס. כאן הכל על משטח כהה אחד, עם הילה
 * ורודה רכה מאחורי הפורטרט שנותנת לו עומק ומושכת את העין לפנים.
 */
const InstructorBioModal = ({ value, onClose }: { value: InstructorBio; onClose: () => void }) => {
  const reduced = useReducedMotion();
  const open = Boolean(value);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** סגירה בלחיצה מחוץ לפאנל, עם חסם קצר שמונע פתיחה מחדש מאותה לחיצה */
  const closeFromBackdrop = () => {
    markPopupClosed();
    onClose();
  };

  if (!open || !value) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onPointerDown={closeFromBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={value.instructor.name}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" aria-hidden />

      <motion.div
        className="relative flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#141318] text-bone shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        /* קופצת פנימה מהמרכז ולא נדחפת מלמטה - זו התחושה של בועה */
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 px-6 pb-7 pt-9 text-center sm:px-8">
          {/* הילה ורודה רכה מאחורי הפורטרט, נותנת עומק ומובילה את העין פנימה */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                "radial-gradient(70% 100% at 50% 0%, rgba(255,45,133,0.22) 0%, rgba(255,45,133,0.06) 45%, rgba(255,45,133,0) 100%)",
            }}
            aria-hidden
          />

          <button
            type="button"
            className="absolute left-4 top-4 z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-bone/60 transition-colors duration-200 hover:border-white/40 hover:text-bone"
            onClick={onClose}
            aria-label="סגירה"
          >
            <XIcon />
          </button>

          <div className="relative mx-auto w-fit">
            {/* טבעת זוהרת סביב הפורטרט */}
            <span
              className="pointer-events-none absolute -inset-2 rounded-full bg-brand/20 blur-xl"
              aria-hidden
            />
            <img
              src={value.instructor.image}
              alt={value.instructor.name}
              className="relative h-32 w-32 rounded-full object-cover object-center ring-2 ring-brand/50 sm:h-36 sm:w-36"
            />
          </div>

          <h2 className="relative mt-5 font-display text-[1.6rem] font-bold leading-tight tracking-tight sm:text-[1.75rem]">
            {value.instructor.name}
          </h2>
          <p className="relative mt-2 text-sm font-medium text-brand">{value.instructor.role}</p>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-1 sm:px-8"
          data-lenis-prevent
        >
          <p className="text-[15px] leading-relaxed text-bone/65">{value.bio}</p>

          {value.instructor.credentials?.length > 0 && (
            <ul className="mt-6 space-y-3 border-t border-white/10 pt-6">
              {value.instructor.credentials.map((credential) => (
                <li key={credential} className="flex gap-3 text-sm leading-relaxed text-bone/60">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {credential}
                </li>
              ))}
            </ul>
          )}

          {value.instructor.roleTags?.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {value.instructor.roleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-bone/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default InstructorBioModal;
