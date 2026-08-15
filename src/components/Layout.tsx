import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import { Consent } from "./Consent";
import AccessibilityMenu from "./AccessibilityMenu";
import RegisterModal from "./RegisterModal";
import { CursorTrail, ParallaxGridCanvas } from "./motion";
import { REGISTRATION_FORM_ID, scrollToRegistrationForm } from "../lib/registration";

/** גלילה חלקה עם אינרציה (lenis) - הבסיס של תחושת orbix. עכבר בלבד. */
const useSmoothScroll = (disabled: boolean) => {
  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [disabled]);
};

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

const Layout = () => {
  const reduced = useReducedMotion();
  useSmoothScroll(Boolean(reduced));

  return (
  <div className="relative min-h-screen bg-canvas">
    <Preloader />
    <ParallaxGridCanvas />
    <CursorTrail />
    {/* גרעין פילם - טקסטורת סטודיו מעל הכול, מתחת למודאלים */}
    <div className="film-grain pointer-events-none fixed inset-0 z-[30]" aria-hidden />
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
      <main id="main-content" className="relative z-[2]">
        <PageTransition />
      </main>
      <Footer />
    </div>
    <RegisterModal />
    <Consent />
    <AccessibilityMenu />
  </div>
  );
};

export default Layout;
