import { useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader, { AccentWord } from "../SectionHeader";
import ImageLightbox from "../ImageLightbox";
import ReviewsRatingBadge from "../ReviewsRatingBadge";
import { ArrowIcon } from "../icons";
import { popupJustClosed } from "../../lib/scrollLock";
import { getTestimonialsForCourse, type Testimonial } from "../../data/testimonialsData";
import { MotionItem, MotionSection } from "./CourseMotion";

/**
 * הוכחה חברתית בתוך עמוד המסלול.
 *
 * עד היום העדויות חיו רק ב-/reviews ובעמוד הבית, כלומר בדיוק בשני
 * העמודים שגולש מפרסום ממומן לא רואה: הוא נוחת ישירות על המסלול
 * ומחליט שם. הסקשן הזה מביא שלוש הודעות רלוונטיות למסלול, והשאר
 * נשאר ב-/reviews דרך הקישור בתחתית.
 *
 * הצילום נפתח בלחיצה ולא מוצג ישירות, כמו בעמוד הבית: הציטוט הוא
 * מה שנקרא, והתמונה היא האימות למי שרוצה לוודא שזה אמיתי.
 */
const CourseProof = ({ slug, courseKey }: { slug: string; courseKey: string }) => {
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);
  const items = getTestimonialsForCourse(slug);

  if (items.length === 0) return null;

  return (
    <>
      <MotionSection resetKey={`${courseKey}-proof`} className="py-10 sm:py-12">
        <div className="container-site">
          <MotionItem>
            <SectionHeader
              compact
              kicker="מה אומרים"
              title={
                <>
                  מילה במילה, <AccentWord>מההודעות שקיבלנו</AccentWord>
                </>
              }
              sub="לא כתבנו את זה. אלה ההודעות עצמן, כפי שנשלחו אחרי המפגשים."
            />
          </MotionItem>

          <MotionItem className="mt-6 flex justify-center">
            <ReviewsRatingBadge />
          </MotionItem>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <MotionItem key={item.id}>
                <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-surface-1 p-5 shadow-card">
                  <p className="font-display text-lg font-bold leading-snug tracking-tight text-bone">
                    {item.quote}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/55">{item.text}</p>
                  {item.author && (
                    <span className="mt-4 text-xs font-medium text-bone/50">{item.author}</span>
                  )}
                  <button
                    type="button"
                    /* popupJustClosed חוסם פתיחה מחדש כשסגירת הלייטבוקס
                       בלחיצה בחוץ נוחתת על הכרטיס שמתחתיה */
                    onClick={() => !popupJustClosed() && setLightbox(item)}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-xs font-medium text-bone/55 transition-colors hover:text-brand"
                  >
                    לצפייה בהודעה המקורית
                    <ArrowIcon size={13} />
                  </button>
                </article>
              </MotionItem>
            ))}
          </div>

          <MotionItem className="mt-8 flex justify-center">
            <Link to="/reviews" className="btn-ghost btn-small inline-flex items-center gap-2">
              לכל ההודעות
              <ArrowIcon size={15} />
            </Link>
          </MotionItem>
        </div>
      </MotionSection>

      <ImageLightbox
        src={lightbox?.image ?? null}
        alt={lightbox ? `צילום ההודעה: ${lightbox.quote}` : ""}
        onClose={() => setLightbox(null)}
      />
    </>
  );
};

export default CourseProof;
