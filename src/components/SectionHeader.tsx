type Props = {
  kicker?: string;
  /** מספר סקשן עילי בסגנון orbix: ‎(01)‎ */
  index?: string;
  title: React.ReactNode;
  sub?: string;
  /**
   * נשמר לצורך תאימות לאחור בלבד. כל הכותרות באתר ממורכזות,
   * ולכן הדגל הזה כבר לא משנה את הפריסה.
   */
  center?: boolean;
  as?: "h1" | "h2";
  /** Tighter spacing for dense pages (e.g. course detail). */
  compact?: boolean;
};

/**
 * כותרת סקשן אחידה לכל האתר - תמיד ממורכזת.
 * המרכוז הוא החלטה גלובלית ולא פר-סקשן, כדי שהקצב של הדף יישאר זהה
 * מלמעלה עד למטה ולא יקפוץ בין יישור לימין ליישור למרכז.
 */
const SectionHeader = ({ kicker, index, title, sub, as = "h2", compact }: Props) => {
  const Tag = as;
  return (
    <div
      className={`mx-auto text-center ${compact ? "mb-5 max-w-3xl" : "mb-12 max-w-4xl sm:mb-14"}`}
      data-reveal
    >
      {kicker && (
        <span className={`section-label ${compact ? "mb-2" : "mb-4"}`}>
          {index && (
            <span className="section-label-num" dir="ltr">
              ({index})
            </span>
          )}
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          {kicker}
        </span>
      )}
      <Tag
        className={
          compact ? "text-2xl font-semibold tracking-tight sm:text-3xl" : "display-2 text-ink"
        }
      >
        {title}
      </Tag>
      {sub && (
        <p
          className={`mx-auto leading-relaxed text-muted ${
            compact ? "mt-2 text-sm sm:text-base" : "mt-5 max-w-2xl text-base sm:text-lg"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;

export function AccentWord({ children }: { children: React.ReactNode }) {
  return <em className="accent-serif not-italic">{children}</em>;
}
