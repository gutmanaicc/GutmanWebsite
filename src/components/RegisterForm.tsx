import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE } from "../data/site";
import { collectUtm, saveLeadTicket, submitLead } from "../lib/leads";
import Pressable from "./Pressable";

/**
 * השלב הראשון בהרשמה: שם, טלפון, אימייל.
 *
 * הטופס ביקש קודם גם תחום עיסוק, מטרה, רמת ניסיון ובחירת מסלול. כל
 * שדה נוסף הוא עוד סיבה לנטוש, והשדות האלה שירתו את השיחה שאחרי ולא
 * את ההחלטה להשאיר פרטים. הם עברו לעמוד התודה, אחרי ההמרה, כשהמחיר
 * של ויתור עליהם הוא כבר לא ליד שאבד.
 *
 * מה שידוע בלי לשאול נשלח בשקט: המסלול מגיע מהעמוד או מהכפתור שנלחץ,
 * והמטרה מגיעה מהמנחה בצ'אט. אין טעם לבקש שוב מידע שכבר בידינו.
 */

export type RegisterFormProps = {
  /** Pre-select a course in the dropdown (slug) */
  preselectedCourse?: string;
  /** נשמר לתאימות עם קריאות קיימות. הבורר כבר לא מוצג כאן בכל מקרה */
  lockCourse?: boolean;
  leadSource?: string;
  title?: string;
  sub?: string;
  initialGoal?: string;
  /** מוותר על הכרטיס, הכותרת ותת-הכותרת - המכל שמסביב כבר מספק אותם */
  headless?: boolean;
  autoFocus?: boolean;
  onSuccess?: () => void;
};

type Errors = Partial<
  Record<"fullName" | "phone" | "email" | "consent", string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) || /^972\d{8,9}$/.test(digits);
};

const RegisterForm = ({
  preselectedCourse,
  leadSource = "register-form",
  title,
  sub,
  initialGoal,
  headless = false,
  autoFocus = false,
  onSuccess,
}: RegisterFormProps) => {
  const navigate = useNavigate();
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({ fullName: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  /* הסכמה מפורשת לפני שליחה: תיעוד של רגע ההסכמה, ולא הנחה שבשתיקה */
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "error" | "success"
  >("idle");

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(
      () => nameRef.current?.focus({ preventScroll: true }),
      80,
    );
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  const set =
    (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = (): Errors => {
    const errs: Errors = {};
    if (values.fullName.trim().length < 2) errs.fullName = "נשמח לשם מלא";
    if (!isValidPhone(values.phone))
      errs.phone = "מספר טלפון ישראלי תקין, למשל 050-1234567";
    if (!EMAIL_RE.test(values.email.trim()))
      errs.email = "כתובת אימייל תקינה, למשל name@example.com";
    if (!consent) errs.consent = "צריך לאשר כדי שנוכל לחזור אליכם";
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const fullName = values.fullName.trim();
    const email = values.email.trim();
    const courseInterest = preselectedCourse ?? "";
    const goal = initialGoal?.trim() ?? "";

    setStatus("sending");
    const result = await submitLead({
      fullName,
      phone: values.phone.trim(),
      email,
      courseInterest,
      goal,
      consent,
      formType: "הרשמה",
      leadSource,
      pageUrl: window.location.href,
      referrer: document.referrer,
      utm: collectUtm(),
      submittedAt: new Date().toISOString(),
    });

    if (result.ok) {
      /*
       * הכרטיס נשמר לפני הניווט, כי עמוד התודה צריך לדעת למי ולאיזו
       * רשומה להצמיד את השלמת הפרטים. state של הראוטר לבדו נמחק ברענון.
       */
      saveLeadTicket({
        leadId: result.leadId,
        fullName,
        email,
        courseInterest,
        goal,
        leadSource,
      });
      setStatus("success");
      onSuccess?.();
      setTimeout(
        () => navigate("/thank-you", { state: { course: courseInterest } }),
        400,
      );
    } else {
      setStatus("error");
    }
  };

  const field = (name: string) => `${leadSource}-${uid}-${name}`;

  if (status === "success") {
    return (
      <div
        className={`text-center text-ink${headless ? " py-6" : " lead-form"}`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl text-brand">
          ✓
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight">
          קיבלנו. נחזור אליכם בקרוב.
        </h3>
        <p className="mt-2 text-sm text-muted">מעבירים אתכם לדף אישור...</p>
      </div>
    );
  }

  return (
    <form
      className={`text-ink${headless ? "" : " lead-form"}`}
      onSubmit={onSubmit}
      noValidate
    >
      {!headless && (
        <>
          <h3 className="text-ink">{title ?? "השאירו פרטים ונחזור אליכם"}</h3>
          <p className="form-sub">
            {sub ?? "שלושה שדות, ואנחנו חוזרים אליכם. בלי התחייבות ובלי ספאם."}
          </p>
        </>
      )}

      {status === "error" && (
        <div className="form-error-summary" role="alert">
          לא הצלחנו לשלוח את הפרטים. נסו שוב, ואם זה חוזר על עצמו התקשרו אלינו
          ל-
          <a
            href={`tel:${SITE.contact.phone.replace(/-/g, "")}`}
            dir="ltr"
            className="underline underline-offset-2"
          >
            {SITE.contact.phone}
          </a>{" "}
          או כתבו ל-
          <a
            href={`mailto:${SITE.contact.email}`}
            dir="ltr"
            className="underline underline-offset-2"
          >
            {SITE.contact.email}
          </a>
          .
        </div>
      )}

      <div className={headless ? "space-y-5" : "mt-6 space-y-5"}>
        {/* שם וטלפון בשורה אחת, אימייל ברוחב מלא מתחת. אימייל לבד בחצי
            שורה היה משאיר חצי ריק בולט בדסקטופ אחרי שהשדות התקצרו */}
        <div className="form-row">
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
            <label htmlFor={field("phone")}>טלפון *</label>
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

        {/*
          תיבת הסכמה מעל כפתור השליחה, במקום משפט משפטי קטן מתחתיו.
          הסימון הוא הפעולה שמתעדת את ההסכמה, והוא גם נשלח ל-CRM.
        */}
        <div className="consent-check">
          <label htmlFor={field("consent")}>
            <input
              id={field("consent")}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked)
                  setErrors((prev) => ({ ...prev, consent: undefined }));
              }}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={
                errors.consent ? `${field("consent")}-err` : undefined
              }
            />
            <span>
              אני מאשר/ת שתחזרו אליי לגבי הסדנאות ולקבל עדכונים על מועדים חדשים,
              בהתאם ל
              <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                מדיניות הפרטיות
              </Link>
              . אפשר להסיר את ההסכמה בכל רגע.
            </span>
          </label>
          {errors.consent && (
            <span className="err" id={`${field("consent")}-err`} role="alert">
              {errors.consent}
            </span>
          )}
        </div>

        <Pressable
          type="submit"
          className={`btn-submit${status === "sending" ? " is-sending" : ""}`}
          disabled={status === "sending"}
          motionDisabled={status === "sending"}
        >
          {status === "sending" ? "שולח..." : "השאירו פרטים"}
        </Pressable>
      </div>
    </form>
  );
};

export default RegisterForm;
