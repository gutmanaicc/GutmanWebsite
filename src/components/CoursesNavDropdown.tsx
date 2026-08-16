import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAV_TRACKS } from "../data/navTracks";
import { UPCOMING_COURSES } from "../data/upcomingCourses";
import { ArrowIcon } from "./icons";

type Props = {
  linkClassName: (args: { isActive: boolean }) => string;
};

/**
 * תפריט הסדנאות בניווט. כהה כמו האתר עצמו, כל שורה עם מספר סידורי
 * וחץ שנשלף בהובר, ואחריה רשימת הסדנאות שבקרוב כטקסט עמום. בלי
 * נקודות צבע - הוורוד הוא ההדגשה היחידה.
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
            aria-label="רשימת סדנאות"
            dir="rtl"
            className="absolute right-1/2 top-full z-[60] translate-x-1/2 pt-3"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-[min(92vw,380px)] overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#141416]/97 shadow-float backdrop-blur-xl">
              <div className="px-5 pb-2 pt-5">
                <span className="section-label text-bone">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  פתוח להרשמה
                </span>
              </div>

              <ul className="px-2 pb-2">
                {NAV_TRACKS.map((track, i) => (
                  <li key={track.slug}>
                    <Link
                      role="menuitem"
                      to={track.href}
                      className="group flex items-center gap-3.5 rounded-xl px-3 py-3 text-right transition-colors duration-200 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      onClick={() => setOpen(false)}
                    >
                      <span
                        className="w-5 shrink-0 text-[11px] font-medium text-bone/25 transition-colors duration-200 group-hover:text-brand"
                        dir="ltr"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium text-bone/80 transition-colors duration-200 group-hover:text-bone">
                        {track.label}
                      </span>
                      <span
                        className="shrink-0 -translate-x-1 text-brand opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden
                      >
                        <ArrowIcon size={14} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* הסדנאות שבקרוב, כרמז שקט שמייצר ציפייה */}
              <div className="border-t border-white/10 px-5 py-4">
                <span className="mb-2.5 block text-[10px] font-bold tracking-[0.2em] text-[#d61f2c]">
                  בקרוב
                </span>
                <p className="text-[13px] leading-relaxed text-bone/40">
                  {UPCOMING_COURSES.map((c) => c.title).join(" · ")}
                </p>
              </div>

              <Link
                to="/courses"
                className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-bone transition-colors duration-200 hover:bg-white/[0.08]"
                onClick={() => setOpen(false)}
              >
                לכל הסדנאות
                <ArrowIcon size={15} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursesNavDropdown;
