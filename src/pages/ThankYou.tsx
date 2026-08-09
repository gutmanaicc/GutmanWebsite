import { Link, useLocation } from "react-router-dom";
import { getCourse } from "../data/courses";
import { useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";

const ThankYou = () => {
  const location = useLocation();
  const slug = (location.state as { course?: string } | null)?.course;
  const course = slug && slug !== "unsure" ? getCourse(slug) : undefined;

  useSeo({
    title: "תודה! הפרטים נקלטו | Gutman Academy",
    description: "הפרטים נקלטו ונחזור אליכם בהקדם.",
    path: "/thank-you",
  });
  useReveal();

  return (
    <section className="center-page container">
      <span className="eyebrow" data-reveal>הפרטים נקלטו</span>
      <h1 data-reveal>תודה! מכאן זה עלינו.</h1>
      <p data-reveal>
        {course
          ? `נחזור אליכם בהקדם עם כל הפרטים על ${course.title}: מועדים, מחירים ותשובות לכל שאלה.`
          : "נחזור אליכם בהקדם עם המלצה אישית וכל הפרטים. בינתיים, שווה להציץ במסלולים."}
      </p>
      <div className="hero-ctas" data-reveal>
        <Link to="/courses" className="btn btn-primary">לצפייה במסלולים</Link>
        <Link to="/" className="btn btn-ghost">חזרה לעמוד הראשי</Link>
      </div>
    </section>
  );
};

export default ThankYou;
