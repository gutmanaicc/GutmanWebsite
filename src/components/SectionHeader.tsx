type Props = {
  kicker?: string;
  /** מספר סקשן עילי בסגנון orbix: ‎(01)‎ */
  index?: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
  as?: "h1" | "h2";
  /** Tighter spacing for dense pages (e.g. course detail). */
  compact?: boolean;
};

const SectionHeader = ({ kicker, index, title, sub, center, as = "h2", compact }: Props) => {
  const Tag = as;
  return (
    <div
      className={`${compact ? "mb-5 max-w-3xl" : "mb-12 max-w-4xl sm:mb-14"}${center ? " mx-auto text-center" : ""}`}
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
      <Tag className={compact ? "text-2xl font-semibold tracking-tight sm:text-3xl" : "display-2 text-ink"}>
        {title}
      </Tag>
      {sub && (
        <p
          className={`leading-relaxed text-muted ${
            compact ? "mt-2 text-sm sm:text-base" : "mt-5 max-w-2xl text-base sm:text-lg"
          }${center ? " mx-auto" : ""}`}
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
