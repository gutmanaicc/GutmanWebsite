import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { COURSES, type Course } from "../data/courses";
import { ArrowIcon } from "./icons";

const VISUAL_DOT: Record<Course["visual"], string> = {
  social: "bg-brand",
  students: "bg-sky-400",
  video: "bg-violet-400",
  business: "bg-ink",
  landing: "bg-amber-400",
};

type Props = {
  linkClassName: (args: { isActive: boolean }) => string;
};

/**
 * "מסלולים" nav: click → /courses; hover → course dropdown with exit delay.
 */
const CoursesNavDropdown = ({ linkClassName }: Props) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    // Slight delay so the pointer can move into the panel without it vanishing
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocusCapture={handleEnter}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) handleLeave();
      }}
    >
      <NavLink
        to="/courses"
        className={({ isActive }) => `${linkClassName({ isActive })} gap-1`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>מסלולים</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className={`opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavLink>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="רשימת מסלולים"
            dir="rtl"
            className="absolute top-full right-1/2 z-[60] pt-3 translate-x-1/2"
            initial={reduced ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-line/80 bg-white/95 p-2 shadow-xl shadow-ink/10 backdrop-blur-md">
              <ul className="flex flex-col gap-0.5">
                {COURSES.map((course) => (
                  <li key={course.slug}>
                    <Link
                      role="menuitem"
                      to={`/courses/${course.slug}`}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                      onClick={() => setOpen(false)}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${VISUAL_DOT[course.visual]}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink group-hover:text-ink">
                          {course.shortTitle}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{course.category}</span>
                      </span>
                      <span className="mt-1 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden>
                        <ArrowIcon size={14} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-1 border-t border-line px-1 pt-1">
                <Link
                  to="/courses"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                  onClick={() => setOpen(false)}
                >
                  כל המסלולים
                  <ArrowIcon size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursesNavDropdown;
