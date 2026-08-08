import { Link } from "react-router-dom";
import { GENERAL_FAQ } from "../data/site";
import { faqSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import FAQAccordion from "../components/FAQAccordion";
import CTASection from "../components/CTASection";

const pad2 = (n: number) => String(n).padStart(2, "0");

const FAQPage = () => {
  useSeo({
    title: "שאלות נפוצות | Gutman Academy",
    description:
      "כל מה ששואלים אותנו לפני שנרשמים למסלולי ה-AI של האקדמיה: ניסיון קודם, פורמט פרונטלי, ציוד, חומרי עזר ותוצרים.",
    path: "/faq",
    schema: [faqSchema(GENERAL_FAQ)],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "שאלות נפוצות" }]} />

      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container">
          <SectionHeader
            as="h1"
            kicker={`שאלות נפוצות (${pad2(GENERAL_FAQ.length)})`}
            title={<>כל מה שרציתם <Accent>לשאול</Accent>.</>}
            sub="ואם לא מצאתם כאן תשובה, אפשר תמיד לשאול אותנו ישירות בעמוד יצירת הקשר."
          />
          <FAQAccordion items={GENERAL_FAQ} />
          <p style={{ marginTop: 28 }} data-reveal>
            <Link to="/contact" className="btn btn-ghost btn-small">יש לכם שאלה אחרת? דברו איתנו</Link>
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
};

export default FAQPage;
