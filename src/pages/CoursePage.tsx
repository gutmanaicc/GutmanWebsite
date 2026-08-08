import { Navigate, useParams } from "react-router-dom";
import { getCourse } from "../data/courses";
import { courseSchema, faqSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import FAQAccordion from "../components/FAQAccordion";
import LeadForm from "../components/LeadForm";
import { CheckIcon, XIcon } from "../components/icons";

const pad2 = (n: number) => String(n).padStart(2, "0");

// פרטי לוגיסטיקה שטרם נסגרו מוצגים בכנות כ"ייסגר בקרוב"
const LOGISTICS_LABELS: { key: "format" | "sessions" | "sessionLength" | "location" | "groupSize" | "equipment" | "support" | "materials" | "nextCohort"; label: string }[] = [
  { key: "format", label: "פורמט" },
  { key: "sessions", label: "מספר מפגשים" },
  { key: "sessionLength", label: "אורך מפגש" },
  { key: "location", label: "מיקום" },
  { key: "groupSize", label: "גודל קבוצה" },
  { key: "equipment", label: "ציוד נדרש" },
  { key: "support", label: "ליווי" },
  { key: "materials", label: "חומרים" },
  { key: "nextCohort", label: "מחזור קרוב" },
];

const CoursePage = () => {
  const { slug } = useParams();
  const course = slug ? getCourse(slug) : undefined;

  useSeo({
    title: course ? `${course.title} | Gutman Academy` : "מסלול | Gutman Academy",
    description: course ? course.tagline : "",
    path: course ? `/courses/${course.slug}` : "/courses",
    schema: course ? [courseSchema(course), faqSchema(course.faq)] : undefined,
  });
  useReveal([slug]);

  if (!course) return <Navigate to="/courses" replace />;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "ראשי", to: "/" },
          { label: "מסלולים", to: "/courses" },
          { label: course.shortTitle },
        ]}
      />

      {/* פתיח */}
      <section className="course-hero">
        <div className="container">
          <span className="eyebrow" data-reveal>{course.category}</span>
          <h1 data-reveal>{course.title}</h1>
          <p className="hero-sub" data-reveal>{course.tagline}</p>
          <div className="badge-row" data-reveal>
            <span className="badge">{course.logistics.format}</span>
            <span className="badge">{course.experienceLevel}</span>
            <span className="badge accent">{pad2(course.syllabus.length)} חלקי לימוד ובנייה</span>
          </div>
          <div className="hero-ctas" data-reveal>
            <a href="#lead-form" className="btn btn-primary">{course.ctaText}</a>
            <a href="#syllabus" className="btn btn-ghost">מה לומדים בפנים</a>
          </div>
        </div>
      </section>

      {/* הבעיה והפתרון */}
      <section className="section">
        <div className="container two-col">
          <div>
            <SectionHeader
              kicker="הבעיה"
              title={<>מה <Accent>שוחק</Accent> אתכם היום.</>}
            />
            <div className="prose" data-reveal>
              {course.problem.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              kicker="התוצאה"
              title={<>מה <Accent>נבנה</Accent> במקום.</>}
            />
            <div className="prose" data-reveal>
              <p>{course.outcome}</p>
              {course.methodName && (
                <p><b>{course.methodName}</b></p>
              )}
            </div>
            <div className="course-note" data-reveal>
              <b>התוצר הסופי: </b>
              {course.finalDeliverable}
            </div>
          </div>
        </div>
      </section>

      {/* יכולות */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`מה תדעו לעשות (${pad2(course.capabilities.length)})`}
            title={<>יכולות שנשארות <Accent>אצלכם</Accent>.</>}
          />
          <div className="chip-row" data-reveal>
            {course.capabilities.map((c) => (
              <span className="chip" key={c}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* סילבוס */}
      <section className="section" id="syllabus">
        <div className="container">
          <SectionHeader
            kicker={`הסילבוס (${pad2(course.syllabus.length)})`}
            title={<>לומדים, מתרגלים, <Accent>בונים</Accent>.</>}
            sub="כל חלק בנוי מאותם ארבעה צעדים: מה לומדים, מה מתרגלים, מה בונים ועם מה יוצאים."
          />
          <div className="syllabus">
            {course.syllabus.map((m, i) => (
              <div className="syl-module" key={m.title} data-reveal>
                <span className="syl-num">({pad2(i + 1)})</span>
                <div className="syl-body">
                  <h3>{m.title}</h3>
                  <div className="syl-rows">
                    <div className="syl-row">
                      <span className="k">לומדים</span>
                      <span className="v">{m.learn}</span>
                    </div>
                    <div className="syl-row">
                      <span className="k">מתרגלים</span>
                      <span className="v">{m.practice}</span>
                    </div>
                    <div className="syl-row">
                      <span className="k">בונים</span>
                      <span className="v">{m.build}</span>
                    </div>
                  </div>
                  <p className="syl-takeaway">
                    <span className="k">יוצאים עם:</span>
                    <span className="v">{m.takeaway}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* נושאים */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`הנושאים (${pad2(course.topics.length)})`}
            title={<>מה נכנס <Accent>פנימה</Accent>.</>}
          />
          <div className="chip-row" data-reveal>
            {course.topics.map((t) => (
              <span className="chip" key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* למי מתאים */}
      <section className="section">
        <div className="container two-col">
          <div className="panel" data-reveal>
            <h3>למי המסלול מתאים</h3>
            <ul className="check-list">
              {course.suitability.map((s) => (
                <li key={s}>
                  <span className="ic yes" aria-hidden="true"><CheckIcon /></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel" data-reveal>
            <h3>למי הוא לא מתאים</h3>
            <ul className="check-list">
              {course.notSuitableFor.map((s) => (
                <li key={s}>
                  <span className="ic no" aria-hidden="true"><XIcon /></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* לוגיסטיקה */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker="הפרטים"
            title={<>הלוגיסטיקה, על <Accent>השולחן</Accent>.</>}
          />
          <div className="logistics-grid" data-reveal>
            {LOGISTICS_LABELS.map(({ key, label }) => {
              const value = course.logistics[key];
              return (
                <div className="log-cell" key={key}>
                  <span className="k">{label}</span>
                  <span className={`v${value ? "" : " soon"}`}>{value || "ייסגר בקרוב"}</span>
                </div>
              );
            })}
          </div>
          {course.note && <p className="course-note" data-reveal>{course.note}</p>}
        </div>
      </section>

      {/* שאלות על המסלול */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`שאלות על המסלול (${pad2(course.faq.length)})`}
            title={<>מה ששואלים אותנו <Accent>הכי הרבה</Accent>.</>}
          />
          <FAQAccordion items={course.faq} />
        </div>
      </section>

      {/* טופס */}
      <section className="section" id="lead-form">
        <div className="container two-col">
          <SectionHeader
            kicker="שריינו מקום"
            title={<>הקבוצות <Accent>קטנות</Accent>. הפרטים לפניכם.</>}
            sub="השאירו פרטים ונחזור אליכם עם כל מה שצריך לדעת: מועדים, מחירים ותשובות לכל שאלה."
          />
          <LeadForm
            courseSlug={course.slug}
            leadSource={course.leadSource}
            title={course.ctaText}
            sub="בלי התחייבות ובלי ספאם. נחזור אליכם עם כל הפרטים על המסלול."
          />
        </div>
      </section>
    </>
  );
};

export default CoursePage;
