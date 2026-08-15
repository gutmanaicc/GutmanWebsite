import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import RegisterForm from "./RegisterForm";
import { useRegisterModal } from "../context/RegisterModalContext";
import { XIcon } from "./icons";

const RegisterModal = () => {
  const { isOpen, closeRegisterModal, options } = useRegisterModal();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
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
            className="absolute inset-0 z-0 bg-ink/50 backdrop-blur-sm"
            aria-label="סגירת טופס"
            onClick={closeRegisterModal}
          />

          <motion.div
            ref={panelRef}
            key="register-modal-panel"
            className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.75rem] bg-paper text-ink shadow-float sm:max-h-[90vh] sm:rounded-[1.75rem]"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* כותרת על רצועה כהה - הופכת את המודאל לחלק מהשפה של האתר */}
            <div className="relative shrink-0 bg-canvas px-6 pb-7 pt-7 text-bone sm:px-9 sm:pb-8 sm:pt-8">
              <button
                type="button"
                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-bone/60 transition-colors duration-200 hover:border-white/45 hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-bone"
                onClick={closeRegisterModal}
                aria-label="סגירת טופס"
              >
                <XIcon />
              </button>

              <span className="section-label mb-4 flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                הרשמה
              </span>
              <h2 id={titleId} className="font-serif text-[1.6rem] font-medium leading-tight tracking-tight sm:text-3xl">
                רוצים שנשמור לכם מקום?
              </h2>
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-bone/55">
                מלאו פרטים קצרים. נחזור אליכם עם כל המידע על המסלול, בלי התחייבות ובלי ספאם.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-7 sm:px-9 sm:pb-9">
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
