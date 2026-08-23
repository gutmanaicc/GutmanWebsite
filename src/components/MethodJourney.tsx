import SectionHeader, { AccentWord } from "./SectionHeader";
import SnakeRail from "./SnakeRail";
import { SITE } from "../data/site";

/**
 * "איך אנחנו מלמדים" כמסלול נחש.
 *
 * הגרסה הקודמת הייתה במה דביקה בגובה 100svh עם שבעה שלבים במרחב
 * preserve-3d, כמעט 400vh של גלילה. היא הוחלפה במסלול המשותף עם עמוד
 * הבית: אותה כוריאוגרפיה, בלי לכלוא את המשתמש בגלילה ארוכה ובלי
 * filter: blur על שבע שכבות בכל פריים.
 *
 * הכותרת והמסלול שניהם בקונטיינר של האתר - ראו ההסבר ב-ProcessSection.
 */
const MethodJourney = () => (
  <section className="py-14 sm:py-20" aria-label="איך אנחנו מלמדים">
    <div className="container-site">
      <SectionHeader
        as="h2"
        kicker="איך אנחנו מלמדים"
        title={
          <>
            שבעה צעדים, <AccentWord>מהבעיה לשיטה</AccentWord>
          </>
        }
        center
      />
    </div>

    <div className="container-site mt-10">
      <SnakeRail id="method" steps={[...SITE.method]} />
    </div>
  </section>
);

export default MethodJourney;
