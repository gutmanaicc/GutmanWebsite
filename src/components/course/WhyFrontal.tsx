import SectionHeader, { AccentWord } from "../SectionHeader";
import { SITE } from "../../data/site";
import { MotionItem, MotionSection } from "./CourseMotion";

/*
 * ארבעה מתוך ששת הנימוקים ב-SITE.whyFrontal. הרשימה המלאה נשארת
 * לעמוד הבית, שיש בו מקום לנשום; כאן היא ממוקמת בין הוכחה לטופס
 * וצריכה להיקרא במבט אחד.
 */
const REASONS = SITE.whyFrontal.slice(0, 4);

/**
 * מענה להתנגדות המרכזית של גולש ממומן: למה פרונטלי ולא קורס מוקלט.
 *
 * הנימוקים האלה כבר כתובים ומוצגים, אבל רק בעמוד הבית. מי שנוחת
 * ישירות על עמוד מסלול מפרסום ממומן לא עובר שם אף פעם, ולכן ההבדל
 * המרכזי של האקדמיה פשוט לא הגיע אליו.
 */
const WhyFrontal = ({ courseKey }: { courseKey: string }) => (
  <MotionSection resetKey={`${courseKey}-why-frontal`} className="relative py-10 sm:py-12">
    <div className="pointer-events-none absolute inset-0 grid-canvas opacity-25" aria-hidden />
    <div className="container-site relative max-w-4xl">
      <MotionItem>
        <SectionHeader
          compact
          kicker="למה פרונטלי"
          title={
            <>
              למה לא פשוט <AccentWord>קורס מוקלט</AccentWord>
            </>
          }
          sub="הכל כאן קורה בחדר, בזמן אמת. זו לא סדרת הקלטות ולא וובינר."
        />
      </MotionItem>

      <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <MotionItem key={reason.title}>
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-display text-base font-bold tracking-tight text-bone sm:text-lg">
                {reason.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bone/60">{reason.text}</p>
            </div>
          </MotionItem>
        ))}
      </div>
    </div>
  </MotionSection>
);

export default WhyFrontal;
