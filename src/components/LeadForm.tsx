import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATALOG } from "../data/catalog";
import { collectUtm, submitLead } from "../lib/leads";

type Props = {
  /** slug של מסלול כשהטופס יושב בדף מסלול; "unsure" בטופס הכללי */
  courseSlug?: string;
  leadSource: string;
  title?: string;
  sub?: string;
  /** ערך התחלתי לשדה המטרה (למשל מתוך שאלון ההכוונה) */
  initialGoal?: string;
};

type Errors = Partial<Record<"fullName" | "phone" | "email" | "courseInterest", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) || /^972\d{8,9}$/.test(digits);
};

const LeadForm = ({ courseSlug, leadSource, title, sub, initialGoal }: Props) => {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    occupation: "",
    courseInterest: courseSlug ?? "",
    goal: initialGoal ?? "",
    experienceLevel: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

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
    if (status === "sending") return; // מניעת שליחה כפולה
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
      navigate("/thank-you", { state: { course: values.courseInterest } });
    } else {
      setStatus("error");
    }
  };

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate data-reveal>
      <h3>{title ?? "השאירו פרטים ונחזור אליכם"}</h3>
      <p className="form-sub">
        {sub ?? "בלי התחייבות ובלי ספאם. נחזור אליכם עם כל הפרטים ונענה על כל שאלה."}
      </p>

      {status === "error" && (
        <div className="form-error-summary" role="alert">
          משהו השתבש בשליחה. נסו שוב, ואם זה חוזר על עצמו אפשר לפנות אלינו דרך עמוד יצירת הקשר.
        </div>
      )}

      <div className="form-row">
        <div className="field">
          <label htmlFor={`${leadSource}-name`}>שם מלא *</label>
          <input
            id={`${leadSource}-name`}
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={set("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? `${leadSource}-name-err` : undefined}
          />
          {errors.fullName && <span className="err" id={`${leadSource}-name-err`}>{errors.fullName}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${leadSource}-phone`}>טלפון *</label>
          <input
            id={`${leadSource}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            style={{ textAlign: "end" }}
            value={values.phone}
            onChange={set("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? `${leadSource}-phone-err` : undefined}
          />
          {errors.phone && <span className="err" id={`${leadSource}-phone-err`}>{errors.phone}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor={`${leadSource}-email`}>אימייל *</label>
          <input
            id={`${leadSource}-email`}
            type="email"
            autoComplete="email"
            dir="ltr"
            style={{ textAlign: "end" }}
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${leadSource}-email-err` : undefined}
          />
          {errors.email && <span className="err" id={`${leadSource}-email-err`}>{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${leadSource}-occupation`}>תחום עיסוק או לימודים</label>
          <input id={`${leadSource}-occupation`} type="text" value={values.occupation} onChange={set("occupation")} />
        </div>
      </div>

      {!courseSlug && (
        <div className="field">
          <label htmlFor={`${leadSource}-course`}>איזה מסלול מעניין אתכם? *</label>
          <select
            id={`${leadSource}-course`}
            value={values.courseInterest}
            onChange={set("courseInterest")}
            aria-invalid={!!errors.courseInterest}
            aria-describedby={errors.courseInterest ? `${leadSource}-course-err` : undefined}
          >
            <option value="">בחרו מסלול...</option>
            {CATALOG.map((c) => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
            <option value="unsure">עדיין מתלבט/ת, אשמח להכוונה</option>
          </select>
          {errors.courseInterest && <span className="err" id={`${leadSource}-course-err`}>{errors.courseInterest}</span>}
        </div>
      )}

      <div className="field">
        <label htmlFor={`${leadSource}-goal`}>מה הייתם רוצים להשיג?</label>
        <textarea
          id={`${leadSource}-goal`}
          value={values.goal}
          onChange={set("goal")}
          placeholder="כמה מילים על העסק, הלימודים או המטרה שלכם"
        />
      </div>

      <div className="field">
        <label htmlFor={`${leadSource}-exp`}>רמת ניסיון ב-AI</label>
        <select id={`${leadSource}-exp`} value={values.experienceLevel} onChange={set("experienceLevel")}>
          <option value="">בחרו רמה...</option>
          <option value="none">עוד לא התנסיתי</option>
          <option value="basic">משתמש/ת מדי פעם</option>
          <option value="regular">משתמש/ת באופן קבוע</option>
          <option value="advanced">מתקדם/ת, בונה תהליכים בעצמי</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={status === "sending"}>
        {status === "sending" ? "שולח..." : "השאירו לי פרטים"}
      </button>
      <p className="form-note">
        בשליחת הטופס אתם מאשרים שניצור איתכם קשר לגבי המסלול. הפרטים שלכם לא יועברו לאף גורם אחר.
      </p>
    </form>
  );
};

export default LeadForm;
