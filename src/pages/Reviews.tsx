import { Star } from "lucide-react";
import BackButton from "../components/BackButton";
import ReviewsRatingBadge from "../components/ReviewsRatingBadge";
import { AccentWord } from "../components/SectionHeader";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

type PlaceholderReview = {
  id: string;
  name: string;
  role: string;
  track: string;
  quote: string;
  rating: number;
};

/** Placeholder testimonials - replace with real student quotes when ready. */
const PLACEHOLDER_REVIEWS: PlaceholderReview[] = [
  {
    id: "1",
    name: "דנה כ.",
    role: "מנהלת סושיאל",
    track: "מנהלי סושיאל",
    quote:
      "תוך כמה שבועות בניתי עובד AI לכל לקוח. יצאתי עם שיטה שעובדת ביום־יום, לא עוד טיפים כלליים.",
    rating: 5,
  },
  {
    id: "2",
    name: "יואב מ.",
    role: "בעל עסק",
    track: "בניית מערכת CRM",
    quote:
      "סוף סוף יש לי CRM שמותאם לעסק שלי. פותח בבוקר ויודע בדיוק במה לטפל - בלי לחפש בוואטסאפ.",
    rating: 5,
  },
  {
    id: "3",
    name: "מיכל ר.",
    role: "סטודנטית",
    track: "סטודנטים",
    quote:
      "המערכת שבניתי למבחנים שינתה לי את הסמסטר. סיכומים, תרגול והכנה - הכל במקום אחד.",
    rating: 5,
  },
  {
    id: "4",
    name: "איתי ש.",
    role: "עורך וידאו",
    track: "עורכי וידאו ויוצרי תוכן",
    quote:
      "למדתי תהליך הפקה עם AI מקצה לקצה. הסרטון שיצאתי איתו כבר עלה ללקוח.",
    rating: 5,
  },
  {
    id: "5",
    name: "נועה ל.",
    role: "עצמאית",
    track: "בניית דף נחיתה",
    quote:
      "בניתי דף נחיתה לבד, בלי מעצב ובלי המתנה. עכשיו אני משנה אותו בעצמי תוך דקות.",
    rating: 5,
  },
  {
    id: "6",
    name: "רון ג.",
    role: "נותן שירות",
    track: "מערכת למעקב תשלומים",
    quote:
      "לראשונה ברור לי מי שילם ומי חייב. המערכת פשוטה ועובדת על הנתונים האמיתיים שלי.",
    rating: 5,
  },
];

const Stars = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${count} מתוך 5 כוכבים`}>
    {Array.from({ length: count }, (_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-[#FF2D85] text-[#FF2D85]" aria-hidden />
    ))}
  </span>
);

const Reviews = () => {
  useSeo({
    title: `ביקורות | ${SITE.name}`,
    description: "מה התלמידים שלנו אומרים על המסלולים הפרונטליים של Gutman Academy.",
    path: "/reviews",
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-40" aria-hidden />
        <div className="container-site relative py-10 sm:py-14 lg:py-16">
          <div className="mb-4 flex w-full justify-start sm:mb-5">
            <BackButton fallbackTo="/" />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <span className="stat-pill mb-4 inline-flex border-[#FF2D85]/25 bg-[#FF2D85]/5 text-[#FF2D85]">
              ביקורות
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#191919] sm:text-4xl lg:text-5xl">
              מה התלמידים שלנו <AccentWord>אומרים</AccentWord>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-zinc-600 sm:mt-5 sm:text-lg">
              מעל 100+ סטודנטים, בעלי עסקים ויוצרי תוכן שכבר בונים תהליכי עבודה אמיתיים עם בינה מלאכותית.
            </p>
            <div className="mt-6 flex justify-center sm:mt-7">
              <ReviewsRatingBadge linked={false} />
            </div>
          </div>
        </div>
      </section>

      <div className="py-12 sm:py-16">
        <div className="container-site">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_REVIEWS.map((review) => (
              <li key={review.id}>
                <article className="flex h-full flex-col rounded-2xl border border-line bg-[#F4F4F2] p-5 text-start shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#191919] text-sm font-bold text-[#F4F4F2]"
                        aria-hidden
                      >
                        {review.name.charAt(0)}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-[#191919]">{review.name}</h2>
                        <p className="text-xs text-muted">{review.role}</p>
                      </div>
                    </div>
                    <Stars count={review.rating} />
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[#191919]/85">“{review.quote}”</p>
                  <span className="mt-4 inline-flex w-fit rounded-full border border-[#FF2D85]/25 bg-[#FF2D85]/5 px-2.5 py-1 text-[11px] font-semibold text-[#FF2D85]">
                    {review.track}
                  </span>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
