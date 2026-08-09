import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
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

const HDR_H = 70; // גובה .hdr-inner. משמש לרצועת הזיהוי של סקשן כהה

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [onDark, setOnDark] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // הכותרת נסוגה בגלילה למטה וחוזרת בגלילה למעלה.
  // קריאות ה-scroll מרוכזות ב-rAF אחד כדי לא להעיר את הדפדפן פעמיים לפריים.
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y < 120) {
        // ליד ראש העמוד הכותרת תמיד גלויה
        setPinned(true);
      } else if (Math.abs(y - last) > 6) {
        // סף של 6px מונע ריצוד על תזוזות זעירות ועל gutter bounce
        setPinned(y < last);
      }
      last = y;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // היפוך הכותרת מעל סקשנים כהים.
  // רצועת זיהוי בגובה הכותרת בראש ה-viewport, דרך IntersectionObserver,
  // כדי לא לקרוא גאומטריה בכל פריים של גלילה.
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('[data-surface="dark"]'));
    if (!targets.length) {
      setOnDark(false);
      return;
    }

    let io: IntersectionObserver | null = null;
    const inBand = new Set<Element>();

    const build = () => {
      io?.disconnect();
      inBand.clear();
      const bottom = -Math.max(0, window.innerHeight - HDR_H);
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) inBand.add(e.target);
            else inBand.delete(e.target);
          }
          setOnDark(inBand.size > 0);
        },
        { rootMargin: `0px 0px ${bottom}px 0px`, threshold: 0 }
      );
      targets.forEach((t) => io!.observe(t));
    };

    build();
    window.addEventListener("resize", build);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", build);
    };
  }, [location.pathname]);

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
      <header
        className={`hdr${scrolled ? " scrolled" : ""}${open ? " menu-open" : ""}`}
        data-pinned={open ? "true" : String(pinned)}
        data-surface={!open && onDark ? "dark" : "light"}
      >
        <div className="container hdr-inner">
          <Link to="/" className="hdr-logo" aria-label="Gutman Academy, לעמוד הראשי">
            {/* ה-wordmark הוורוד נשאר זהה על נייר ועל דיו — הוא קריא על שניהם.
                logo-white.png הוא נכס אחר (לוגו מרובע עם תגית) ולא תחליף לו */}
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
  const { pathname } = useLocation();

  // מצב "אתר": קנבס כהה. דף ה-Teaser (מחוץ ל-Layout) מנהל את הרקע של עצמו
  useEffect(() => {
    document.body.dataset.theme = "site";
    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  // גלילה אינרציאלית חלקה (Lenis), כמו ב-orbix. כבויה תחת reduced-motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    let raf = 0;
    const tick = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // הזרקור שעוקב אחרי הסמן, מדף ה-Teaser. הקואורדינטות נכתבות כמשתני CSS
  // בתוך rAF אחד, כך שתנועת עכבר מהירה לא מייצרת יותר מעדכון אחד לפריים.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let y = 0;
    let queued = false;

    const paint = () => {
      queued = false;
      document.documentElement.style.setProperty("--mx", `${x}px`);
      document.documentElement.style.setProperty("--my", `${y}px`);
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="site">
      <a href="#main-content" className="skip-link">דילוג לתוכן המרכזי</a>
      {/* שכבות אווירה, דקורטיביות בלבד */}
      <div className="atmos" aria-hidden="true">
        <div className="atmos__grid" />
        <div className="atmos__glow" />
        <div className="atmos__spot" />
        <div className="atmos__vignette" />
      </div>
      <ScrollManager />
      <Header />
      {/* פס התקדמות גלילה. מונע מ-animation-timeline, בלי מאזין scroll */}
      <div className="scroll-progress" aria-hidden="true" />
      <main id="main-content">
        {/* המפתח לפי הנתיב מרנדר מחדש בכל מעבר עמוד, וכך גם מפעיל
            את אנימציית הכניסה וגם מאפס את מצבי החשיפה של העמוד החדש */}
        <div className="route-fade" key={pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <Consent />
      <AccessibilityWidget />
    </div>
  );
};

export default Layout;
