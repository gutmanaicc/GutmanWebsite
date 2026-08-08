type Props = {
  kicker?: string;
  title: string;
  sub?: string;
  center?: boolean;
  as?: "h1" | "h2";
};

const SectionHeader = ({ kicker, title, sub, center, as = "h2" }: Props) => {
  const Tag = as;
  return (
    <div className={`sec-head${center ? " center" : ""}`} data-reveal>
      {kicker && (
        <span className="sec-kicker">
          <span className="console-label">
            <span className="dot-live" aria-hidden="true" />
            {kicker}
          </span>
        </span>
      )}
      <Tag className="sec-title">{title}</Tag>
      {sub && <p className="sec-sub">{sub}</p>}
    </div>
  );
};

export default SectionHeader;
