import { Link } from "react-router-dom";

type Props = {
  /** When false, renders a non-link badge (e.g. on the Reviews page itself). */
  linked?: boolean;
  className?: string;
};

/**
 * הוכחה חברתית במשקל טיפוגרפי: מספר גדול, קו שיער, ומילה.
 * בלי לוגו ובלי כוכביות - המספר עושה את העבודה.
 */
const Inner = () => (
  <>
    <span className="text-3xl font-semibold leading-none tracking-tightest text-bone" dir="ltr">
      5.0
    </span>
    <span className="h-8 w-px shrink-0 bg-current opacity-20" aria-hidden />
    <span className="flex flex-col items-start gap-0.5 text-right">
      <span className="text-[13px] font-medium leading-none text-bone/85">מעל 100 ביקורות</span>
      <span className="text-[11px] leading-none text-bone/45">של משתתפים במסלולים</span>
    </span>
  </>
);

const base =
  "inline-flex items-center gap-3.5 rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 transition-colors duration-200";

const ReviewsRatingBadge = ({ linked = true, className = "" }: Props) => {
  if (!linked) {
    return (
      <div dir="rtl" className={`${base} ${className}`} aria-label="דירוג 5.0, מעל 100 ביקורות">
        <Inner />
      </div>
    );
  }

  return (
    <Link
      to="/reviews"
      dir="rtl"
      className={`${base} hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${className}`}
      aria-label="דירוג 5.0, מעל 100 ביקורות, לצפייה בביקורות"
    >
      <Inner />
    </Link>
  );
};

export default ReviewsRatingBadge;
