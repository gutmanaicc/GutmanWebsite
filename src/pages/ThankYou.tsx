import { Link, useLocation } from "react-router-dom";
import { COURSES } from "../data/courses";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

/**
 * העמוד שאחרי ההמרה.
 *
 * קודם הוא הסתיים בשני קישורי ניווט ותו לא. מי שהרגע השאיר פרטים הוא
 * הקהל הכי חם באתר, ובדיוק שם ויתרנו על ההזדמנות להסביר מה קורה עכשיו
 * ולתת לו משהו לעשות בינתיים. אין כאן הבטחות זמנים, כי לא נמסרו כאלה.
 */
const ThankYou = () => {
  const location = useLocation();
  const courseSlug = (location.state as { course?: string } | null)?.course;
  const course = COURSES.find((c) => c.slug === courseSlug);

  useSeo({
    title: `תודה | ${SITE.name}`,
    description: "קיבלנו את הפרטים שלכם ונחזור אליכם בקרוב.",
    path: "/thank-you",
  });

  return (
    <div className="container-site flex min-h-[70svh] flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl text-brand ring-1 ring-brand/25">
        ✓
      </div>

      <h1 className="font-display text-[clamp(1.8rem,5vw,2.6rem)] font-bold leading-tight tracking-tight text-bone">
        קיבלנו. נחזור אליכם בקרוב.
      </h1>

      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-bone/60 sm:text-base">
        {course
          ? `רשמנו את פנייתכם לגבי "${course.title}". ניצור קשר עם כל הפרטים.`
          : "רשמנו את פנייתכם. ניצור קשר בהקדם עם כל הפרטים."}
      </p>

      {/* משהו לעשות בינתיים, במקום מבוי סתום */}
      <div className="mt-10 w-full max-w-sm space-y-2.5">
        {course && (
          <Link
            to={`/syllabus/${course.slug}`}
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-medium text-bone transition-colors hover:border-white/35"
          >
            לסילבוס המלא של המסלול
          </Link>
        )}
        <Link
          to="/reviews"
          className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-medium text-bone transition-colors hover:border-white/35"
        >
          מה אומרים מי שכבר עברו
        </Link>
        <Link
          to="/courses"
          className="flex min-h-12 w-full items-center justify-center rounded-full px-5 text-sm text-bone/55 transition-colors hover:text-bone"
        >
          לכל המסלולים
        </Link>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-bone/40">
        משהו דחוף?{" "}
        <a href={`tel:${SITE.contact.phone}`} className="text-bone/70 underline underline-offset-4" dir="ltr">
          {SITE.contact.phone}
        </a>
      </p>
    </div>
  );
};

export default ThankYou;
