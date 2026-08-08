import { Link } from "react-router-dom";

type Crumb = { label: string; to?: string };

const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav className="crumbs container" aria-label="פירורי לחם">
    {items.map((c, i) => (
      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {i > 0 && <span className="sep" aria-hidden="true">/</span>}
        {c.to ? <Link to={c.to}>{c.label}</Link> : <span className="current" aria-current="page">{c.label}</span>}
      </span>
    ))}
  </nav>
);

export default Breadcrumbs;
