import { Link } from "react-router-dom";
import type { CatalogEntry } from "../data/catalog";
import { ArrowIcon } from "./icons";

// שורת מסלול בסגנון רשימת עבודות של סטודיו: אינדקס, כותרת ענקית, תגית, חץ.
const CourseRow = ({ entry, index }: { entry: CatalogEntry; index: number }) => (
  <Link to={`/courses/${entry.slug}`} className="course-row" data-reveal>
    <span className="cr-num">({String(index + 1).padStart(2, "0")})</span>
    <span className="cr-main">
      <span className="cr-title">{entry.title}</span>
      <span className="cr-blurb">{entry.blurb}</span>
    </span>
    <span className="cr-meta">
      <span className="cr-chip">{entry.kind}</span>
      <span className="cr-cat">{entry.category}</span>
    </span>
    <span className="cr-arrow" aria-hidden="true"><ArrowIcon size={22} /></span>
  </Link>
);

export default CourseRow;
