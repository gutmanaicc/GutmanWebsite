import { Link } from "react-router-dom";

type Props = {
  title?: string;
  sub?: string;
};

const CTASection = ({ title, sub }: Props) => (
  <section className="cta-band">
    <div className="container" data-reveal>
      <h2 className="sec-title">{title ?? "הצעד הראשון הוא לבחור מה אתם רוצים לדעת לעשות."}</h2>
      {sub && <p className="sec-sub" style={{ maxWidth: 620, marginInline: "auto" }}>{sub}</p>}
      <div className="hero-ctas" style={{ marginTop: "var(--sp-4)" }}>
        <Link to="/courses" className="btn btn-primary">לכל המסלולים</Link>
        <Link to="/course-finder" className="btn btn-ghost">עזרו לי לבחור מסלול</Link>
      </div>
    </div>
  </section>
);

export default CTASection;
