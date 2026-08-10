import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const NotFound = () => {
  useSeo({
    title: `עמוד לא נמצא | ${SITE.name}`,
    description: "העמוד שחיפשתם לא קיים.",
    path: "/404",
  });

  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold">העמוד לא נמצא</h1>
      <p className="mt-3 max-w-md text-muted">ייתכן שהקישור השתנה. אפשר לחזור לעמוד הראשי או לראות את המסלולים.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">לעמוד הראשי</Link>
        <Link to="/courses" className="btn-ghost">למסלולים</Link>
        <a href="/#registration-form" className="btn-ghost">השארת פרטים</a>
      </div>
    </div>
  );
};

export default NotFound;
