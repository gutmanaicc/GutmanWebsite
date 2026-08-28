import SectionHeader, { AccentWord } from "../SectionHeader";
import { MotionItem, MotionSection } from "./CourseMotion";

/**
 * סקשן הזיהוי, מיד אחרי ההירו.
 *
 * גולש שהגיע מפרסום ממומן לא מכיר את האקדמיה ולא חיפש אותה. לפני
 * שהוא מוכן לקרוא סילבוס הוא צריך רגע אחד של "זה בדיוק אני", ולכן
 * זה הסקשן הראשון אחרי ההירו ולא הלוגיסטיקה.
 *
 * אין כאן אייקונים ואין כרטיסים בכוונה. כל קישוט הופך אמירה של
 * הגולש על עצמו לפריט בקטלוג, והמשקל הטיפוגרפי לבדו עובד חזק יותר.
 */
const CoursePain = ({ points, courseKey }: { points: string[]; courseKey: string }) => {
  if (points.length === 0) return null;

  return (
    <MotionSection resetKey={`${courseKey}-pain`} className="py-10 sm:py-12">
      <div className="container-site max-w-3xl">
        <MotionItem>
          <SectionHeader
            compact
            kicker="מוכר לכם"
            title={
              <>
                אם אחד מאלה <AccentWord>נשמע מוכר</AccentWord>
              </>
            }
          />
        </MotionItem>

        <ul className="mt-6 space-y-0">
          {points.map((point) => (
            <MotionItem key={point}>
              <li className="border-b border-white/10 py-4 first:border-t">
                <p className="flex gap-3 text-[15px] leading-relaxed text-bone/75 sm:text-base">
                  {/* מקף פתיחה במקום נקודת תבליט: הרשימה נקראת כרצף
                      משפטים של אדם אחד, לא כרשימת תכונות של מוצר */}
                  <span className="mt-[0.6em] h-px w-4 shrink-0 bg-brand/60" aria-hidden />
                  <span>{point}</span>
                </p>
              </li>
            </MotionItem>
          ))}
        </ul>
      </div>
    </MotionSection>
  );
};

export default CoursePain;
