import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useScrollLock } from "../lib/scrollLock";
import RegisterForm from "./RegisterForm";
import { useRegisterModal } from "../context/RegisterModalContext";
import { XIcon } from "./icons";

const RegisterModal = () => {
  const { isOpen, closeRegisterModal, options } = useRegisterModal();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRegisterModal();
    };
    window.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLInputElement>("input[autocomplete='name'], input")?.focus();
    }, 80);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [isOpen, closeRegisterModal]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="register-modal-root"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop - separate layer so panel stays above */}
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/70 backdrop-blur-md"
            aria-label="סגירת טופס"
            onClick={closeRegisterModal}
          />

          <motion.div
            ref={panelRef}
            key="register-modal-panel"
            /*
             * בועה במרכז המסך, בכל גודל מסך, כמו הפרופיל של המנחים.
             *
             * קודם זו הייתה מגירה נעוצה לתחתית המובייל ובפלטה בהירה על אתר
             * כהה. dvh ולא vh: ב-iOS סרגל הדפדפן נכלל ב-vh, ולכן כפתור
             * השליחה נחתך מתחתיו בדיוק כשצריך ללחוץ עליו.
             */
            className="relative z-10 flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-1 text-bone shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] sm:max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            {/* הילה ורודה רכה במקום רצועה כהה, שהפכה למיותרת כשהמשטח כולו כהה */}
            <div className="relative shrink-0 px-6 pb-6 pt-7 text-bone sm:px-9 sm:pb-7 sm:pt-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-40"
                style={{
                  background:
                    "radial-gradient(70% 100% at 50% 0%, rgba(255,45,133,0.18) 0%, rgba(255,45,133,0.05) 45%, rgba(255,45,133,0) 100%)",
                }}
                aria-hidden
              />
              <button
                type="button"
                className="absolute left-4 top-4 z-[1] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-bone/60 transition-colors duration-200 hover:border-white/45 hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-bone"
                onClick={closeRegisterModal}
                aria-label="סגירת טופס"
              >
                <XIcon />
              </button>

              <span className="section-label relative mb-4 flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                הרשמה
              </span>
              <h2 id={titleId} className="relative font-display text-[1.6rem] font-bold leading-tight tracking-tight sm:text-3xl">
                רוצים שנשמור לכם מקום?
              </h2>
              <p className="relative mt-2.5 max-w-md text-sm leading-relaxed text-bone/55">
                מלאו פרטים קצרים. נחזור אליכם עם כל המידע על המסלול, בלי התחייבות ובלי ספאם.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-7 sm:px-9 sm:pb-9" data-lenis-prevent>
              <RegisterForm
                key={`modal-${options.courseId ?? "any"}-${options.leadSource ?? "register-modal"}`}
                preselectedCourse={options.courseId}
                initialGoal={options.initialGoal}
                leadSource={options.leadSource ?? "register-modal"}
                headless
                autoFocus
                onSuccess={closeRegisterModal}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default RegisterModal;
