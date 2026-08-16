import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** Visible label - default short RTL label */
  label?: string;
  className?: string;
  fallbackTo?: string;
};

/**
 * Subtle history-aware back control for course / sub-track pages.
 * Prefers browser history; falls back to the courses index when there is no prior in-app page.
 */
const BackButton = ({
  label = "חזרה",
  className = "",
  fallbackTo = "/courses",
}: Props) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={[
        "inline-flex min-h-11 items-center gap-2 py-2 text-sm font-medium",
        "text-[#191919] transition-colors hover:text-[#FF2D85]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F4F2]",
        "rounded-md",
        className,
      ].join(" ")}
      aria-label="חזרה לעמוד הקודם"
    >
      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
