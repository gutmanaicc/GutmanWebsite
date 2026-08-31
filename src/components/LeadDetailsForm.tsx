import { useEffect, useId, useRef, useState } from "react";
import PinnedSelect from "./PinnedSelect";
import Pressable from "./Pressable";
import {
  EXPERIENCE_OPTIONS,
  TRACK_OPTIONS,
  clearLeadTicket,
  submitLeadEnrichment,
  type LeadTicket,
} from "../lib/leads";

/**
 * השלב השני של ההרשמה, בעמוד התודה.
 *
 * הטופס באתר מבקש שם, טלפון ואימייל בלבד, וכל השאר נשאל כאן: אחרי
 * שההמרה כבר נספרה, כשהמחיר של ויתור על תשובה הוא שיחה פחות מדויקת
 * ולא ליד שלא נכנס.
 *
 * שום שדה כאן אינו חובה ואין בו ולידציה. השליחה מעדכנת את הרשומה
 * שנפתחה בשלב הראשון ולא פותחת חדשה, ולכן היא נשענת על leadId שבכרטיס.
 *
 * מה שכבר נמסר לא נשאל שוב: מסלול שהגיע מהעמוד שממנו נרשמו, ומטרה
 * שהגיעה מהמנחה בצ'אט, פשוט לא מקבלים שדה.
 */
const LeadDetailsForm = ({
  ticket,
  onSaved,
}: {
  ticket: LeadTicket;
  onSaved?: (courseSlug: string) => void;
}) => {
  const uid = useId();
  const doneRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState({
    courseInterest: ticket.courseInterest ?? "",
    occupation: "",
    experienceLevel: "",
    goal: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");

  const fid = (name: string) => `lead-details-${uid}-${name}`;
  const set = (k: "occupation" | "goal") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  /* כפתור בלי תשובות הוא בקשה ריקה לשרת, ולכן הוא נעול עד שיש מה לשלוח */
  const hasAnyValue =
    (!ticket.courseInterest && !!values.courseInterest) ||
    !!values.occupation.trim() ||
    !!values.experienceLevel ||
    !!values.goal.trim();

  /*
   * הכפתור נעלם מה-DOM אחרי ההצלחה. בלי העברת פוקוס מפורשת מי שגולש
   * במקלדת נזרק לתחילת העמוד ולא שומע שהשמירה עבדה.
   */
  useEffect(() => {
    if (status === "success") doneRef.current?.focus({ preventScroll: true });
  }, [status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || !hasAnyValue) return;

    setStatus("sending");
    const ok = await submitLeadEnrichment({
      leadId: ticket.leadId,
      fullName: ticket.fullName,
      email: ticket.email,
      courseInterest: values.courseInterest,
      occupation: values.occupation.trim(),
      goal: values.goal.trim(),
      experienceLevel: values.experienceLevel,
      leadSource: ticket.leadSource,
    });

    if (ok) {
      /* כרטיס ששימש כבר לא נחוץ, ורענון של העמוד לא יבקש את אותן תשובות שוב */
      clearLeadTicket();
      setStatus("success");
      onSaved?.(values.courseInterest);
    } else {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="lead-form mt-10 text-start">
        <div
          ref={doneRef}
          role="status"
          tabIndex={-1}
          className="flex items-start gap-3 outline-none animate-fade-up motion-reduce:animate-none"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[13px] text-brand"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <p className="text-[15px] font-semibold text-bone">נשמר. תודה.</p>
            <p className="mt-1 text-sm leading-relaxed text-bone/60">
              התשובות אצלנו, ונשתמש בהן כשנחזור אליכם.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={fid("heading")} className="lead-form mt-10 text-start">
      <span className="section-label mb-4 flex text-bone">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
        אופציונלי
      </span>

      <h2
        id={fid("heading")}
        className="font-display text-[1.3rem] font-bold leading-snug tracking-tight text-bone sm:text-[1.45rem]"
      >
        רוצים שנגיע מוכנים לשיחה?
      </h2>
      <p className="mt-2.5 text-[15px] leading-relaxed text-bone/60">
        הפרטים שלכם כבר אצלנו. מה שתענו כאן עוזר לנו להתאים את השיחה, ואפשר גם לדלג.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        {/*
          הרשימות הנפתחות למעלה וה-textarea למטה: התפריט של PinnedSelect
          נפתח כלפי מטה, ורשימה שיושבת אחרונה נפתחת אל מחוץ לכרטיס במובייל.
        */}
        {!ticket.courseInterest && (
          <div className="field">
            <label htmlFor={fid("course")}>איזה מסלול מעניין אתכם?</label>
            <PinnedSelect
              id={fid("course")}
              value={values.courseInterest}
              options={TRACK_OPTIONS}
              placeholder="בחרו מסלול..."
              onChange={(slug) => setValues((v) => ({ ...v, courseInterest: slug }))}
            />
          </div>
        )}

        <div className="form-row">
          <div className="field">
            <label htmlFor={fid("occupation")}>תחום עיסוק או לימודים</label>
            <input
              id={fid("occupation")}
              type="text"
              value={values.occupation}
              onChange={set("occupation")}
            />
          </div>
          <div className="field">
            <label htmlFor={fid("exp")}>רמת ניסיון ב-AI</label>
            <PinnedSelect
              id={fid("exp")}
              value={values.experienceLevel}
              options={EXPERIENCE_OPTIONS}
              placeholder="בחרו רמה..."
              onChange={(level) => setValues((v) => ({ ...v, experienceLevel: level }))}
            />
          </div>
        </div>

        {!ticket.goal && (
          <div className="field">
            <label htmlFor={fid("goal")}>מה הייתם רוצים להשיג?</label>
            <textarea
              id={fid("goal")}
              value={values.goal}
              onChange={set("goal")}
              placeholder="כמה מילים על העסק, הלימודים או המטרה שלכם"
            />
          </div>
        )}

        {/*
          שגיאה כאן היא לא שגיאת הרשמה, ולכן היא לא מקבלת את הוויזואליה
          של form-error-summary. המשפט השני חשוב מהראשון: מי שנכשל כאן
          חייב לדעת שהפרטים שהשאיר קודם נקלטו.
        */}
        {status === "error" && (
          <p
            role="alert"
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-200"
          >
            לא הצלחנו לשמור את התשובות. הפרטים שהשארתם קודם נקלטו ואינם תלויים בזה. אפשר לנסות שוב.
          </p>
        )}

        <div>
          <Pressable
            type="submit"
            /* aria-disabled ולא disabled: כפתור מושבת יוצא ממסלול הטאב */
            aria-disabled={!hasAnyValue || status === "sending"}
            className={`btn-submit sm:w-auto sm:px-8${status === "sending" ? " is-sending" : ""}${
              hasAnyValue ? "" : " opacity-60"
            }`}
            motionDisabled={status === "sending"}
          >
            {status === "sending" ? "שומר..." : "שמרו את התשובות"}
          </Pressable>
          <p className="mt-3 text-xs leading-relaxed text-bone/55">אפשר לענות רק על מה שרלוונטי.</p>
        </div>
      </form>
    </section>
  );
};

export default LeadDetailsForm;
