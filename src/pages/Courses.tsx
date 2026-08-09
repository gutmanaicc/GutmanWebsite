import { Link } from "react-router-dom";
import { CATALOG } from "../data/catalog";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import CTASection from "../components/CTASection";
import Breadcrumbs from "../components/Breadcrumbs";


const Courses = () => {
  useSeo({
    title: "המסלולים והסדנאות | Gutman Academy",
    description:
      "כל מסלולי ה-AI הפרונטליים של האקדמיה: סושיאל, וידאו ותוכן, סטודנטים, בעלי עסקים, דפי נחיתה, מטפלים, מעצבי פנים, ADHD, אופנה, מפתחים, CRM וארגונים.",
    path: "/courses",
    schema: [orgSchema()],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "מסלולים" }]} />
      <section className="section page-head">
        <div className="container">
          <SectionHeader
            as="h1"
            center
            kicker="הסדנאות של האקדמיה"
            title={<>בוחרים עולם. יוצאים עם <Accent>תוצר</Accent>.</>}
            sub="כל מסלול בנוי סביב מקצוע או צורך אחד, ומסתיים בתוצר שממשיך לעבוד גם אחרי המפגש האחרון."
          />
          <div className="num-grid" data-reveal>
            {CATALOG.map((c) => (
              <Link key={c.slug} to={`/courses/${c.slug}`} className="num-cell dir-cell">
                <h3>{c.title}</h3>
                <p>{c.blurb}</p>
                <span className="dir-meta">{c.kind} · {c.category}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title="עדיין מתלבטים בין מסלולים?"
        sub="המנחה של האקדמיה שואל שתי שאלות קצרות ומכוון אתכם למסלול שמתאים למטרה שלכם."
      />
    </>
  );
};

export default Courses;
