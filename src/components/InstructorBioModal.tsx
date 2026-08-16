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
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
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
        className="relative flex max-h-[82vh] w-full max-w-[22rem] flex-col overflow-hidden rounded-[1.5rem] bg-[#141318] text-bone ring-1 ring-white/10 shadow-float"
        initial={reduced ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 31 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 bg-canvas px-6 pb-6 pt-7 text-center text-bone">
          <button
            type="button"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-bone/60 transition-colors duration-200 hover:border-white/45 hover:text-bone"
            onClick={onClose}
            aria-label="סגירה"
          >
            <XIcon />
          </button>

          <img
            src={value.instructor.image}
            alt={value.instructor.name}
            className="mx-auto h-24 w-24 rounded-full object-cover object-center ring-2 ring-brand/40"
          />
          <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
            {value.instructor.name}
          </h2>
          <p className="mt-1 text-[13px] font-medium text-brand">{value.instructor.role}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-7 pt-6" data-lenis-prevent>
          <p className="text-[14px] leading-relaxed text-bone/70">{value.bio}</p>

          {value.instructor.credentials?.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
              {value.instructor.credentials.map((credential) => (
                <li key={credential} className="flex gap-2.5 text-sm leading-relaxed text-bone/60">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                  {credential}
                </li>
              ))}
            </ul>
          )}

        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default InstructorBioModal;
