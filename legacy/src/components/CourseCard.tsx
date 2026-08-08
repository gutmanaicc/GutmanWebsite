import { Link } from "react-router-dom";
import type { Course } from "../data/courses";
import { ArrowIcon } from "./icons";

// כרטיס מסלול בשפת "תיק": שורת תיוק, תוכן, ושורת פעולה
const CourseCard = ({ course, index }: { course: Course; index?: number }) => (
  <article className="course-card" data-visual={course.visual} data-reveal>
    <div className="cc-file-row">
      <span className="cc-index">
        {typeof index === "number" ? `תיק ${String(index + 1).padStart(2, "0")}` : "תיק מסלול"}
      </span>
      <span className="cc-cat">{course.category}</span>
    </div>
    <h3 className="cc-title">{course.title}</h3>
    <p className="cc-audience">{course.audience}</p>
    <p className="cc-tagline">{course.tagline}</p>
    <div className="cc-facts">
      <div className="cc-fact">
        <span className="k">הבעיה:</span>
        <span className="v">{course.problem[0].split(".")[0]}.</span>
      </div>
      <div className="cc-fact">
        <span className="k">התוצר:</span>
        <span className="v">{course.finalDeliverable}</span>
      </div>
      <div className="cc-fact">
        <span className="k">פורמט:</span>
        <span className="v">{course.logistics.format}</span>
      </div>
    </div>
    <div className="cc-foot">
      <span className="cc-level">{course.experienceLevel}</span>
      <Link to={`/courses/${course.slug}`} className="cc-link">
        לפתיחת התיק
        <span className="arrow" aria-hidden="true"><ArrowIcon /></span>
      </Link>
    </div>
  </article>
);

export default CourseCard;
