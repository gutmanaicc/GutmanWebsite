import { Link, useLocation } from "react-router-dom";
import { COURSES } from "../data/courses";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const ThankYou = () => {
  const location = useLocation();
  const courseSlug = (location.state as { course?: string } | null)?.course;
  const course = COURSES.find((c) => c.slug === courseSlug);

  useSeo({
    title: `תודה | ${SITE.name}`,
    description: "קיבלנו את הפרטים שלכם ונחזור אליכם בקרוב.",
    path: "/thank-you",
  });

  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl text-brand">✓</div>
      <h1 className="text-3xl font-bold">קיבלנו. נחזור אליכם בקרוב.</h1>
      <p className="mt-3 max-w-md text-muted">
        {course
          ? `רשמנו את פנייתכם לגבי "${course.title}". ניצור קשר עם כל הפרטים.`
          : "רשמנו את פנייתכם. ניצור קשר בהקדם עם כל הפרטים."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/courses" className="btn-primary">למסלולים</Link>
        <Link to="/" className="btn-ghost">לעמוד הראשי</Link>
      </div>
    </div>
  );
};

export default ThankYou;
