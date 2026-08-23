import SectionHeader, { AccentWord } from "./SectionHeader";
import SnakeRail from "./SnakeRail";
import { SITE } from "../data/site";

/**
 * "איך זה עובד" כמסלול נחש.
 *
 * המסלול חזר לתוך container-site. הרוחב החריג (max-w-[88rem]) נדרש
 * כשהזיגזג נפרש על כל הרוחב, ואין בו טעם עכשיו כשהנחש כלוא ברצועה
 * צדדית והטקסט יושב בעמודה אחת.
 *
 * הלוגיקה של ההתקדמות, נקודת האור והדלקת השלבים יושבת ב-SnakeRail,
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

    <div className="container-site mt-10">
      <SnakeRail id="process" steps={[...SITE.howItWorks]} />
    </div>
  </section>
);

export default ProcessSection;
