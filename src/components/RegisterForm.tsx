import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { COURSES } from "../data/courses";
import { collectUtm, submitLead } from "../lib/leads";
import Pressable from "./Pressable";

export type RegisterFormProps = {
  /** Pre-select a course in the dropdown (slug) */
  preselectedCourse?: string;
  /** When true with preselectedCourse, hide the course dropdown */
  lockCourse?: boolean;
  leadSource?: string;
  title?: string;
  sub?: string;
  initialGoal?: string;
  compact?: boolean;
  autoFocus?: boolean;
  onSuccess?: () => void;
};

type Errors = Partial<Record<"fullName" | "phone" | "email" | "courseInterest", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) || /^972\d{8,9}$/.test(digits);
};

const RegisterForm = ({
  preselectedCourse,
  lockCourse = false,
  leadSource = "register-form",
  title,
  sub,
  initialGoal,
  compact,
  autoFocus = false,
  onSuccess,
}: RegisterFormProps) => {
  const navigate = useNavigate();
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    occupation: "",
    courseInterest: preselectedCourse ?? "",
    goal: initialGoal ?? "",
    experienceLevel: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");

  useEffect(() => {
    if (preselectedCourse) {
      setValues((v) => ({ ...v, courseInterest: preselectedCourse }));
    }
  }, [preselectedCourse]);

  useEffect(() => {
    if (initialGoal) setValues((v) => ({ ...v, goal: initialGoal }));
  }, [initialGoal]);

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = (): Errors => {
    const errs: Errors = {};
    if (values.fullName.trim().length < 2) errs.fullName = "נשמח לשם מלא";
    if (!isValidPhone(values.phone)) errs.phone = "מספר טלפון ישראלי תקין, למשל 050-1234567";
    if (!EMAIL_RE.test(values.email.trim())) errs.email = "כתובת אימייל תקינה, למשל name@example.com";
    if (!values.courseInterest) errs.courseInterest = "בחרו מסלול, או סמנו שאתם עדיין מתלבטים";
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("sending");
    const ok = await submitLead({
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      occupation: values.occupation.trim(),
      courseInterest: values.courseInterest,
      goal: values.goal.trim(),
      experienceLevel: values.experienceLevel,
      leadSource,
      pageUrl: window.location.href,
      referrer: document.referrer,
      utm: collectUtm(),
      submittedAt: new Date().toISOString(),
    });

    if (ok) {
      setStatus("success");
      onSuccess?.();
      setTimeout(() => navigate("/thank-you", { state: { course: values.courseInterest } }), 400);
    } else {
      setStatus("error");
    }
  };

  const showCourseSelect = !(lockCourse && preselectedCourse);
  const field = (name: string) => `${leadSource}-${uid}-${name}`;

  if (status === "success") {
    return (
      <div className="lead-form text-center text-ink">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">✓</div>
        <h3>קיבלנו. נחזור אליכם בקרוב.</h3>
        <p className="form-sub">מעבירים אתכם לדף אישור...</p>
      </div>
    );
  }

  return (
    <form
      className={`lead-form text-ink${compact ? " !border-0 !bg-transparent !p-0 !shadow-none" : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      <h3 className="text-ink">{title ?? "השאירו פרטים ונחזור אליכם"}</h3>
      <p className="form-sub">
        {sub ?? "בלי התחייבות ובלי ספאם. נחזור אליכם עם כל הפרטים ונענה על כל שאלה."}
      </p>

      {status === "error" && (
        <div className="form-error-summary" role="alert">
          משהו השתבש בשליחה. נסו שוב, ואם זה חוזר על עצמו אפשר לפנות אלינו בוואטסאפ.
        </div>
      )}

      <div className="mt-6 space-y-4">
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

        <div className="form-row">
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
          {!compact && (
            <div className="field">
              <label htmlFor={field("occupation")}>תחום עיסוק או לימודים</label>
              <input id={field("occupation")} type="text" value={values.occupation} onChange={set("occupation")} />
            </div>
          )}
        </div>

        {showCourseSelect && (
          <div className="field">
            <label htmlFor={field("course")}>איזה מסלול מעניין אתכם? *</label>
            <select
              id={field("course")}
              value={values.courseInterest}
              onChange={set("courseInterest")}
              aria-invalid={!!errors.courseInterest}
            >
              <option value="">בחרו מסלול...</option>
              {COURSES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.title}</option>
              ))}
              <option value="unsure">עדיין מתלבט/ת, אשמח להכוונה</option>
            </select>
            {errors.courseInterest && <span className="err">{errors.courseInterest}</span>}
          </div>
        )}

        {!compact && (
          <>
            <div className="field">
              <label htmlFor={field("goal")}>מה הייתם רוצים להשיג?</label>
              <textarea
                id={field("goal")}
                value={values.goal}
                onChange={set("goal")}
                placeholder="כמה מילים על העסק, הלימודים או המטרה שלכם"
              />
            </div>

            <div className="field">
              <label htmlFor={field("exp")}>רמת ניסיון ב-AI</label>
              <select id={field("exp")} value={values.experienceLevel} onChange={set("experienceLevel")}>
                <option value="">בחרו רמה...</option>
                <option value="none">עוד לא התנסיתי</option>
                <option value="basic">משתמש/ת מדי פעם</option>
                <option value="regular">משתמש/ת באופן קבוע</option>
                <option value="advanced">מתקדם/ת, בונה תהליכים בעצמי</option>
              </select>
            </div>
          </>
        )}

        <Pressable
          type="submit"
          className={`btn-primary btn-block${status === "sending" ? " is-sending" : ""}`}
          disabled={status === "sending"}
          motionDisabled={status === "sending"}
        >
          {status === "sending" ? "שולח..." : "השאירו לי פרטים"}
        </Pressable>
        <p className="form-note">
          בשליחת הטופס אתם מאשרים שניצור איתכם קשר לגבי המסלול. הפרטים שלכם לא יועברו לאף גורם אחר.
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
