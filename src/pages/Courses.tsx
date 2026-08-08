import { CATALOG } from "../data/catalog";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import CourseRow from "../components/CourseRow";
import CTASection from "../components/CTASection";
import Breadcrumbs from "../components/Breadcrumbs";

const pad2 = (n: number) => String(n).padStart(2, "0");

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
      <section className="section no-line page-head">
        <div className="container">
          <SectionHeader
            as="h1"
            kicker={`המסלולים והסדנאות (${pad2(CATALOG.length)})`}
            title={<>בוחרים עולם. יוצאים עם <Accent>תוצר</Accent>.</>}
            sub="כל מסלול בנוי סביב מקצוע או צורך אחד, ומסתיים בתוצר שממשיך לעבוד גם אחרי המפגש האחרון. אין מסלול כללי על AI, כי אין עבודה כללית."
          />
        </div>
        <div className="container course-list">
          {CATALOG.map((c, i) => (
            <CourseRow key={c.slug} entry={c} index={i} />
          ))}
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
