import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAV_TRACKS } from "../data/navTracks";
import { ArrowIcon } from "./icons";

const DOT: Record<string, string> = {
  "social-media-ai": "bg-[#FF2D85]",
  "ai-for-students": "bg-sky-400",
  "ai-video-content": "bg-violet-400",
  "ai-business-systems": "bg-[#191919]",
  "business-crm": "bg-[#191919]",
  "business-payments": "bg-[#191919]",
  "business-landing-page": "bg-amber-400",
};

type Props = {
  linkClassName: (args: { isActive: boolean }) => string;
};

/**
 * Desktop "מסלולים" hover menu with nested business sub-tracks.
 */
const CoursesNavDropdown = ({ linkClassName }: Props) => {
  const [open, setOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
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
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setBusinessOpen(false);
    }, 180);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setBusinessOpen(false);
      }
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
            <div className="w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-line/80 bg-white/95 p-2 shadow-xl shadow-ink/10 backdrop-blur-md">
              <ul className="flex flex-col gap-0.5">
                {NAV_TRACKS.map((track) => {
                  const hasChildren = Boolean(track.children?.length);
                  return (
                    <li key={track.slug}>
                      {hasChildren ? (
                        <div>
                          <div className="flex items-stretch gap-0.5">
                            <Link
                              role="menuitem"
                              to={track.href}
                              className="group flex min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                              onClick={() => setOpen(false)}
                            >
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[track.slug] ?? "bg-ink"}`}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-ink">{track.label}</span>
                                <span className="mt-0.5 block text-xs text-muted">3 מסלולי משנה</span>
                              </span>
                            </Link>
                            <button
                              type="button"
                              className="inline-flex min-h-11 min-w-10 items-center justify-center rounded-xl text-muted hover:bg-[#F4F4F2] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/40"
                              aria-expanded={businessOpen}
                              aria-label={businessOpen ? "סגירת מסלולי משנה" : "פתיחת מסלולי משנה"}
                              onClick={() => setBusinessOpen((o) => !o)}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                className={`transition-transform duration-200 ${businessOpen ? "rotate-180" : ""}`}
                                aria-hidden
                              >
                                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {businessOpen && (
                              <motion.ul
                                className="mb-1 mr-3 space-y-0.5 border-r-2 border-[#FF2D85]/35 pr-2"
                                initial={reduced ? false : { height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={reduced ? undefined : { height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                style={{ overflow: "hidden" }}
                              >
                                {track.children!.map((child) => (
                                  <li key={child.slug}>
                                    <Link
                                      role="menuitem"
                                      to={child.href}
                                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-right text-[13px] font-medium text-ink transition-colors hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                                      onClick={() => setOpen(false)}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[child.slug] ?? "bg-ink"}`}
                                        aria-hidden
                                      />
                                      {child.label}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          role="menuitem"
                          to={track.href}
                          className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                          onClick={() => setOpen(false)}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[track.slug] ?? "bg-ink"}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-ink">{track.label}</span>
                          </span>
                          <span className="mt-1 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden>
                            <ArrowIcon size={14} />
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-1 border-t border-line px-1 pt-1">
                <Link
                  to="/courses"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#F4F4F2]"
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
