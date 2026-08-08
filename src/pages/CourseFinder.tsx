import { useState } from "react";
import { Link } from "react-router-dom";
import { GOALS } from "../data/site";
import { getCourse } from "../data/courses";
import { orgSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import ChatFinder from "../components/ChatFinder";
import LeadForm from "../components/LeadForm";
import { ArrowIcon } from "../components/icons";

const CourseFinder = () => {
  const [chosenSlug, setChosenSlug] = useState<string | null>(null);

  useSeo({
    title: "איזה מסלול מתאים לי? | Gutman Academy",
    description:
      "שתי שאלות קצרות עם המנחה של האקדמיה, ותקבלו המלצה על מסלול ה-AI שמתאים למקצוע, לעסק או ללימודים שלכם.",
    path: "/course-finder",
    schema: [orgSchema()],
  });
  useReveal([chosenSlug]);

  const chosen = chosenSlug ? getCourse(chosenSlug) : undefined;

  return (
    <>
      <Breadcrumbs items={[{ label: "ראשי", to: "/" }, { label: "בחירת מסלול" }]} />

      <section className="section no-line" style={{ paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="container">
          <SectionHeader
            as="h1"
            center
            kicker="הכוונה אישית"
            title={<>שתי שאלות. מסלול <Accent>אחד</Accent> שנבנה בשבילכם.</>}
            sub="המנחה של האקדמיה שואל מי אתם ומה חשוב לכם להשיג, ומכוון אתכם למסלול הנכון. אפשר גם לבחור מטרה מהרשימה למטה."
          />
          <ChatFinder onResult={setChosenSlug} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            kicker="או פשוט בחרו מטרה"
            title={<>מה אתם רוצים <Accent>להשיג</Accent>?</>}
          />
          <div className="gallery-grid">
            {GOALS.map((g) => {
              const c = getCourse(g.courseSlug);
              if (!c) return null;
              return (
                <Link key={g.goal} to={`/courses/${c.slug}`} className="gallery-item" data-reveal>
                  <span>{g.goal}</span>
                  <span className="arrow" aria-hidden="true"><ArrowIcon /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="lead-form">
        <div className="container two-col">
          <SectionHeader
            kicker="מעדיפים שנחשוב בשבילכם?"
            title={<>נחזור אליכם עם <Accent>המלצה</Accent> אישית.</>}
            sub="השאירו פרטים וכמה מילים על המטרה שלכם, ונחזור אליכם עם המסלול שהכי מתאים לה."
          />
          <LeadForm
            key={chosenSlug ?? "open"}
            courseSlug={chosen?.slug}
            leadSource="course-finder"
            title={chosen ? `שריינו מקום ב${chosen.shortTitle}` : undefined}
            sub={chosen ? `המנחה המליץ על ${chosen.title}. השאירו פרטים ונחזור אליכם עם כל הפרטים.` : undefined}
          />
        </div>
      </section>
    </>
  );
};

export default CourseFinder;
