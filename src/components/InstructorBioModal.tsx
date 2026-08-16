import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { XIcon } from "./icons";
import { markPopupClosed, useScrollLock } from "../lib/scrollLock";
import type { Instructor } from "../data/instructorsData";

export type InstructorBio = { instructor: Instructor; bio: string } | null;

/** פרופיל המנחה בפופאפ: תמונה עגולה, שם, תפקיד, ביוגרפיה והישגים. */
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
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onPointerDown={closeFromBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={value.instructor.name}
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" aria-hidden />

      <motion.div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-paper text-ink shadow-float sm:rounded-[1.75rem]"
        initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 31 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 bg-canvas px-6 pb-8 pt-8 text-center text-bone sm:px-9">
          <button
            type="button"
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-bone/60 transition-colors duration-200 hover:border-white/45 hover:text-bone"
            onClick={onClose}
            aria-label="סגירה"
          >
            <XIcon />
          </button>

          <img
            src={value.instructor.image}
            alt={value.instructor.name}
            className="mx-auto h-28 w-28 rounded-full object-cover object-center ring-2 ring-brand/40 sm:h-32 sm:w-32"
          />
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
            {value.instructor.name}
          </h2>
          <p className="mt-1.5 text-sm font-medium text-brand">{value.instructor.role}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-7 sm:px-9" data-lenis-prevent>
          <p className="text-[15px] leading-relaxed text-ink/70 sm:text-base">{value.bio}</p>

          {value.instructor.credentials?.length > 0 && (
            <ul className="mt-6 space-y-2.5 border-t border-ink/10 pt-6">
              {value.instructor.credentials.map((credential) => (
                <li key={credential} className="flex gap-2.5 text-sm leading-relaxed text-ink/60">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                  {credential}
                </li>
              ))}
            </ul>
          )}

          {value.instructor.roleTags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {value.instructor.roleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-ink/15 px-3.5 py-1 text-xs font-medium text-ink/60"
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
