import type { ReactNode } from "react";

type Props = {
  kicker?: string;
  title: ReactNode;
  sub?: string;
  center?: boolean;
  as?: "h1" | "h2";
};

// כותרת סקשן בשפה הבהירה: eyebrow עם נקודת מותג, כותרת גדולה, תת-כותרת.
// מילת הדגשה בתוך title עוברת דרך <Accent> (סריף עברי נטוי).
const SectionHeader = ({ kicker, title, sub, center, as = "h2" }: Props) => {
  const Tag = as;
  return (
    <div className={`sec-head${center ? " center" : ""}`} data-reveal>
      {kicker && <span className="eyebrow">{kicker}</span>}
      <Tag className="sec-title">{title}</Tag>
      {sub && <p className="sec-sub">{sub}</p>}
    </div>
  );
};

/** החתימה של השפה: מילת הדגשה בסריף עברי נטוי (Frank Ruhl Libre עם skew) */
export const Accent = ({ children }: { children: ReactNode }) => <em className="acc">{children}</em>;

export default SectionHeader;
