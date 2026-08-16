import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useScrollLock } from "../lib/scrollLock";
import { useWaitlistModal } from "../context/WaitlistModalContext";
import { collectUtm, submitLead } from "../lib/leads";
import { SITE } from "../data/site";
import Pressable from "./Pressable";
import { XIcon } from "./icons";

/**
 * טופס קצר להצטרפות לרשימת המתנה של סדנה שטרם נפתחה. שם הסדנה מגיע
 * מהכרטיס שממנו נלחץ הכפתור ומוצג כשדה נעול, כדי שהמשתמש יראה בדיוק
 * לאיזו רשימה הוא נרשם.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) || /^972\d{8,9}$/.test(digits);
};

type Errors = Partial<Record<"fullName" | "phone" | "email", string>>;

const WaitlistModal = () => {
  const { isOpen, target, closeWaitlist } = useWaitlistModal();
  const titleId = useId();
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  useScrollLock(isOpen);

  const [values, setValues] = useState({ fullName: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");

  /* כל פתיחה מתחילה מטופס נקי, גם אם נסגר אחרי שליחה */
  useEffect(() => {
    if (!isOpen) return;
    setValues({ fullName: "", phone: "", email: "" });
    setErrors({});
    setStatus("idle");
  }, [isOpen, target?.slug]);

  useEffect(() => {
    return () => {
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWaitlist();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 90);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [isOpen, closeWaitlist]);

  const field = (name: string) => `waitlist-${uid}-${name}`;
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || !target) return;

    const errs: Errors = {};
    if (values.fullName.trim().length < 2) errs.fullName = "נשמח לשם מלא";
    if (!isValidPhone(values.phone)) errs.phone = "מספר טלפון ישראלי תקין, למשל 050-1234567";
    if (!EMAIL_RE.test(values.email.trim())) errs.email = "כתובת אימייל תקינה, למשל name@example.com";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("sending");
    const ok = await submitLead({
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      occupation: "",
      courseInterest: target.slug,
      goal: `רשימת המתנה: ${target.title}`,
      leadSource: `waitlist-${target.slug}`,
      pageUrl: window.location.href,
      referrer: document.referrer,
      utm: collectUtm(),
      submittedAt: new Date().toISOString(),
    });
    setStatus(ok ? "success" : "error");
  };

  return (
    <AnimatePresence>
      {isOpen && target ? (
        <motion.div
          key="waitlist-root"
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 bg-ink/50 backdrop-blur-sm"
            aria-label="סגירת הטופס"
            onClick={closeWaitlist}
          />

          <motion.div
            ref={panelRef}
            /* dvh ולא vh, אותה סיבה כמו ב-RegisterModal */
            className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-paper text-ink shadow-float sm:rounded-[1.75rem]"
            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="relative shrink-0 bg-canvas px-6 pb-7 pt-7 text-bone sm:px-8">
              <button
                type="button"
                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-bone/60 transition-colors duration-200 hover:border-white/45 hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-bone"
                onClick={closeWaitlist}
                aria-label="סגירת הטופס"
              >
                <XIcon />
              </button>

              <span className="section-label mb-4 flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                בקרוב
              </span>
              <h2 id={titleId} className="font-display text-[1.45rem] font-bold leading-tight tracking-tight sm:text-2xl">
                {status === "success" ? "נרשמת לרשימת ההמתנה" : "הצטרפות לרשימת המתנה"}
              </h2>
              {status !== "success" && (
                <p className="mt-2.5 text-sm leading-relaxed text-bone/55">
                  נעדכן אתכם ברגע שההרשמה לסדנה תיפתח. בלי ספאם.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-7 sm:px-8" data-lenis-prevent>
              {status === "success" ? (
                <div className="py-2 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl text-brand">
                    ✓
                  </div>
                  <p className="text-base leading-relaxed text-ink">
                    נרשמת לרשימת ההמתנה! נעדכן אותך ברגע שההרשמה לסדנה תיפתח.
                  </p>
                  <p className="mt-2 text-sm text-muted">{target.title}</p>
                  <Pressable type="button" className="btn-submit mt-7" onClick={closeWaitlist}>
                    סגירה
                  </Pressable>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-5">
                  {status === "error" && (
                    <div className="form-error-summary" role="alert">
                      לא הצלחנו לשלוח את הפרטים. נסו שוב, ואם זה חוזר על עצמו התקשרו אלינו ל-
                      <a
                        href={`tel:${SITE.contact.phone.replace(/-/g, "")}`}
                        dir="ltr"
                        className="underline underline-offset-2"
                      >
                        {SITE.contact.phone}
                      </a>
                      .
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor={field("course")}>הסדנה</label>
                    <input
                      id={field("course")}
                      type="text"
                      value={target.title}
                      readOnly
                      tabIndex={-1}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor={field("name")}>שם מלא *</label>
                    <input
                      ref={nameRef}
                      id={field("name")}
                      type="text"
                      autoComplete="name"
                      value={values.fullName}
                      onChange={set("fullName")}
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && <span className="err">{errors.fullName}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={field("phone")}>מספר טלפון *</label>
                    <input
                      id={field("phone")}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      className="text-end"
                      value={values.phone}
                      onChange={set("phone")}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <span className="err">{errors.phone}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor={field("email")}>אימייל *</label>
                    <input
                      id={field("email")}
                      type="email"
                      autoComplete="email"
                      dir="ltr"
                      className="text-end"
                      value={values.email}
                      onChange={set("email")}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <span className="err">{errors.email}</span>}
                  </div>

                  <Pressable
                    type="submit"
                    className={`btn-submit${status === "sending" ? " is-sending" : ""}`}
                    disabled={status === "sending"}
                    motionDisabled={status === "sending"}
                  >
                    {status === "sending" ? "שולח..." : "הצטרפות לרשימת המתנה"}
                  </Pressable>
                  <p className="form-note">
                    נשתמש בפרטים כדי לעדכן אתכם על פתיחת ההרשמה לסדנה הזו בלבד.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default WaitlistModal;
