import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/academy-logo.png";
import { COURSES } from "../data/courses";
import AccessibilityWidget from "../AccessibilityWidget";
import { Consent } from "./Consent";

const NAV = [
  { to: "/", label: "ראשי", end: true },
  { to: "/courses", label: "מסלולים" },
  { to: "/results", label: "תוצאות והמלצות" },
  { to: "/about", label: "אודות" },
  { to: "/faq", label: "שאלות נפוצות" },
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

  // סגירת תפריט מובייל במעבר עמוד ונעילת גלילה כשהוא פתוח
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
    <header className={`hdr${scrolled ? " scrolled" : ""}`}>
      <div className="container hdr-inner">
        <Link to="/" className="hdr-logo" aria-label="Gutman Academy, לעמוד הראשי">
          <img src={logo} alt="Gutman" width={128} height={30} />
          <span className="hdr-logo-sub">האקדמיה ל-AI</span>
        </Link>

        <nav className="hdr-nav" aria-label="ניווט ראשי">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
    </header>

    {/* מרונדר מחוץ ל-header: backdrop-filter על ה-header הופך אותו
        ל-containing block של position:fixed והיה מקטין את התפריט לגובה ה-header */}
    {open && (
      <nav className="mobile-nav" id="mobile-nav" aria-label="ניווט מובייל">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {item.label}
          </NavLink>
        ))}
        <Link to="/course-finder" className="btn btn-primary btn-block mobile-cta">
          מצאו את המסלול שלכם
        </Link>
      </nav>
    )}
    </>
  );
};

const Footer = () => (
  <footer className="ftr">
    <div className="container">
      <div className="ftr-grid">
        <div className="ftr-brand">
          <img src={logo} alt="Gutman" width={128} height={30} />
          <p>
            האקדמיה הפרונטלית ללימודי בינה מלאכותית. מסלולים מעשיים, מבוססי תוצרים, שמותאמים למקצוע, לעסק
            ולמטרה שלכם.
          </p>
        </div>
        <div>
          <h3>מסלולים</h3>
          <ul>
            {COURSES.map((c) => (
              <li key={c.slug}>
                <Link to={`/courses/${c.slug}`}>{c.shortTitle}</Link>
              </li>
            ))}
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
      <div className="ftr-bottom">
        <span>© GutmanAI {new Date().getFullYear()} · כל הזכויות שמורות</span>
        <span>gutmanai.com</span>
      </div>
    </div>
  </footer>
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

// הזרקור של הבמה: עוקב אחרי הסמן, ומשוטט לבד כשאין תנועה (מובייל / משתמש רגוע)
const StageEffects = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let tx = window.innerWidth * 0.7;
    let ty = window.innerHeight * 0.3;
    let x = tx;
    let y = ty;
    let lastMove = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
    };

    const tick = (now: number) => {
      if (now - lastMove > 3000) {
        const t = now / 1000;
        tx = window.innerWidth * (0.5 + 0.35 * Math.sin(t * 0.3));
        ty = window.innerHeight * (0.4 + 0.28 * Math.sin(t * 0.21 + 1.7));
      }
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
    };
  }, []);

  return (
    <>
      <div className="stage-blueprint" aria-hidden="true" />
      <div className="stage-torch" aria-hidden="true" />
      <div className="stage-vignette" aria-hidden="true" />
    </>
  );
};

const Layout = () => {
  // רקע הבמה גם מאחורי גלילת יתר; דף ה-Teaser מנהל את הרקע של עצמו
  useEffect(() => {
    document.body.dataset.theme = "site";
    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  return (
  <div className="site">
    <StageEffects />
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
