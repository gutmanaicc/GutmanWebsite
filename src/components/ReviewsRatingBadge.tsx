import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Logo from "./Logo";

type Props = {
  /** When false, renders a non-link badge (e.g. on the Reviews page itself). */
  linked?: boolean;
  className?: string;
};

const badgeClass =
  "inline-flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200/90 bg-white/85 px-3.5 py-2.5 shadow-sm backdrop-blur-md transition-all duration-200 sm:gap-3.5 sm:px-4";

const BadgeInner = () => (
  <>
    <span className="inline-flex items-center gap-2 sm:gap-2.5">
      <Logo height={22} className="max-h-[22px] w-auto opacity-90" />
      <span className="text-2xl font-bold leading-none tracking-tight text-[#191919] sm:text-[1.75rem]">5.0</span>
    </span>
    <span className="h-8 w-px shrink-0 bg-zinc-200" aria-hidden />
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-[#FF2D85] text-[#FF2D85] sm:h-4 sm:w-4" strokeWidth={0} />
        ))}
      </span>
      <span className="text-xs font-medium text-zinc-500">מעל 100+ ביקורות</span>
    </span>
  </>
);

/**
 * Capterra-style rating badge (RTL). Optionally links to /reviews.
 */
const ReviewsRatingBadge = ({ linked = true, className = "" }: Props) => {
  if (!linked) {
    return (
      <div
        dir="rtl"
        className={`${badgeClass} ${className}`}
        aria-label="דירוג 5.0 מעל 100 ביקורות"
      >
        <BadgeInner />
      </div>
    );
  }

  return (
    <Link
      to="/reviews"
      dir="rtl"
      className={`group ${badgeClass} cursor-pointer hover:border-[#FF2D85]/50 hover:bg-white hover:shadow-md hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/40 ${className}`}
      aria-label="דירוג 5.0 מעל 100 ביקורות - לצפייה בביקורות"
    >
      <BadgeInner />
    </Link>
  );
};

export default ReviewsRatingBadge;
