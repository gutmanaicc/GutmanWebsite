// כרטיס מרצה. הדיוקן כרגע placeholder בשחור-לבן, מוכן להחלפה בצילום אמיתי:
// מחליפים את ה-SVG ב-<img> עם אותו className והמסגרת נשארת זהה.
const LecturerCard = ({ name = "רון גוטמן", role = "מייסד האקדמיה ומנחה הסדנאות" }) => (
  <figure className="lecturer" data-reveal>
    <span className="lecturer-frame">
      <svg viewBox="0 0 120 150" role="img" aria-label={`דיוקן של ${name}`} className="lecturer-art">
        <defs>
          <linearGradient id="lg-fig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8e8ea" />
            <stop offset="1" stopColor="#9a9aa0" />
          </linearGradient>
          <radialGradient id="lg-bg" cx="0.5" cy="0.32" r="0.9">
            <stop offset="0" stopColor="#3c3c42" />
            <stop offset="1" stopColor="#141417" />
          </radialGradient>
        </defs>
        <rect width="120" height="150" fill="url(#lg-bg)" />
        {/* צללית דיוקן: ראש, צוואר, כתפיים */}
        <g fill="url(#lg-fig)">
          <ellipse cx="60" cy="52" rx="24" ry="27" />
          <rect x="50" y="72" width="20" height="16" rx="7" />
          <path d="M14 150c2-34 22-50 46-50s44 16 46 50z" />
        </g>
      </svg>
    </span>
    <figcaption>
      <b>{name}</b>
      <span>{role}</span>
    </figcaption>
  </figure>
);

export default LecturerCard;
