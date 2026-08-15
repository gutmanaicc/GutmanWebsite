import { useEffect, useState, type ReactNode } from "react";
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
  /** Opens registration (scroll to form on-page, else modal) */
  action?: "register";
  /** Desktop hover dropdown of courses */
  coursesMenu?: boolean;
  /** Superscript proof count rendered next to the label */
  count?: string;
};

const NAV: NavItem[] = [
  { to: "/", label: "ראשי", end: true },
  { to: "/courses", label: "מסלולים", coursesMenu: true },
  { to: "/reviews", label: "ביקורות", count: "100+" },
  { to: "/about", label: "אודות" },
  { label: "הרשמה", action: "register" },
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { openRegisterModal, openRegister } = useRegisterModal();

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

  const handleRegister = () => {
    setOpen(false);
    openRegister({ leadSource: "nav-register", preferScroll: true });
  };

  const renderNavLink = (item: NavItem, mobile = false): ReactNode => {
    if (item.action === "register") {
      return (
        <button
          key="register"
          type="button"
          className={
            mobile
              ? "block w-full rounded-full px-4 py-3 text-right text-base font-medium text-bone/70 hover:bg-white/10 hover:text-bone"
              : navLinkClass({ isActive: false })
          }
          onClick={handleRegister}
        >
          <NavLabel label={item.label} count={item.count} />
        </button>
      );
    }

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
        className={`sticky top-0 z-50 w-full border-b bg-canvas/95 backdrop-blur-sm transition-[border-color] duration-300 ${
          scrolled ? "border-white/10" : "border-transparent"
        }`}
      >

        <div
          className="relative flex h-[4.25rem] w-full items-center px-5 sm:px-8 lg:px-12 xl:px-16"
          dir="rtl"
        >
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link
              to="/"
              className="inline-flex items-center transition-opacity hover:opacity-90 active:scale-[0.98]"
              aria-label="Gutman Academy, לעמוד הראשי"
            >
              <Logo height={36} className="max-h-9 w-auto sm:max-h-10" />
            </Link>
          </div>

          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex lg:gap-2"
            aria-label="ניווט ראשי"
          >
            {NAV.map((item) => renderNavLink(item))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5">
            <Pressable
              type="button"
              className="navbar-lead-cta inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-bone px-4 text-sm font-medium text-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white sm:min-h-11 sm:px-5"
              onClick={() => openRegisterModal({ leadSource: "navbar-cta" })}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="סגירת תפריט"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="fixed inset-x-4 top-[5.25rem] z-50 max-h-[min(78vh,720px)] overflow-y-auto rounded-2xl border border-white/12 bg-[#141416]/95 p-3 shadow-float backdrop-blur-md md:hidden"
            aria-label="ניווט מובייל"
            dir="rtl"
          >
            <div className="flex flex-col gap-1">
              {NAV.map((item) => renderNavLink(item, true))}
            </div>
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
          </nav>
        </>
      )}
    </>
  );
};

export default Header;
