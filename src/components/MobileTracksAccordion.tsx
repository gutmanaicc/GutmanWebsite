import { useId, useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAV_TRACKS, type NavTrack } from "../data/navTracks";

type Props = {
  onNavigate: () => void;
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    className={`shrink-0 text-bone/50 transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
    aria-hidden
  >
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Nested mobile accordion: מסלולים → 4 tracks → business sub-tracks.
 * Touch targets ≥44px; keyboard + aria-expanded.
 */
const MobileTracksAccordion = ({ onNavigate }: Props) => {
  const reduced = useReducedMotion();
  const baseId = useId();
  const [tracksOpen, setTracksOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);

  const panelId = `${baseId}-tracks`;
  const businessPanelId = `${baseId}-business`;

  const renderLeaf = (href: string, label: string, nested = false) => (
    <NavLink
      to={href}
      className={({ isActive }) =>
        [
          "flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition-colors",
          nested ? "pr-6 text-[13px]" : "text-sm",
          isActive ? "bg-[#FF2D85]/15 text-bone" : "text-bone/70 hover:bg-white/10 hover:text-bone",
        ].join(" ")
      }
      onClick={onNavigate}
    >
      {label}
    </NavLink>
  );

  const renderTrack = (track: NavTrack) => {
    if (!track.children?.length) {
      return <li key={track.slug}>{renderLeaf(track.href, track.label)}</li>;
    }

    return (
      <li key={track.slug} className="rounded-xl">
        <div className="flex min-h-11 items-stretch gap-0.5">
          <NavLink
            to={track.href}
            className={({ isActive }) =>
              [
                "flex min-h-11 flex-1 items-center rounded-xl px-4 text-sm font-medium transition-colors",
                isActive ? "bg-[#FF2D85]/15 text-bone" : "text-bone/70 hover:bg-white/10 hover:text-bone",
              ].join(" ")
            }
            onClick={onNavigate}
          >
            {track.label}
          </NavLink>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-bone/70 hover:bg-white/10 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/40"
            aria-expanded={businessOpen}
            aria-controls={businessPanelId}
            aria-label={businessOpen ? "סגירת מסלולי משנה" : "פתיחת מסלולי משנה"}
            onClick={() => setBusinessOpen((o) => !o)}
          >
            <Chevron open={businessOpen} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {businessOpen && (
            <motion.ul
              id={businessPanelId}
              role="region"
              aria-label={`מסלולי משנה: ${track.label}`}
              className="mt-0.5 space-y-0.5 border-r-2 border-[#FF2D85]/35 pr-2 mr-3"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              {track.children.map((child) => (
                <li key={child.slug}>{renderLeaf(child.href, child.label, true)}</li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  };

  return (
    <div className="rounded-2xl">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between rounded-full px-4 py-3 text-right text-base font-medium text-bone/70 transition-colors hover:bg-white/10 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/40"
        aria-expanded={tracksOpen}
        aria-controls={panelId}
        onClick={() => setTracksOpen((o) => !o)}
      >
        <span>מסלולים</span>
        <Chevron open={tracksOpen} />
      </button>

      <AnimatePresence initial={false}>
        {tracksOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-label="רשימת מסלולים"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <ul className="mt-1 space-y-0.5 rounded-2xl bg-white/[0.04] p-1.5">{NAV_TRACKS.map(renderTrack)}</ul>
            <NavLink
              to="/courses"
              className="mt-1 flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[#FF2D85] hover:bg-[#FF2D85]/10"
              onClick={onNavigate}
            >
              כל המסלולים
            </NavLink>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileTracksAccordion;
