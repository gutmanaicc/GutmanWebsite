import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LeadDetailsForm from "../components/LeadDetailsForm";
import { COURSES } from "../data/courses";
import { SITE } from "../data/site";
import { readLeadTicket } from "../lib/leads";
import { useSeo } from "../lib/seo";

/**
 * העמוד שאחרי ההמרה.
 *
 * קודם הוא הסתיים בשני קישורי ניווט ותו לא. מי שהרגע השאיר פרטים הוא
 * הקהל הכי חם באתר, ובדיוק שם ויתרנו על ההזדמנות להסביר מה קורה עכשיו
 * ולתת לו משהו לעשות בינתיים. אין כאן הבטחות זמנים, כי לא נמסרו כאלה.
 *
 * מאז שהטופס פוצל לשניים העמוד הזה נושא גם את השאלות שירדו ממנו. הן
 * מוצגות רק למי שבאמת הגיע לכאן מטופס (קיים כרטיס תקף), ולכן מי שהקליד
 * /thank-you בכתובת רואה את העמוד כפי שהיה.
 */
const ThankYou = () => {
  const location = useLocation();
  /*
   * הכרטיס נקרא פעם אחת בטעינה ולא בכל רינדור: השליחה מוחקת אותו, וקריאה
   * חוזרת הייתה מעלימה את הודעת ההצלחה באמצע.
   */
  const ticket = useMemo(() => readLeadTicket(), []);
  const [savedCourse, setSavedCourse] = useState("");

  const courseSlug =
    savedCourse || (location.state as { course?: string } | null)?.course || ticket?.courseInterest;
  const course = COURSES.find((c) => c.slug === courseSlug);

  useSeo({
    title: `תודה | ${SITE.name}`,
    description: "קיבלנו את הפרטים שלכם ונחזור אליכם בקרוב.",
    path: "/thank-you",
  });

  /* בלי טופס העמוד קצר, ולכן הוא ממורכז אנכית. עם טופס מרכוז כזה דוחף
     את האישור אל מחוץ למסך במסכים נמוכים */
  const shell = ticket
    ? "container-site py-14 sm:py-20"
    : "container-site flex min-h-[70svh] flex-col justify-center py-16 sm:py-24";

  const pill =
    "inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-medium text-bone/80 transition-colors hover:border-white/40 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl text-brand ring-1 ring-brand/25">
            ✓
          </div>

          <h1 className="font-display text-[clamp(1.8rem,5vw,2.6rem)] font-bold leading-tight tracking-tight text-bone">
            קיבלנו. נחזור אליכם בקרוב.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-bone/60 sm:text-base">
            {course
              ? `רשמנו את פנייתכם לגבי "${course.title}". ניצור קשר עם כל הפרטים.`
              : "רשמנו את פנייתכם. ניצור קשר בהקדם עם כל הפרטים."}
          </p>
        </div>

        {/* קו שיער אחד מסמן שהאישור נגמר, בלי מונה שלבים שירמז שההרשמה לא הושלמה */}
        {ticket && (
          <>
            <div className="mx-auto mt-12 h-px w-16 bg-white/[0.12] sm:mt-14" aria-hidden />
            <LeadDetailsForm ticket={ticket} onSaved={setSavedCourse} />
          </>
        )}

        {/* משהו לעשות בינתיים, במקום מבוי סתום */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {course && (
            <Link to={`/syllabus/${course.slug}`} className={pill}>
              לסילבוס המלא של המסלול
            </Link>
          )}
          <Link to="/reviews" className={pill}>
            מה אומרים מי שכבר עברו
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/courses"
            className="inline-flex min-h-11 items-center rounded-full px-2 text-sm text-bone/55 underline-offset-4 transition-colors hover:text-bone hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45"
          >
            לכל המסלולים
          </Link>
        </div>

        <p className="mt-10 text-center text-xs leading-relaxed text-bone/55">
          משהו דחוף?{" "}
          <a href={`tel:${SITE.contact.phone}`} className="text-bone/80 underline underline-offset-4" dir="ltr">
            {SITE.contact.phone}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ThankYou;
