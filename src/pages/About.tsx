import { SITE } from "../data/site";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import CTASection from "../components/CTASection";

const pad2 = (n: number) => String(n).padStart(2, "0");

const About = () => {
  useSeo({
    title: "אודות | Gutman Academy",
    description:
      "האקדמיה הפרונטלית ללימודי בינה מלאכותית של רון גוטמן: למידה דרך בנייה, תוצרים אמיתיים ושיטת עבודה שנשארת אחרי המפגש האחרון.",
    path: "/about",
    schema: [orgSchema()],
  });
  useReveal();

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "אודות" }]} />

      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container">
          <SectionHeader
            as="h1"
            kicker={SITE.claim}
            title={<>נעים להכיר: <Accent>{SITE.hebrewName}</Accent>.</>}
            sub={SITE.tagline}
          />
          <div className="two-col">
            <div className="prose" data-reveal>
              <p>
                האקדמיה נולדה מתוך תסכול פשוט: כולם מדברים על AI, רוב האנשים כבר ניסו אותו, ומעט מדי
                באמת יודעים לעבוד איתו. הרצאות השראה לא בונות יכולת. סרטוני יוטיוב לא עונים כששואלים.
                לכן כאן לומדים אחרת: פנים מול פנים, בקבוצות קטנות, על החומרים האמיתיים שלכם.
              </p>
              <p>
                כל מסלול בנוי סביב תוצר אחד ברור, ובסוף המסלול הוא אצלכם: עובד, מוכן, ושלכם. יחד איתו
                יוצאים עם שיטת עבודה מסודרת, כזאת שממשיכה לעבוד גם כשהכלים מתחלפים.
              </p>
            </div>
            <div className="panel" data-reveal>
              <h3>{SITE.founder.name} · {SITE.founder.title}</h3>
              <p style={{ color: "var(--muted-strong)" }}>{SITE.founder.bio}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`השיטה (${pad2(SITE.method.length)})`}
            title={<>מהבעיה ועד שיטת עבודה, <Accent>בשבעה</Accent> צעדים.</>}
            sub="אותם שבעה צעדים חוזרים בכל מסלול, על כל תוצר. זה מה שהופך רשימת כלים לתהליך שאפשר לחזור עליו."
          />
          <div className="num-grid">
            {SITE.method.map((s, i) => (
              <div className="num-cell" key={s.title} data-reveal>
                <span className="num">({pad2(i + 1)})</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            kicker={`העקרונות (${pad2(SITE.principles.length)})`}
            title={<>במה אנחנו <Accent>מאמינים</Accent>.</>}
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

      <CTASection />
    </>
  );
};

export default About;
