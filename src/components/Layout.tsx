import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Logo from "./Logo";
import Header from "./Header";
import { Consent } from "./Consent";
import AccessibilityWidget from "./AccessibilityWidget";
import RegisterModal from "./RegisterModal";
import { ParallaxGridCanvas } from "./motion";
import { COURSES } from "../data/courses";
import { SITE } from "../data/site";
import { REGISTRATION_FORM_ID, scrollToRegistrationForm } from "../lib/registration";
import { useRegisterModal } from "../context/RegisterModalContext";

const Footer = () => {
  const { openRegisterModal } = useRegisterModal();

  return (
  <footer className="bg-ink text-white">
    <div className="container-site py-14">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="white" height={28} />
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {SITE.tagline}. מסלולים מעשיים, מבוססי תוצרים, שמותאמים למקצוע, לעסק ולמטרה שלכם.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href={`mailto:${SITE.contact.email}`} className="text-white/80 hover:text-white">{SITE.contact.email}</a>
            <a href={`tel:${SITE.contact.phone.replace(/-/g, "")}`} dir="ltr" className="text-white/80 hover:text-white">{SITE.contact.phone}</a>
            <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer" className="text-brand hover:brightness-110">WhatsApp</a>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">מסלולים</h3>
          <ul className="space-y-2 text-sm text-white/70">
            {COURSES.map((c) => (
              <li key={c.slug}>
                <Link to={`/courses/${c.slug}`} className="hover:text-white">{c.shortTitle}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">קישורים</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/courses" className="hover:text-white">כל המסלולים</Link></li>
            <li><Link to="/about" className="hover:text-white">אודות</Link></li>
            <li><a href="/#finder" className="hover:text-white">עזרה בבחירת מסלול</a></li>
            <li>
              <button
                type="button"
                className="hover:text-white"
                onClick={() => openRegisterModal({ leadSource: "footer-cta" })}
              >
                השארת פרטים
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">עקבו</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href={SITE.social.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a></li>
            <li><a href={SITE.social.youtube} target="_blank" rel="noreferrer" className="hover:text-white">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
        <span>© GutmanAI {new Date().getFullYear()} · כל הזכויות שמורות</span>
        <span>gutmanai.com</span>
      </div>
    </div>
  </footer>
  );
};

const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash === `#${REGISTRATION_FORM_ID}` || hash === "#lead-form") {
      // Wait a tick so the target route has painted
      const t = window.setTimeout(() => scrollToRegistrationForm({ focus: true }), 50);
      return () => window.clearTimeout(t);
    }
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

const Layout = () => (
  <div className="relative min-h-screen bg-canvas">
    <ParallaxGridCanvas />
    <div className="relative z-[1]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        דילוג לתוכן המרכזי
      </a>
      <ScrollManager />
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
    <RegisterModal />
    <Consent />
    <AccessibilityWidget />
  </div>
);

export default Layout;
