import Pressable from "../Pressable";
import { ArrowIcon } from "../icons";
import { MotionItem, MotionSection } from "./CourseMotion";

/**
 * רצועת קריאה לפעולה באמצע העמוד.
 *
 * העמוד ארוך, ועד עכשיו היו בו בדיוק שתי נקודות הרשמה: ההירו והטופס
 * בתחתית. מי שהשתכנע באמצע נאלץ לגלול עד הסוף כדי לפעול, וגלילה
 * ארוכה היא בדיוק המקום שבו גולש ממומן נושר.
 *
 * הרצועה קלה במכוון ולא מתחרה בבאנר ההרשמה שלמטה: היא תזכורת, לא
 * סקשן. הכפתור פותח את הפופאפ ולא גולל לטופס, כי גלילה ארוכה כלפי
 * מטה היא בדיוק מה שהיא באה לחסוך.
 *
 * אין כאן שעון ואין "נותרו מקומות אחרונים". הכיתוב נגזר מהתוצר של
 * המסלול, ו-note מציג את גודל הקבוצה רק כשהוא באמת מלא בדאטה.
 * דחיפות ממוצאת היא בדיוק מה שגורם לגולש שהגיע מפרסום ממומן
 * להפסיק להאמין לשאר העמוד.
 */
const CourseCtaStrip = ({
  courseKey,
  headline,
  note,
  onRegister,
}: {
  courseKey: string;
  headline: string;
  /** גודל הקבוצה, כשהוא נמסר. ריק במסלול שטרם נקבע בו */
  note?: string;
  onRegister: () => void;
}) => (
  <MotionSection resetKey={`${courseKey}-cta-strip`} className="py-6 sm:py-8">
    <div className="container-site">
      <MotionItem>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand/25 bg-brand/[0.06] px-5 py-5 text-center sm:flex-row sm:justify-between sm:px-7 sm:text-start">
          <div className="max-w-xl">
            <p className="text-[15px] font-semibold leading-snug text-bone sm:text-base">
              {headline}
            </p>
            {note && <p className="mt-1 text-sm text-bone/55">{note}</p>}
          </div>
          <Pressable
            type="button"
            className="btn btn-small shrink-0 cursor-pointer bg-brand text-white shadow-pill hover:brightness-105"
            rippleTone="pink"
            onClick={onRegister}
          >
            שמרו לי מקום
            <ArrowIcon />
          </Pressable>
        </div>
      </MotionItem>
    </div>
  </MotionSection>
);

export default CourseCtaStrip;
