import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { Consent } from "./Consent";
import AccessibilityMenu from "./AccessibilityMenu";
import RegisterModal from "./RegisterModal";
import { ParallaxGridCanvas } from "./motion";
import { REGISTRATION_FORM_ID, scrollToRegistrationForm } from "../lib/registration";

const ScrollManager = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash === `#${REGISTRATION_FORM_ID}` || hash === "#lead-form") {
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

/** מעבר עמוד עדין: העמוד הנכנס עולה ומתבהר, היוצא נמוג מהר. */
const PageTransition = () => {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();

  if (reduced) return <Outlet />;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeIn" } }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};

const Layout = () => (
  <div className="relative min-h-screen bg-canvas">
    <ParallaxGridCanvas />
    {/* קווי עמודות דקיקים לאורך כל העמוד, בסגנון orbix */}
    <div className="page-lines pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden />
    <div className="relative z-[1]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        דילוג לתוכן המרכזי
      </a>
      <ScrollManager />
      <Header />
      <main id="main-content">
        <PageTransition />
      </main>
      <Footer />
    </div>
    <RegisterModal />
    <Consent />
    <AccessibilityMenu />
  </div>
);

export default Layout;
