import { Link } from "react-router-dom";
import { CATALOG } from "../data/catalog";
import { GENERAL_FAQ, SITE } from "../data/site";
import { faqSchema, orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import CourseRow from "../components/CourseRow";
import ChatFinder from "../components/ChatFinder";
import LeadForm from "../components/LeadForm";
import Marquee from "../components/Marquee";
import {
  AiWorkerWindow,
  CrmWindow,
  LandingWindow,
  StoryboardWindow,
  StudyWindow,
} from "../components/MockWindows";

const pad2 = (n: number) => String(n).padStart(2, "0");
const FLAGSHIP_COUNT = CATALOG.filter((c) => c.full).length;
const HOME_FAQ = GENERAL_FAQ.slice(0, 5);

const Home = () => {
  useSeo({
    title: "Gutman Academy | האקדמיה הפרונטלית ללימודי AI בישראל",
    description:
      "מסלולי AI פרונטליים ומעשיים: סושיאל, וידאו ותוכן, סטודנטים, בעלי עסקים, מטפלים, מעצבי פנים, מפתחים ועוד. לומדים דרך בנייה ויוצאים עם תוצר אמיתי.",
    path: "/",
    schema: [orgSchema(), faqSchema(HOME_FAQ)],
  });
  useReveal();

  return (
    <>
      {/* Hero: טיפוגרפיה ענקית מיושרת להתחלה */}
      <section className="hero">
        <div className="container">
          <p className="eyebrow" data-reveal>{SITE.claim}</p>
          <h1 data-reveal>
            לא רק ללמוד AI.
            <br />
            <Accent>לדעת לעבוד איתו.</Accent>
          </h1>
          <div className="hero-foot" data-reveal>
            <p className="hero-sub">
              לומדים פנים מול פנים, בקבוצות קטנות, על העסק, הלקוח או הפרויקט האמיתיים שלכם. בסוף כל
              מסלול יוצאים עם תוצר שעובד ועם שיטת עבודה שנשארת.
            </p>
            <div className="hero-ctas">
              <Link to="/courses" className="btn btn-primary">לצפייה במסלולים</Link>
              <Link to="/course-finder" className="btn btn-ghost">עזרו לי לבחור</Link>
            </div>
          </div>

          <div className="hero-proof" data-reveal>
            <div className="proof-item">
              <span className="proof-num">{pad2(CATALOG.length)}</span>
              <span className="proof-label">מסלולים וסדנאות</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">{pad2(FLAGSHIP_COUNT)}</span>
              <span className="proof-label">מסלולי דגל עם סילבוס מלא</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">00</span>
              <span className="proof-label">הקלטות. הכול חי ופרונטלי</span>
            </div>
            <div className="proof-item">
              <span className="proof-num">01</span>
              <span className="proof-label">תוצר ביד בסוף כל מסלול</span>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* מה בונים: חלונות ממשק ברצועת גלילה */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`מה בונים באקדמיה (${pad2(FLAGSHIP_COUNT)})`}
            title={<>לא לומדים על זה. <Accent>בונים</Accent> את זה.</>}
            sub="כל מסלול מסתיים בתוצר שעובד. אלה לא הדמיות שיווקיות, זה מה שנבנה בפועל במפגשים."
          />
        </div>
        <div className="windows-scroller" data-reveal>
          <AiWorkerWindow />
          <CrmWindow />
          <StoryboardWindow />
          <StudyWindow />
          <LandingWindow />
        </div>
      </section>

      {/* כל המסלולים: רשימת שורות ענקית */}
      <section className="section" id="courses">
        <div className="container">
          <SectionHeader
            kicker={`המסלולים והסדנאות (${pad2(CATALOG.length)})`}
            title={<>לכל מקצוע יש כבר <Accent>מסלול</Accent>.</>}
            sub="בוחרים את העולם שלכם. כל מסלול בנוי סביב עבודה אמיתית ותוצר אחד ברור."
          />
        </div>
        <div className="container course-list">
          {CATALOG.map((c, i) => (
            <CourseRow key={c.slug} entry={c} index={i} />
          ))}
        </div>
      </section>

      {/* השיטה: שורות ממוספרות */}
      <section className="section">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker={`העקרונות (${pad2(SITE.principles.length)})`}
              title={<>ככה נראית למידה <Accent>שעובדת</Accent>.</>}
            />
          </div>
          <div className="num-rows">
            {SITE.principles.map((p, i) => (
              <div className="num-row" key={p.title} data-reveal>
                <span className="nr-num">({pad2(i + 1)})</span>
                <div className="nr-body">
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* למה פרונטלי */}
      <section className="section">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker={`למה דווקא פרונטלי (${pad2(SITE.whyFrontal.length)})`}
              title={<>כי בהקלטה אי אפשר <Accent>לשאול</Accent>.</>}
              sub="עובדים בזמן אמת, טועים, מתקנים, ויוצאים עם משהו ביד."
            />
          </div>
          <div className="num-rows">
            {SITE.whyFrontal.map((p, i) => (
              <div className="num-row" key={p.title} data-reveal>
                <span className="nr-num">({pad2(i + 1)})</span>
                <div className="nr-body">
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* המנחה */}
      <section className="section chat-band">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker="לא בטוחים איזה מסלול?"
              title={<>שתי שאלות, והמנחה <Accent>מכוון</Accent> אתכם.</>}
              sub="שיחה קצרה עם המנחה של האקדמיה, ותקבלו את המסלול שמתאים בדיוק למטרה שלכם."
            />
          </div>
          <ChatFinder />
        </div>
      </section>

      {/* שאלות נפוצות */}
      <section className="section">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker={`שאלות נפוצות (${pad2(GENERAL_FAQ.length)})`}
              title={<>מה שכולם <Accent>שואלים</Accent>.</>}
            />
            <p data-reveal>
              <Link to="/faq" className="btn btn-ghost btn-small">לכל השאלות</Link>
            </p>
          </div>
          <FAQAccordion items={HOME_FAQ} />
        </div>
      </section>

      {/* טופס */}
      <section className="section" id="lead-form">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker="נדבר?"
              title={<>נחזור אליכם עם <Accent>המלצה</Accent> אישית.</>}
              sub="ספרו לנו מי אתם ומה המטרה, ונכוון אתכם למסלול הנכון. בלי התחייבות ובלי ספאם."
            />
          </div>
          <LeadForm leadSource="home-general" />
        </div>
      </section>
    </>
  );
};

export default Home;
