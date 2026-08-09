import { Link } from "react-router-dom";
import { CATALOG } from "../data/catalog";
import { getCourse } from "../data/courses";
import { GENERAL_FAQ, SITE } from "../data/site";
import { faqSchema, orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import FAQAccordion from "../components/FAQAccordion";
import ChatFinder from "../components/ChatFinder";
import LeadForm from "../components/LeadForm";
import Marquee from "../components/Marquee";
import TestimonialPlaceholder from "../components/TestimonialPlaceholder";
import { COURSE_ART, COURSE_LOOPS, COURSE_LOOPS_WEBM, SHOWREEL, SHOWREEL_POSTER, SHOWREEL_WEBM, WIDE_BANNER, WIDE_BANNER_LOOP, WIDE_BANNER_LOOP_WEBM } from "../data/courseArt";
import AmbientMedia from "../components/AmbientMedia";
import { CrmWindow, StoryboardWindow } from "../components/MockWindows";
import { Words } from "../components/Words";

const pad2 = (n: number) => String(n).padStart(2, "0");
/* הגוונים שמעליהם הכותרת חייבת להתהפך ללבן */
const DARK_TONES = new Set(["tone-ink", "tone-pink", "tone-graphite", "tone-deep"]);
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
          <h1 data-reveal className="hero-title">
            <Words text="לא רק ללמוד AI." />
            <br />
            <Accent>
              <Words text="לדעת לעבוד איתו." start={4} />
            </Accent>
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
            <div className="hero-side side-a" aria-hidden="true"><CrmWindow /></div>
            <div className="hero-side side-b" aria-hidden="true"><StoryboardWindow /></div>
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
          <div className="wide-banner" style={{ marginTop: "clamp(32px, 4.5vw, 56px)" }} data-reveal>
            <AmbientMedia video={WIDE_BANNER_LOOP} videoWebm={WIDE_BANNER_LOOP_WEBM} poster={WIDE_BANNER} />
          </div>
          <div style={{ marginTop: "clamp(36px, 5vw, 60px)" }} data-reveal>
            <p className="cells-note">המסלולים והסדנאות של האקדמיה · לחיצה על שורה פותחת את המסלול</p>
            <div className="index-list">
              {CATALOG.map((c, i) => (
                <Link key={c.slug} to={`/courses/${c.slug}`} className="index-row">
                  <span className="index-num">({pad2(i + 1)})</span>
                  <span className="index-title">
                    {c.title}
                    <span className="index-kind">{c.kind} · {c.category}</span>
                  </span>
                  <span className="index-go">
                    <span>לפתיחת המסלול</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* עולמות המסלולים: סלאבים במסך מלא שנערמים בגלילה, כמו סקשן השירותים של orbix */}
      <div className="stack-slides">
        {FLAGSHIP.map((c, i) => {
          const course = getCourse(c.slug);
          const tone = ["tone-ink", "tone-paper", "tone-pink", "tone-graphite", "tone-deep"][i % 5];
          return (
            <Link
              key={c.slug}
              to={`/courses/${c.slug}`}
              className={`stack-slide ${tone}`}
              data-surface={DARK_TONES.has(tone) ? "dark" : "light"}
            >
              <span className="ss-num">({pad2(i + 1)})</span>
              <span className="ss-explore">
                לגלות את המסלול
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </span>
              <span className="ss-inner">
                <span className="ss-title">{c.title}</span>
                {course && <span className="ss-sub" style={{ display: "block" }}>{course.tagline}</span>}
              </span>
            </Link>
          );
        })}
      </div>

      {/* מה בונים: כרטיסי תמונה עם כיתוב, כמו Featured Case Studies */}
      <section className="section band-soft">
        <div className="container">
          <SectionHeader
            center
            kicker="מה בונים באקדמיה"
            title={<>עולמות שבונים בהם, <Accent>לא מקשיבים</Accent>.</>}
            sub="כל מסלול דגל בנוי סביב עולם עבודה אחד ומסתיים בתוצר עובד."
          />
          <div className="case-grid">
            {[
              { slug: "social-media-ai", label: "עובד AI שמכיר את הלקוח", cat: "מסלול מנהלי סושיאל", wide: true },
              { slug: "ai-video-content", label: "מרעיון לסרטון גמור", cat: "מסלול וידאו ותוכן" },
              { slug: "ai-business-systems", label: "CRM ומעקב תשלומים", cat: "מסלול בעלי עסקים" },
              { slug: "ai-for-students", label: "סביבת לימודים אישית", cat: "מסלול סטודנטים" },
              { slug: "ai-landing-page", label: "דף נחיתה שבונים לבד", cat: "סדנת דפי נחיתה" },
            ].map((it) => (
              <div className={`case-item${it.wide ? " wide" : ""}`} key={it.slug} data-reveal>
                <Link to={`/courses/${it.slug}`} className="case-photo">
                  <AmbientMedia video={COURSE_LOOPS[it.slug]} videoWebm={COURSE_LOOPS_WEBM[it.slug]} poster={COURSE_ART[it.slug]} alt={it.label} />
                </Link>
                <div className="case-caption"><b>{it.label}</b><span>{it.cat}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* פס דיו: סטטיסטיקות ענק */}
      <section className="section band-ink" data-surface="dark">
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
              <span className="stat-num">{CATALOG.length}<i>+</i></span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">מסלולי דגל עם סילבוס מלא ופתוח באתר</span>
              <span className="stat-num">{FLAGSHIP.length}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">הקלטות ווובינרים. הכול חי, פנים מול פנים</span>
              <span className="stat-num">0</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">תוצר אמיתי שיוצאים איתו בסוף כל מסלול</span>
              <span className="stat-num">1</span>
            </div>
          </div>
        </div>
      </section>

      {/* שואוריל: חמשת העולמות בשוט אחד */}
      <section className="section band-soft">
        <div className="container">
          <SectionHeader
            center
            kicker="בשוט אחד"
            title={<>חמישה עולמות. קו עבודה <Accent>אחד</Accent>.</>}
          />
          <div className="showreel" data-reveal>
            <AmbientMedia video={SHOWREEL} videoWebm={SHOWREEL_WEBM} poster={SHOWREEL_POSTER} alt="חמשת עולמות המסלולים של האקדמיה בשוט רציף אחד" />
          </div>
        </div>
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

      {/* פס המסלולים הנע, על דיו, כמו Present on Top Creative Platforms */}
      <section className="band-ink" data-surface="dark" style={{ paddingBlock: "clamp(28px, 4vw, 48px)" }}>
        <Marquee />
      </section>

      {/* טופס: כרטיס כהה + שדות קו-תחתון, כמו Book a Free Discovery Call */}
      <section className="section" id="lead-form">
        <div className="container split-section">
          <div className="split-aside">
            <div className="cta-card" data-reveal>
              <span className="eyebrow">נדבר?</span>
              <h2>מוכנים לבנות עם AI בידיים?</h2>
              <p>
                ספרו לנו מי אתם ומה המטרה, ונחזור אליכם עם המלצה אישית על מסלול. בלי התחייבות ובלי
                ספאם.
              </p>
              <p className="cc-trust">
                <b>{pad2(CATALOG.length)} מסלולים וסדנאות</b> · קבוצות קטנות · פנים מול פנים · תוצר ביד
              </p>
            </div>
          </div>
          <LeadForm leadSource="home-general" />
        </div>
      </section>
    </>
  );
};

export default Home;
