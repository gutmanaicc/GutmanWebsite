import { COURSES } from "../data/courses";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import CourseCard from "../components/CourseCard";
import CTASection from "../components/CTASection";
import Breadcrumbs from "../components/Breadcrumbs";

const pad2 = (n: number) => String(n).padStart(2, "0");

const Courses = () => {
  useSeo({
    title: "המסלולים | Gutman Academy",
    description:
      "חמישה מסלולי AI פרונטליים ומעשיים: מנהלי סושיאל, סטודנטים, וידאו ותוכן, בעלי עסקים ובניית דף נחיתה. כל מסלול מסתיים בתוצר אמיתי.",
    path: "/courses",
    schema: [orgSchema()],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "מסלולים" }]} />
      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container">
          <SectionHeader
            as="h1"
            kicker={`המסלולים (${pad2(COURSES.length)})`}
            title={<>בוחרים מטרה. יוצאים עם <Accent>תוצר</Accent>.</>}
            sub="כל מסלול בנוי סביב עולם עבודה אחד: הבעיה שלו, השיטה שפותרת אותה, והתוצר שבונים במהלך המפגשים. אין מסלול כללי על AI, כי אין עבודה כללית."
          />
          <div className="courses-grid">
            {COURSES.map((c, i) => (
              <CourseCard key={c.slug} course={c} index={i} />
            ))}
          </div>
        </div>
      </section>
      <CTASection
        title="עדיין מתלבטים בין מסלולים?"
        sub="המנחה של האקדמיה שואל שתי שאלות קצרות ומכוון אתכם למסלול שנבנה בשביל המטרה שלכם."
      />
    </>
  );
};

export default Courses;
