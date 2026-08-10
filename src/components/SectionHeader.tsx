type Props = {
  kicker?: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
  as?: "h1" | "h2";
  /** Tighter spacing for dense pages (e.g. course detail). */
  compact?: boolean;
};

const SectionHeader = ({ kicker, title, sub, center, as = "h2", compact }: Props) => {
  const Tag = as;
  return (
    <div
      className={`${compact ? "mb-5 max-w-3xl" : "mb-10 max-w-3xl"}${center ? " mx-auto text-center" : ""}`}
      data-reveal
    >
      {kicker && (
        <span
          className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted ${
            compact ? "mb-1.5" : "mb-3"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          {kicker}
        </span>
      )}
      <Tag
        className={
          compact
            ? "text-2xl font-normal tracking-tight sm:text-3xl"
            : "text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl"
        }
      >
        {title}
      </Tag>
      {sub && (
        <p className={`leading-relaxed text-muted ${compact ? "mt-2 text-sm sm:text-base" : "mt-4 text-base sm:text-lg"}`}>
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
