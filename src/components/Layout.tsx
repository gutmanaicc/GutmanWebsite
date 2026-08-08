import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import logoInk from "../assets/logo-cutout.png";
import logoWhite from "../assets/logo-white.png";
import { CATALOG } from "../data/catalog";
import AccessibilityWidget from "../AccessibilityWidget";
import { Consent } from "./Consent";

const pad2 = (n: number) => String(n).padStart(2, "0");

const NAV = [
  { to: "/courses", label: "מסלולים", count: CATALOG.length },
  { to: "/results", label: "תוצאות" },
  { to: "/about", label: "אודות" },
  { to: "/faq", label: "שאלות" },
  { to: "/contact", label: "צור קשר" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // סגירת התפריט במעבר עמוד ונעילת גלילה כשהוא פתוח
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`hdr${scrolled ? " scrolled" : ""}${open ? " menu-open" : ""}`}>
        <div className="container hdr-inner">
          <Link to="/" className="hdr-logo" aria-label="Gutman Academy, לעמוד הראשי">
            <img src={logoInk} alt="Gutman" width={118} height={29} />
            <span className="hdr-logo-sub">האקדמיה ל-AI</span>
          </Link>

          <nav className="hdr-nav" aria-label="ניווט ראשי">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {item.label}
                {item.count ? <sup className="nav-count">({pad2(item.count)})</sup> : null}
              </NavLink>
            ))}
          </nav>

          <Link to="/course-finder" className="btn btn-primary btn-small hdr-cta">
            מצאו את המסלול שלכם
          </Link>

          <button
            className="hdr-burger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          >
            <span className="burger-label">{open ? "סגירה" : "תפריט"}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </header>

      {/* תפריט מובייל במסך מלא, קישורים ענקיים */}
      {open && (
        <nav className="mobile-nav" id="mobile-nav" aria-label="ניווט מובייל">
          <div className="container">
            <NavLink to="/" end className={({ isActive }) => `mnav-link${isActive ? " active" : ""}`}>
              <span className="mnav-num">(01)</span>ראשי
            </NavLink>
            {NAV.map((item, i) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `mnav-link${isActive ? " active" : ""}`}>
                <span className="mnav-num">({pad2(i + 2)})</span>
                {item.label}
                {item.count ? <sup className="nav-count">({pad2(item.count)})</sup> : null}
              </NavLink>
            ))}
            <Link to="/course-finder" className="btn btn-primary btn-block mobile-cta">
              מצאו את המסלול שלכם
            </Link>
          </div>
        </nav>
      )}
    </>
  );
};

const Footer = () => (
  <>
    <div className="ftr-curve" aria-hidden="true" />
    <footer className="ftr">
      <div className="container">
        <div className="ftr-grid">
        <div className="ftr-brand">
          <img src={logoWhite} alt="Gutman" width={140} height={74} />
          <p>
            האקדמיה הפרונטלית ללימודי בינה מלאכותית. מסלולים מעשיים, מבוססי תוצרים, שמותאמים למקצוע, לעסק
            ולמטרה שלכם.
          </p>
          <Link to="/course-finder" className="btn btn-primary btn-small">מצאו את המסלול שלכם</Link>
        </div>
        <div>
          <h3>מסלולי הדגל</h3>
          <ul>
            {CATALOG.filter((c) => c.full).map((c) => (
              <li key={c.slug}>
                <Link to={`/courses/${c.slug}`}>{c.title}</Link>
              </li>
            ))}
            <li><Link to="/courses">לכל המסלולים ({pad2(CATALOG.length)})</Link></li>
          </ul>
        </div>
        <div>
          <h3>האקדמיה</h3>
          <ul>
            <li><Link to="/about">אודות</Link></li>
            <li><Link to="/results">תוצאות והמלצות</Link></li>
            <li><Link to="/faq">שאלות נפוצות</Link></li>
            <li><Link to="/contact">צור קשר</Link></li>
            <li><Link to="/course-finder">עזרה בבחירת מסלול</Link></li>
          </ul>
        </div>
        <div>
          <h3>מידע</h3>
          <ul>
            <li><Link to="/privacy">מדיניות פרטיות</Link></li>
            <li><Link to="/terms">תנאי שימוש</Link></li>
          </ul>
        </div>
      </div>
      <div className="ftr-contact-row">
        <span className="k">כתבו לנו</span>
        <a href="mailto:gutmanaicc@gmail.com" dir="ltr">gutmanaicc@gmail.com</a>
      </div>
      <div className="ftr-bottom">
        <span>© GutmanAI {new Date().getFullYear()} · כל הזכויות שמורות</span>
        <span>gutmanai.com</span>
      </div>
    </div>
  </footer>
  </>
);

const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

const Layout = () => {
  // מצב "אתר": קנבס בהיר. דף ה-Teaser (מחוץ ל-Layout) מנהל את הרקע של עצמו
  useEffect(() => {
    document.body.dataset.theme = "site";
    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  return (
    <div className="site">
      <a href="#main-content" className="skip-link">דילוג לתוכן המרכזי</a>
      <ScrollManager />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <Consent />
      <AccessibilityWidget />
    </div>
  );
};

export default Layout;
