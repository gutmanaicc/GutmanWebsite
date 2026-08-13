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
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-white p-5 text-ink shadow-float sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <button
              type="button"
              className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              onClick={closeRegisterModal}
              aria-label="סגירת טופס"
            >
              <XIcon />
            </button>

            <div className="relative z-10 pt-8">
              <h2 id={titleId} className="sr-only">
                טופס הרשמה והשארת פרטים
              </h2>
              <RegisterForm
                key={`modal-${options.courseId ?? "any"}-${options.leadSource ?? "register-modal"}`}
                preselectedCourse={options.courseId}
                initialGoal={options.initialGoal}
                leadSource={options.leadSource ?? "register-modal"}
                title="רוצים שנשמור לכם מקום?"
                sub="מלאו פרטים קצרים. נחזור אליכם עם כל המידע על המסלול."
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
