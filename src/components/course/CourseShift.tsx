import SectionHeader, { AccentWord } from "../SectionHeader";
import { ArrowIcon } from "../icons";
import { MotionItem, MotionSection } from "./CourseMotion";
import type { CourseShiftRow } from "../../data/courses";

/**
 * מה משתנה: "היום" מול "אחרי הסדנה".
 *
 * זה הסקשן שהופך את הכאב שמעליו לתמורה. בלעדיו העמוד קופץ מהזדהות
 * ישר לסילבוס, והגולש נדרש לתרגם לבד רשימת נושאים לשינוי בחיים שלו.
 *
 * הפריסה היא שורות ולא שתי עמודות נפרדות, כדי שכל "היום" יישאר צמוד
 * ל"אחרי" שלו. בשתי עמודות עצמאיות מספיק שורה אחת ארוכה יותר כדי
 * שההתאמה תישבר ויקרא זוג לא נכון.
 */
const CourseShift = ({ rows, courseKey }: { rows: CourseShiftRow[]; courseKey: string }) => {
  if (rows.length === 0) return null;

  return (
    <MotionSection resetKey={`${courseKey}-shift`} className="relative py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 grid-canvas opacity-25" aria-hidden />
      <div className="container-site relative max-w-4xl">
        <MotionItem>
          <SectionHeader
            compact
            kicker="מה משתנה"
            title={
              <>
                איך זה נראה <AccentWord>אחרי</AccentWord> הסדנה
              </>
            }
          />
        </MotionItem>

        <div className="mt-6 space-y-3">
          {rows.map((row) => (
            <MotionItem key={row.after}>
              <div className="grid items-center gap-3 rounded-2xl border border-white/10 bg-surface-1 p-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:p-5">
                <p className="text-sm leading-relaxed text-bone/55 line-through decoration-bone/30 sm:text-[15px]">
                  {row.before}
                </p>
                {/* ArrowIcon כבר מצביע שמאלה, וזה בדיוק כיוון המעבר בעמוד
                    RTL: "היום" בימין, "אחרי" בשמאל. סיבוב היה מפנה אותו
                    חזרה אל הצד שכבר עברנו.

                    במובייל הוא נעלם: שם השורות מוערמות והמעבר הוא מלמעלה
                    למטה, וחץ אופקי היה מצביע לכיוון הלא נכון. */}
                <span className="hidden text-brand sm:inline-flex" aria-hidden>
                  <ArrowIcon size={16} />
                </span>
                <p className="text-[15px] font-semibold leading-relaxed text-bone sm:text-base">
                  {row.after}
                </p>
              </div>
            </MotionItem>
          ))}
        </div>
      </div>
    </MotionSection>
  );
};

export default CourseShift;
