import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { getCourse } from "../data/courses";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import TestimonialPlaceholder from "../components/TestimonialPlaceholder";
import CTASection from "../components/CTASection";
import { ArrowIcon } from "../components/icons";

const pad2 = (n: number) => String(n).padStart(2, "0");

const Results = () => {
  useSeo({
    title: "תוצאות והמלצות | Gutman Academy",
    description:
      "התוצרים שבונים במסלולי האקדמיה: עובדי AI ללקוחות, מערכות CRM, פרויקטי וידאו, סביבות לימודים ודפי נחיתה. המלצות ממשתתפים יעלו אחרי המחזורים הראשונים.",
    path: "/results",
    schema: [orgSchema()],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "תוצאות והמלצות" }]} />

      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container">
          <SectionHeader
            as="h1"
            kicker={`התוצרים (${pad2(SITE.deliverableGallery.length)})`}
            title={<>לא מבטיחים. <Accent>מראים</Accent>.</>}
            sub="אלה התוצרים שבונים במסלולים, אחד אחד. כל פריט מוביל למסלול שבו בונים אותו."
          />
          <div className="gallery-grid">
            {SITE.deliverableGallery.map((d) => {
              const c = getCourse(d.course);
              if (!c) return null;
              return (
                <Link key={d.title} to={`/courses/${c.slug}`} className="gallery-item" data-reveal>
                  <span>{d.title}</span>
                  <span className="arrow" aria-hidden="true"><ArrowIcon /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            kicker="המלצות"
            title={<>ההמלצות בדרך. אנחנו לא <Accent>ממציאים</Accent> אותן.</>}
            sub="האקדמיה נפתחת עכשיו, והמחזורים הראשונים בדרך. במקום ציטוטים מומצאים, המקומות האלה מחכים למשתתפים האמיתיים הראשונים."
          />
          <div className="testi-grid">
            <TestimonialPlaceholder roleHint="מנהל/ת סושיאל" />
            <TestimonialPlaceholder roleHint="בעל/ת עסק" />
            <TestimonialPlaceholder roleHint="סטודנט/ית" />
          </div>
        </div>
      </section>

      <CTASection
        title="רוצים להיות ההמלצה הראשונה?"
        sub="המחזורים הראשונים קטנים במיוחד. בחרו מסלול והשאירו פרטים."
      />
    </>
  );
};

export default Results;
