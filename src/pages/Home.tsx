import { Link } from "react-router-dom";
import { CATALOG } from "../data/catalog";
import { GENERAL_FAQ, SITE } from "../data/site";
import { faqSchema, orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import ChatFinder from "../components/ChatFinder";
import LeadForm from "../components/LeadForm";
import Marquee from "../components/Marquee";
import TestimonialPlaceholder from "../components/TestimonialPlaceholder";
import {
  AiWorkerWindow,
  CrmWindow,
  LandingWindow,
  StoryboardWindow,
  StudyWindow,
} from "../components/MockWindows";

const pad2 = (n: number) => String(n).padStart(2, "0");
const FLAGSHIP = CATALOG.filter((c) => c.full);
const HOME_FAQ = GENERAL_FAQ.slice(0, 6);

/* עיגול-חץ קטן בקצה כפתור, בסגנון orbix */
const Orb = () => (
  <span className="btn-orb" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  </span>
);

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
      {/* Hero ממורכז + בלוק מוצר כהה */}
      <section className="hero">
        <div className="container">
          <p data-reveal><span className="eyebrow">{SITE.claim}</span></p>
          <h1 data-reveal>
            לא רק ללמוד AI.
            <br />
            <Accent>לדעת לעבוד איתו.</Accent>
          </h1>
          <p className="hero-sub" data-reveal>
            לומדים פנים מול פנים, בקבוצות קטנות, על העבודה האמיתית שלכם. בסוף כל מסלול יוצאים עם
            תוצר שעובד ועם שיטת עבודה שנשארת.
          </p>
          <div className="hero-ctas" data-reveal>
            <Link to="/courses" className="btn btn-primary">לצפייה במסלולים<Orb /></Link>
            <Link to="/course-finder" className="btn btn-ghost">עזרו לי לבחור</Link>
          </div>

          <div className="hero-media" data-reveal>
            <div className="hero-chips">
              <span className="hero-chip"><b>({pad2(CATALOG.length)})</b>מסלולים וסדנאות</span>
              <span className="hero-chip"><b>(00)</b>הקלטות. הכול חי</span>
              <span className="hero-chip"><b>(01)</b>תוצר ביד בסוף</span>
            </div>
            <ChatFinder />
          </div>
        </div>
      </section>

      {/* הצהרה + גריד תאי מסלולים */}
      <section className="section">
        <div className="container">
          <p className="statement" data-reveal>
            {pad2(CATALOG.length)} מסלולים וסדנאות פרונטליים, לכל מקצוע ולכל מטרה.
            {" "}בלי הרצאות תאורטיות, בלי ספריית הקלטות. <Accent>עובדים, בונים, יוצאים עם תוצר.</Accent>
          </p>
          <div style={{ marginTop: "clamp(36px, 5vw, 60px)" }} data-reveal>
            <p className="cells-note">המסלולים והסדנאות של האקדמיה · לחיצה על תא פותחת את המסלול</p>
            <div className="cells-grid">
              {CATALOG.map((c) => (
                <Link key={c.slug} to={`/courses/${c.slug}`} className="cell">
                  <span>
                    {c.title}
                    <span className="cell-kind">{c.kind} · {c.category}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* מה בונים: כרטיסי מדיה עם כיתוב */}
      <section className="section band-soft">
        <div className="container">
          <SectionHeader
            center
            kicker="מה בונים באקדמיה"
            title={<>תוצרים שבנו במסלולים, <Accent>לא הבטחות</Accent>.</>}
            sub="כל מסלול דגל מסתיים בתוצר עובד. ככה הם נראים מבפנים."
          />
          <div className="case-grid">
            <div className="case-item wide" data-reveal>
              <AiWorkerWindow />
              <div className="case-caption"><b>עובד AI שמכיר את הלקוח</b><span>מסלול מנהלי סושיאל</span></div>
            </div>
            <div className="case-item" data-reveal>
              <CrmWindow />
              <div className="case-caption"><b>CRM ומעקב תשלומים</b><span>מסלול בעלי עסקים</span></div>
            </div>
            <div className="case-item" data-reveal>
              <StoryboardWindow />
              <div className="case-caption"><b>מרעיון לסרטון גמור</b><span>מסלול וידאו ותוכן</span></div>
            </div>
            <div className="case-item" data-reveal>
              <StudyWindow />
              <div className="case-caption"><b>סביבת לימודים אישית</b><span>מסלול סטודנטים</span></div>
            </div>
            <div className="case-item" data-reveal>
              <LandingWindow />
              <div className="case-caption"><b>דף נחיתה שבונים לבד</b><span>סדנת דפי נחיתה</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* פס דיו: סטטיסטיקות ענק */}
      <section className="section band-ink">
        <div className="container">
          <div className="band-head" data-reveal>
            <h2>למה <Accent>האקדמיה של גוטמן?</Accent></h2>
            <p>
              כי פה לא צופים בהרצאה על AI. עובדים איתו בידיים, על החומרים שלכם, עד שיש תוצר ביד.
            </p>
          </div>
          <div className="stats-grid" data-reveal>
            <div className="stat-cell">
              <span className="stat-label">מסלולים וסדנאות פרונטליים, לכל מקצוע ומטרה</span>
              <span className="stat-num"><i>(</i>{pad2(CATALOG.length)}<i>)</i></span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">מסלולי דגל עם סילבוס מלא ופתוח באתר</span>
              <span className="stat-num"><i>(</i>{pad2(FLAGSHIP.length)}<i>)</i></span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">הקלטות ווובינרים. הכול חי, פנים מול פנים</span>
              <span className="stat-num"><i>(</i>00<i>)</i></span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">תוצר אמיתי שיוצאים איתו בסוף כל מסלול</span>
              <span className="stat-num"><i>(</i>01<i>)</i></span>
            </div>
          </div>
        </div>
        <Marquee />
      </section>

      {/* למה פרונטלי: גריד פיצ'רים */}
      <section className="section">
        <div className="container">
          <SectionHeader
            center
            kicker="למה דווקא פרונטלי"
            title={<>כי בהקלטה אי אפשר <Accent>לשאול</Accent>.</>}
          />
          <div className="feature-grid" data-reveal>
            {SITE.whyFrontal.map((p, i) => (
              <div className="feature-cell" key={p.title}>
                <span className="fi">{pad2(i + 1)}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* עקרונות: שורות ממוספרות עם צד דביק */}
      <section className="section band-soft">
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

      {/* המלצות: בכנות, בקרוב */}
      <section className="section">
        <div className="container">
          <SectionHeader
            center
            kicker="המלצות"
            title={<>מה משתתפים יגידו <Accent>עלינו</Accent>.</>}
            sub="האקדמיה נפתחת עכשיו. במקום ציטוטים מומצאים, המקומות האלה שמורים למשתתפים האמיתיים הראשונים."
          />
          <div className="testi-grid">
            <TestimonialPlaceholder roleHint="מנהל/ת סושיאל" />
            <TestimonialPlaceholder roleHint="בעל/ת עסק" />
            <TestimonialPlaceholder roleHint="סטודנט/ית" />
          </div>
        </div>
      </section>

      {/* שאלות: חצי-חצי עם כרטיס שיחה */}
      <section className="section band-soft">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker={`שאלות נפוצות (${pad2(GENERAL_FAQ.length)})`}
              title={<>יש שאלות? יש <Accent>תשובות</Accent>.</>}
              sub="ואם לא מצאתם כאן, דברו איתנו ישירות."
            />
            <div className="mini-call-card" data-reveal>
              <h4>מעדיפים בן אדם?</h4>
              <p>השאירו פרטים ונחזור אליכם עם תשובה לכל שאלה, בלי התחייבות.</p>
              <Link to="/contact" className="btn btn-primary btn-small">דברו איתנו<Orb /></Link>
            </div>
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
