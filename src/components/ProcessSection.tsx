import SectionHeader, { AccentWord } from "./SectionHeader";
import SnakePath from "./SnakePath";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" כמסלול נחש.
 *
 * הכותרת יושבת בקונטיינר של האתר כדי לשמור על יישור עם שאר העמוד,
 * והמסלול עצמו יושב מחוץ לו ומקבל רוחב משלו. container-site חסום
 * ב-max-w-6xl, וכל עוד המסלול היה בתוכו הזיגזג נשאר באותו רוחב גם
 * במסך 1920 ולא ניצל את המקום.
 *
 * הלוגיקה של ההתקדמות, נקודת האור והדלקת השלבים יושבת ב-SnakePath,
 * אותו רכיב שמשרת גם את שבעת השלבים בעמוד אודות.
 */
const ProcessSection = () => (
  <section className="py-14 sm:py-20 lg:py-24">
    <div className="container-site">
      <SectionHeader
        index="05"
        kicker="איך זה עובד"
        title={
          <>
            חמישה שלבים. <AccentWord>אפס ניחושים.</AccentWord>
          </>
        }
      />
    </div>

    <div className="mx-auto mt-10 w-full max-w-[88rem] px-4 sm:px-6 lg:px-8">
      <SnakePath id="process" steps={[...SITE.howItWorks]} />
    </div>
  </section>
);

export default ProcessSection;
