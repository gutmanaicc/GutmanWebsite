import { CATALOG } from "../data/catalog";

// רצועת marquee נעה עם שמות כל המסלולים, בסגנון orbix. מכבדת reduced-motion דרך CSS.
const Marquee = () => {
  const items = CATALOG.map((c) => c.title);
  const strip = (key: string, hidden = false) => (
    <div className="marquee-strip" aria-hidden={hidden || undefined} key={key}>
      {items.map((t) => (
        <span className="marquee-item" key={key + t}>
          {t}
          <span className="marquee-dot" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee" role="marquee" aria-label="המסלולים והסדנאות של האקדמיה">
      <div className="marquee-track">
        {strip("a")}
        {strip("b", true)}
      </div>
    </div>
  );
};

export default Marquee;
