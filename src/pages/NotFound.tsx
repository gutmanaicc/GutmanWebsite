import { Link } from "react-router-dom";
import { useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";

const NotFound = () => {
  useSeo({
    title: "404 | העמוד לא נמצא | Gutman Academy",
    description: "העמוד שחיפשתם לא נמצא.",
    path: "/404",
  });
  useReveal();

  return (
    <section className="center-page container">
      <span className="eyebrow" data-reveal>404</span>
      <h1 data-reveal>העמוד הזה עוד לא נבנה.</h1>
      <p data-reveal>
        הקישור שהגעתם אליו לא קיים, אבל המסלולים דווקא כן. מכאן אפשר להמשיך לכל מקום.
      </p>
      <div className="hero-ctas" data-reveal>
        <Link to="/" className="btn btn-primary">לעמוד הראשי</Link>
        <Link to="/courses" className="btn btn-ghost">לצפייה במסלולים</Link>
      </div>
    </section>
  );
};

export default NotFound;
