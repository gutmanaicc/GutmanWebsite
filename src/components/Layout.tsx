import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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

const Layout = () => (
  <div className="relative min-h-screen bg-canvas">
    <ParallaxGridCanvas />
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
        <Outlet />
      </main>
      <Footer />
    </div>
    <RegisterModal />
    <Consent />
    <AccessibilityMenu />
  </div>
);

export default Layout;
