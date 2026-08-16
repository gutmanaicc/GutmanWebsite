import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import Header from "./Header";
import Footer from "./Footer";
import Preloader from "./Preloader";
import { Consent } from "./Consent";
import AccessibilityMenu from "./AccessibilityMenu";
import RegisterModal from "./RegisterModal";
import WaitlistModal from "./WaitlistModal";
import { ParallaxGridCanvas } from "./motion";
import { useMotionCapability } from "../lib/motion";
import { REGISTRATION_FORM_ID, scrollToRegistrationForm } from "../lib/registration";

/** גלילה חלקה עם אינרציה (lenis) - הבסיס של תחושת orbix. עכבר בלבד. */
const useSmoothScroll = (disabled: boolean) => {
  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    window.__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      delete window.__lenis;
      lenis.destroy();
    };
  }, [disabled]);
};

/**
 * איפוס גלילה במעבר עמוד.
 *
 * window.scrollTo לבדו לא מספיק כאן: Lenis מחזיק מיקום גלילה משלו ודוחף
 * אותו בחזרה בפריים הבא, ולכן העמוד החדש נפתח באמצע או בתחתית - וזה
 * נראה למשתמש כאילו העמוד לא נטען. מאפסים דרך Lenis כשהוא קיים, ורק
 * כגיבוי דרך החלון (מובייל, או reduced motion, שבהם Lenis לא רץ).
 *
 * force כדי שהאיפוס יעבוד גם כש-Lenis עצור בגלל פופאפ פתוח, ו-resize
 * בפריים הבא כי גובה העמוד החדש עוד לא נמדד ברגע המעבר.
 */
const resetScroll = () => {
  const lenis = window.__lenis;
  if (!lenis) {
    window.scrollTo(0, 0);
    return;
  }
  lenis.scrollTo(0, { immediate: true, force: true });
  requestAnimationFrame(() => window.__lenis?.resize());
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
    resetScroll();
  }, [pathname, hash]);
  return null;
};

/**
 * מעבר עמוד עדין: העמוד הנכנס עולה ומתבהר.
 *
 * בלי AnimatePresence בכוונה. הגרסה הקודמת השתמשה ב-mode="wait", שמעכב את
 * הרכבת העמוד החדש עד שאנימציית היציאה מסתיימת. כשמשתמש לוחץ על שני
 * לינקים ברצף מהיר, המעבר השני נכנס באמצע היציאה של הראשון, AnimatePresence
 * נתקע בין שני מצבים והעמוד החדש פשוט לא מורכב - זה מה שנראה כמו "העמוד
 * לא נטען". popLayout לא פתרון: הוא מוציא את הילד היוצא מזרימת הפריסה
 * ושובר כל AnimatePresence מקונן בתוך העמוד (הפופאפים נתקעים ב-DOM).
 *
 * ה-key על pathname מספיק: React מרכיב מחדש בכל שינוי נתיב, ולכן initial
 * מתנגן שוב. בלי אנימציית יציאה אין מצב ביניים שאפשר להיתקע בו.
 */
const PageTransition = () => {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();

  if (reduced) return <Outlet />;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Outlet />
    </motion.div>
  );
};

const Layout = () => {
  const reduced = useReducedMotion();
  /*
   * גם המתג של תפריט הנגישות עוצר את הגלילה החלקה, לא רק הגדרת מערכת
   * ההפעלה.
   *
   * useReducedMotion קורא רק את prefers-reduced-motion, ולכן מי שביקש
   * "עצירת אנימציות" בתפריט של האתר קיבל הירו סטטי אבל Lenis המשיך
   * לרוץ מתחתיו. useMotionCapability כבר יודע לקרוא את שני המקורות.
   */
  const motionLevel = useMotionCapability();
  useSmoothScroll(Boolean(reduced) || motionLevel === "static");

  return (
  <div className="relative min-h-screen bg-canvas">
    <Preloader />
    <ParallaxGridCanvas />
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
    <WaitlistModal />
    <Consent />
    <AccessibilityMenu />
  </div>
  );
};

export default Layout;
