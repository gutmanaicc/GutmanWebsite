import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LEAD_TRACKS } from "../data/courses";
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

const UNSURE_OPTION = { value: "unsure", label: "עדיין מתלבט/ת, אשמח להכוונה" } as const;

const TRACK_OPTIONS = [
  ...LEAD_TRACKS.map((t) => ({ value: t.slug, label: t.label })),
  UNSURE_OPTION,
];

const EXPERIENCE_OPTIONS = [
  { value: "none", label: "עוד לא התנסיתי" },
  { value: "basic", label: "משתמש/ת מדי פעם" },
  { value: "regular", label: "משתמש/ת באופן קבוע" },
  { value: "advanced", label: "מתקדם/ת, בונה תהליכים בעצמי" },
] as const;

type SelectOption = { value: string; label: string };

/**
 * Pinned listbox - relative wrapper + absolute top-full menu so modal scroll
 * cannot detach the options list on mobile (430×932).
 */
const PinnedSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  invalid?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;
  const selectedLabel = options.find((o) => o.value === value)?.label;
  const label = selectedLabel || placeholder;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-right text-sm text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-[#FF2D85]/50 focus-visible:ring-2 focus-visible:ring-[#FF2D85]/25"
        style={invalid ? { borderColor: "rgb(239 68 68)" } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-ink" : "text-muted"}>{label}</span>
        <span className="text-muted" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-float"
        >
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex min-h-11 w-full items-center px-3.5 py-2.5 text-right text-sm font-medium transition-colors ${
                    selected
                      ? "bg-[#FF2D85]/10 text-[#FF2D85]"
                      : "text-ink hover:bg-[#FF2D85]/08 hover:text-[#FF2D85] focus-visible:bg-[#FF2D85]/10 focus-visible:text-[#FF2D85]"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
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
            <PinnedSelect
              id={field("course")}
              value={values.courseInterest}
              options={TRACK_OPTIONS}
              placeholder="בחרו מסלול..."
              invalid={!!errors.courseInterest}
              onChange={(slug) => {
                setValues((v) => ({ ...v, courseInterest: slug }));
                setErrors((e) => ({ ...e, courseInterest: undefined }));
              }}
            />
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
              <PinnedSelect
                id={field("exp")}
                value={values.experienceLevel}
                options={EXPERIENCE_OPTIONS}
                placeholder="בחרו רמה..."
                onChange={(level) => setValues((v) => ({ ...v, experienceLevel: level }))}
              />
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
