import { Link } from "react-router-dom";
import type { Course } from "../data/courses";
import { ArrowIcon } from "./icons";

// כרטיס מסלול בשפה הבהירה: אינדקס מספרי, קטגוריה, עובדות, שורת פעולה
const CourseCard = ({ course, index }: { course: Course; index?: number }) => (
  <article className="course-card" data-reveal>
    <div className="cc-top">
      <span className="cc-index">
        {typeof index === "number" ? `(0${index + 1})` : "מסלול"}
      </span>
      <span className="cc-cat">{course.category}</span>
    </div>
    <h3 className="cc-title">{course.title}</h3>
    <p className="cc-tagline">{course.tagline}</p>
    <div className="cc-facts">
      <div className="cc-fact">
        <span className="k">למי:</span>
        <span className="v">{course.audience}</span>
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
        לפרטי המסלול
        <span className="arrow" aria-hidden="true"><ArrowIcon /></span>
      </Link>
    </div>
  </article>
);

export default CourseCard;
