import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import LeadForm from "../components/LeadForm";

const Contact = () => {
  useSeo({
    title: "צור קשר | Gutman Academy",
    description:
      "שאלה על מסלול, בקשה להתאמה אישית או כל דבר אחר. השאירו פרטים או כתבו לנו, ונחזור אליכם.",
    path: "/contact",
    schema: [orgSchema()],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "צור קשר" }]} />

      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container two-col">
          <div>
            <SectionHeader
              as="h1"
              kicker="מדברים"
              title={<>יש שאלה? נשמח <Accent>לענות</Accent>.</>}
              sub="שאלות על מסלול, התאמות לקבוצות וצוותים, או כל דבר אחר. הדרך המהירה ביותר היא הטופס, ואנחנו חוזרים לכל פנייה."
            />
            <div className="prose" data-reveal>
              <p>
                אפשר גם במייל:{" "}
                <a href="mailto:gutmanaicc@gmail.com" style={{ color: "var(--ink)", fontWeight: 600 }}>
                  gutmanaicc@gmail.com
                </a>
              </p>
              <p>
                לפניות בנושא נגישות פועל באתר תפריט נגישות ייעודי, והצהרת הנגישות המלאה זמינה דרכו,
                כולל פרטי רכז הנגישות.
              </p>
            </div>
          </div>
          <LeadForm
            leadSource="contact"
            title="השאירו פרטים ונחזור אליכם"
            sub="ספרו לנו במה מדובר, ונחזור אליכם בהקדם."
          />
        </div>
      </section>
    </>
  );
};

export default Contact;
