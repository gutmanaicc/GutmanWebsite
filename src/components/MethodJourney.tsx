import SectionHeader, { AccentWord } from "./SectionHeader";
import SnakePath from "./SnakePath";
import { SITE } from "../data/site";

/**
 * "איך אנחנו מלמדים" כמסלול נחש.
 *
 * הגרסה הקודמת הייתה במה דביקה בגובה 100svh עם שבעה שלבים במרחב
 * preserve-3d, כמעט 400vh של גלילה. היא הוחלפה במסלול המשותף עם עמוד
 * הבית: אותה כוריאוגרפיה, בלי לכלוא את המשתמש בגלילה ארוכה ובלי
 * filter: blur על שבע שכבות בכל פריים.
 *
 * הכותרת בקונטיינר של האתר, המסלול מחוצה לו - ראו ההסבר ב-ProcessSection.
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

    <div className="mx-auto mt-10 w-full max-w-[88rem] px-4 sm:px-6 lg:px-8">
      <SnakePath id="method" steps={[...SITE.method]} />
    </div>
  </section>
);

export default MethodJourney;
