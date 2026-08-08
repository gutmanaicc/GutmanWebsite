import { Link } from "react-router-dom";
import { COURSES } from "../data/courses";
import { GENERAL_FAQ, SITE } from "../data/site";
import { faqSchema, orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import CourseCard from "../components/CourseCard";
import ChatFinder from "../components/ChatFinder";
import LeadForm from "../components/LeadForm";
import CTASection from "../components/CTASection";
import {
  AiWorkerWindow,
  CrmWindow,
  LandingWindow,
  StoryboardWindow,
  StudyWindow,
} from "../components/MockWindows";

// הוכחות מספריות מחושבות מהנתונים בלבד, בלי להמציא כלום
const COURSE_COUNT = COURSES.length;
const MODULE_COUNT = COURSES.reduce((sum, c) => sum + c.syllabus.length, 0);
const FAQ_COUNT = GENERAL_FAQ.length;

const pad2 = (n: number) => String(n).padStart(2, "0");

const HOME_FAQ = GENERAL_FAQ.slice(0, 4);

const Home = () => {
  useSeo({
    title: "Gutman Academy | האקדמיה הפרונטלית ללימודי AI בישראל",
    description:
      "מסלולי AI פרונטליים ומעשיים למנהלי סושיאל, סטודנטים, יוצרי תוכן, עורכי וידאו ובעלי עסקים. לומדים דרך בנייה ויוצאים עם תוצר אמיתי.",
    path: "/",
    schema: [orgSchema(), faqSchema(HOME_FAQ)],
  });
  useReveal();

  return (
    <>
      {/* Hero */}
      <section className="hero no-line">
        <div className="container hero-inner">
          <span className="eyebrow" data-reveal>{SITE.claim}</span>
          <h1 data-reveal>
            {SITE.hero.title}
            <br />
            <Accent>{SITE.hero.titleAccent}</Accent>
          </h1>
          <p className="hero-sub" data-reveal>{SITE.hero.subtitle}</p>
          <div className="hero-ctas" data-reveal>
            <Link to="/courses" className="btn btn-primary">{SITE.hero.primaryCta}</Link>
            <Link to="/course-finder" className="btn btn-ghost">{SITE.hero.secondaryCta}</Link>
          </div>
          <div className="hero-proof" data-reveal>
            <div className="proof-item">
              <span className="proof-num">{pad2(COURSE_COUNT)}</span>
              <span className="proof-label">מסלולים מקצועיים</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">{pad2(MODULE_COUNT)}</span>
              <span className="proof-label">חלקי לימוד ובנייה</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">{pad2(COURSE_COUNT)}</span>
              <span className="proof-label">תוצרים שיוצאים איתם</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">01</span>
              <span className="proof-label">שיטת עבודה שנשארת</span>
            </div>
          </div>
        </div>
      </section>

      {/* מה בונים באקדמיה */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`מה בונים באקדמיה (${pad2(COURSE_COUNT)})`}
            title={<>לא לומדים על זה. <Accent>בונים</Accent> את זה.</>}
            sub="כל מסלול מסתיים בתוצר שעובד: עובד AI ללקוח, מערכת עסקית, פרויקט וידאו, סביבת לימודים או דף נחיתה. ככה זה נראה."
          />
          <div className="windows-grid">
            <AiWorkerWindow />
            <CrmWindow />
            <StoryboardWindow />
            <StudyWindow />
            <LandingWindow />
          </div>
        </div>
      </section>

      {/* עקרונות */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`העקרונות שלנו (${pad2(SITE.principles.length)})`}
            title={<>ככה נראית למידה <Accent>שעובדת</Accent>.</>}
          />
          <div className="num-grid">
            {SITE.principles.map((p, i) => (
              <div className="num-cell" key={p.title} data-reveal>
                <span className="num">({pad2(i + 1)})</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* מסלולים */}
      <section className="section" id="courses">
        <div className="container">
          <SectionHeader
            kicker={`המסלולים (${pad2(COURSE_COUNT)})`}
            title={<>מסלול לכל <Accent>מקצוע</Accent>, מטרה ותוצר.</>}
            sub="חמישה מסלולים פרונטליים, כל אחד בנוי סביב עולם עבודה אחד ותוצר אחד ברור."
          />
          <div className="courses-grid">
            {COURSES.map((c, i) => (
              <CourseCard key={c.slug} course={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* למה פרונטלי */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`למה דווקא פרונטלי (${pad2(SITE.whyFrontal.length)})`}
            title={<>כי בהקלטה אי אפשר <Accent>לשאול</Accent>.</>}
            sub="הלב של האקדמיה הוא למידה פנים מול פנים: עובדים בזמן אמת, טועים, מתקנים ויוצאים עם תוצר."
          />
          <div className="num-grid">
            {SITE.whyFrontal.map((p, i) => (
              <div className="num-cell" key={p.title} data-reveal>
                <span className="num">({pad2(i + 1)})</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* איך זה עובד */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`איך זה עובד (${pad2(SITE.howItWorks.length)})`}
            title={<>מהבחירה ועד <Accent>התוצר</Accent>, בחמישה צעדים.</>}
          />
          <div className="num-grid">
            {SITE.howItWorks.map((s, i) => (
              <div className="num-cell" key={s.title} data-reveal>
                <span className="num">({pad2(i + 1)})</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* המנחה */}
      <section className="section">
        <div className="container">
          <SectionHeader
            center
            kicker="לא בטוחים איזה מסלול?"
            title={<>שתי שאלות, והמנחה <Accent>מכוון</Accent> אתכם.</>}
            sub="שיחה קצרה עם המנחה של האקדמיה, ותקבלו את המסלול שנבנה בדיוק בשביל המטרה שלכם."
          />
          <ChatFinder />
        </div>
      </section>

      {/* שאלות נפוצות */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`שאלות נפוצות (${pad2(FAQ_COUNT)})`}
            title={<>מה שכולם <Accent>שואלים</Accent> לפני שנרשמים.</>}
          />
          <FAQAccordion items={HOME_FAQ} />
          <p style={{ marginTop: 24 }} data-reveal>
            <Link to="/faq" className="btn btn-ghost btn-small">לכל השאלות והתשובות</Link>
          </p>
        </div>
      </section>

      {/* טופס כללי */}
      <section className="section" id="lead-form">
        <div className="container two-col">
          <SectionHeader
            kicker="נדבר?"
            title={<>נחזור אליכם עם <Accent>המלצה</Accent> אישית.</>}
            sub="ספרו לנו מי אתם ומה המטרה, ונכוון אתכם למסלול הנכון. בלי התחייבות ובלי ספאם."
          />
          <LeadForm leadSource="home-general" />
        </div>
      </section>

      <CTASection />
    </>
  );
};

export default Home;
