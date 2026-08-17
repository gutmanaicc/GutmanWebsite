import type { ReactNode } from "react";
import Pressable from "./Pressable";
import ReviewsRatingBadge from "./ReviewsRatingBadge";
import { useRegisterModal } from "../context/RegisterModalContext";

type Props = {
  /** מזהה המקור שיירשם על הליד. חובה, כדי שאפשר יהיה למדוד כל סגירה בנפרד */
  leadSource: string;
  title: ReactNode;
  sub: string;
  /** טקסט הכפתור הראשי. ברירת מחדל מתאימה לרוב העמודים */
  cta?: string;
  /** מסלול שייבחר מראש בטופס, כשהעמוד מדבר על מסלול מסוים */
  courseId?: string;
  /** מסתיר את תג הדירוג בעמודים שכבר מציגים אותו למעלה */
  showRating?: boolean;
};

/**
 * הסגירה של עמוד: הוכחה חברתית ואז בקשה אחת ברורה.
 *
 * הופרד לרכיב אחד כי ארבעה עמודים היו צריכים בדיוק את זה, ושלושה מהם
 * (ביקורות, אודות, מסלולים) פשוט נגמרו בלי לבקש כלום. תג הדירוג יושב
 * כאן ולא בנפרד, כי הוכחה עובדת כשהיא צמודה לבקשה ולא כשהיא בעמוד אחר.
 *
 * הפעולה של השארת הפרטים היא הכפתור הראשי המלא. בגרסה הקודמת בעמוד הבית
 * היא הייתה דווקא הכפתור המשני, ו"לצפייה במסלולים" קיבל את המשקל.
 */
const ClosingCta = ({
  leadSource,
  title,
  sub,
  cta = "השאירו פרטים ונחזור אליכם",
  courseId,
  showRating = true,
}: Props) => {
  const { openRegisterModal } = useRegisterModal();

  return (
    <section className="relative overflow-hidden border-t border-white/10 py-16 text-center sm:py-24">
      {/* הילה ורודה רכה שמושכת את העין לסוף העמוד */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(255,45,133,0.14) 0%, rgba(255,45,133,0.04) 45%, rgba(255,45,133,0) 100%)",
        }}
        aria-hidden
      />

      <div className="container-site relative flex flex-col items-center">
        {showRating && <ReviewsRatingBadge className="mb-7" />}

        <h2 className="max-w-3xl font-display text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.12] tracking-tightest text-bone">
          {title}
        </h2>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-bone/55 sm:text-base">{sub}</p>

        <Pressable
          type="button"
          className="btn btn-brand mt-9 w-full max-w-xs sm:w-auto sm:max-w-none sm:px-9"
          rippleTone="pink"
          onClick={() => openRegisterModal({ leadSource, courseId })}
        >
          {cta}
        </Pressable>

        <p className="mt-4 text-xs text-bone/40">בלי התחייבות. חוזרים אליכם עם כל הפרטים.</p>
      </div>
    </section>
  );
};

export default ClosingCta;
