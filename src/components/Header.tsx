import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useRegisterModal } from "../context/RegisterModalContext";
import CoursesNavDropdown from "./CoursesNavDropdown";
import MobileTracksAccordion from "./MobileTracksAccordion";
import Pressable from "./Pressable";

type NavItem = {
  to?: string;
  label: string;
  end?: boolean;
  /** Desktop hover dropdown of courses */
  coursesMenu?: boolean;
  /** Superscript proof count rendered next to the label */
  count?: string;
};

const NAV: NavItem[] = [
  { to: "/", label: "ראשי", end: true },
  { to: "/courses", label: "מסלולים", coursesMenu: true },
  { to: "/reviews", label: "ביקורות" },
  { to: "/about", label: "אודות" },
  { to: "/register", label: "הרשמה" },
];

/** לינק ניווט מערכתי: טקסט נקי עם קו תחתון שנמתח מהצד בהובר */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "group/nav relative inline-flex items-center gap-1.5 px-3 py-2 text-[15px] font-medium",
    "transition-colors duration-200 ease-out",
    "after:absolute after:bottom-0.5 after:right-3 after:left-3 after:h-px after:bg-bone",
    "after:origin-right after:transition-transform after:duration-300 after:ease-out",
    isActive
      ? "text-bone after:scale-x-100"
      : "text-bone/55 hover:text-bone after:scale-x-0 hover:after:scale-x-100",
  ].join(" ");

/** Label + orbix-style superscript count, e.g. מסלולים⁽⁵⁾ */
const NavLabel = ({ label, count }: { label: string; count?: string }) => (
  <span className="inline-flex items-start gap-0.5">
    {label}
    {count && (
      <sup className="mt-px text-[10px] font-semibold leading-none text-bone/40" dir="ltr" aria-hidden>
        ({count})
      </sup>
    )}
  </span>
);

const Header = () => {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { openRegisterModal } = useRegisterModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const renderNavLink = (item: NavItem, mobile = false): ReactNode => {
    if (!item.to) return null;

    if (item.coursesMenu && mobile) {
      return <MobileTracksAccordion key="mobile-tracks" onNavigate={() => setOpen(false)} />;
    }

    if (item.coursesMenu && !mobile) {
      return <CoursesNavDropdown key={item.to} linkClassName={navLinkClass} />;
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={
          mobile
            ? ({ isActive }) =>
                `block rounded-full px-4 py-3 text-base font-medium ${isActive ? "bg-white/10 text-bone" : "text-bone/70 hover:bg-white/10 hover:text-bone"}`
            : navLinkClass
        }
        onClick={() => mobile && setOpen(false)}
      >
        <NavLabel label={item.label} count={item.count} />
      </NavLink>
    );
  };

  return (
    <>
      <header
        className={`site-header sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled
            ? "border-white/10 bg-canvas/95 backdrop-blur-sm"
            : "border-transparent bg-transparent"
        }`}
      >

        <div
          className="relative flex h-[4.25rem] w-full items-center px-5 sm:px-8 lg:px-12 xl:px-16"
          dir="rtl"
        >
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link
              to="/"
              className="inline-flex min-h-11 shrink items-center transition-opacity hover:opacity-90 active:scale-[0.98]"
              aria-label="Gutman Academy, לעמוד הראשי"
            >
              <Logo height={36} className="max-h-7 w-auto sm:max-h-10" />
            </Link>
          </div>

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex lg:gap-2"
            aria-label="ניווט ראשי"
          >
            {NAV.map((item) => renderNavLink(item))}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-1 sm:gap-2.5">
            <Pressable
              type="button"
              className="navbar-lead-cta group/cta relative inline-flex min-h-10 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-[13px] font-semibold text-white sm:min-h-11 sm:px-5 sm:text-sm"
              onClick={() => openRegisterModal({ leadSource: "navbar-cta" })}
              rippleTone="pink"
            >
              {/* נקודה פועמת: רומזת שמישהו באמת עונה בצד השני */}
              <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                <span className="navbar-lead-cta-ping absolute inline-flex h-full w-full rounded-full bg-white/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              השאירו פרטים
            </Pressable>

            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-bone transition hover:border-white/40 sm:h-11 sm:w-11 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
            >
              <span className="relative block h-3.5 w-5" aria-hidden>
                <motion.span
                  className="absolute inset-x-0 top-0 block h-[2px] rounded-full bg-current"
                  animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.span
                  className="absolute inset-x-0 top-1/2 block h-[2px] -translate-y-1/2 rounded-full bg-current"
                  animate={open ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: reduced ? 0 : 0.25 }}
                />
                <motion.span
                  className="absolute inset-x-0 bottom-0 block h-[2px] rounded-full bg-current"
                  animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
            aria-label="סגירת תפריט"
            onClick={() => setOpen(false)}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.nav
            id="mobile-nav"
            className="fixed inset-x-4 top-[5.25rem] z-50 max-h-[min(78vh,720px)] origin-top overflow-y-auto rounded-2xl border border-white/12 bg-[#141416]/95 p-3 shadow-float backdrop-blur-md md:hidden"
            aria-label="ניווט מובייל"
            dir="rtl"
            initial={reduced ? false : { opacity: 0, y: -14, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -10, scaleY: 0.96, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
          >
            <motion.div
              className="flex flex-col gap-1"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } }}
            >
              {NAV.map((item) => (
                <motion.div
                  key={item.to ?? item.label}
                  variants={{
                    hidden: reduced ? {} : { opacity: 0, x: 22 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  {renderNavLink(item, true)}
                </motion.div>
              ))}
            </motion.div>
            <Pressable
              type="button"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#FF2D85] px-5 text-sm font-medium text-white shadow-[0_6px_18px_-6px_rgba(255,45,133,0.55)]"
              onClick={() => {
                setOpen(false);
                openRegisterModal({ leadSource: "navbar-cta" });
              }}
            >
              השאירו פרטים
            </Pressable>
          </motion.nav>
        </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
