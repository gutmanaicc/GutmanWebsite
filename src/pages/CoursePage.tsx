import { Link, Navigate, useParams } from "react-router-dom";
import { getCourse } from "../data/courses";
import { blurbTopics, getCatalogEntry } from "../data/catalog";
import { courseSchema, faqSchema, useSeo } from "../lib/seo";
import { useReveal } from "../lib/useReveal";
import SectionHeader, { Accent } from "../components/SectionHeader";
import Breadcrumbs from "../components/Breadcrumbs";
import FAQAccordion from "../components/FAQAccordion";
import LeadForm from "../components/LeadForm";
import { CheckIcon, XIcon } from "../components/icons";
import { GENERAL_FAQ } from "../data/site";
import { COURSE_ART, COURSE_LOOPS, COURSE_LOOPS_WEBM } from "../data/courseArt";
import AmbientMedia from "../components/AmbientMedia";
import LecturerCard from "../components/LecturerCard";
import { getWorkshop } from "../data/workshops";


const LOGISTICS_LABELS: { key: "format" | "sessions" | "sessionLength" | "location" | "groupSize" | "equipment" | "support" | "materials" | "nextCohort"; label: string }[] = [
  { key: "format", label: "פורמט" },
  { key: "sessions", label: "מספר מפגשים" },
  { key: "sessionLength", label: "אורך מפגש" },
  { key: "location", label: "מיקום" },
  { key: "groupSize", label: "גודל קבוצה" },
  { key: "equipment", label: "ציוד נדרש" },
  { key: "support", label: "ליווי" },
  { key: "materials", label: "חומרים" },
  { key: "nextCohort", label: "מחזור קרוב" },
];

const CoursePage = () => {
  const { slug } = useParams();
  const entry = slug ? getCatalogEntry(slug) : undefined;
  const course = slug ? getCourse(slug) : undefined;
  const workshop = slug ? getWorkshop(slug) : undefined;

  useSeo({
    title: entry ? `${entry.title} | Gutman Academy` : "מסלול | Gutman Academy",
    description: entry ? entry.blurb : "",
    path: entry ? `/courses/${entry.slug}` : "/courses",
    schema: entry
      ? [
          courseSchema({ title: entry.title, tagline: entry.blurb, slug: entry.slug }),
          ...(course ? [faqSchema(course.faq)] : []),
        ]
      : undefined,
  });
  useReveal([slug]);

  if (!entry) return <Navigate to="/courses" replace />;

  const topics = course ? course.topics : blurbTopics(entry.blurb);
  const parent = entry.parent ? getCatalogEntry(entry.parent) : undefined;
  const leadSource = course ? course.leadSource : `course-${entry.slug}`;
  const ctaText = course ? course.ctaText : "רוצה לשמוע עוד";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "ראשי", to: "/" },
          { label: "מסלולים", to: "/courses" },
          { label: course ? course.shortTitle : entry.title },
        ]}
      />

      {/* פתיח */}
      <section className="course-hero">
        <div className="container">
          <p className="eyebrow" data-reveal>{entry.category} · {entry.kind}</p>
          <h1 data-reveal>{entry.title}</h1>
          <div className="hero-foot" data-reveal>
            <p className="hero-sub">{workshop ? workshop.intro : course ? course.tagline : entry.blurb}</p>
            <div className="hero-ctas">
              <a href="#lead-form" className="btn btn-primary">{ctaText}</a>
              {course && <a href="#syllabus" className="btn btn-ghost">מה לומדים בפנים</a>}
            </div>
          </div>
          <div className="badge-row" data-reveal>
            {entry.soon && <span className="badge accent">נפתח בקרוב</span>}
            <span className="badge">פרונטלי ומעשי, בקבוצה קטנה</span>
            {course && <span className="badge">{course.experienceLevel}</span>}
            
            {parent && (
              <Link to={`/courses/${parent.slug}`} className="badge">
                סדנת המשך מתוך {parent.title}
              </Link>
            )}
          </div>
          <div className="course-hero-row">
            {COURSE_ART[entry.slug] && (
              <div className="case-photo course-hero-media" data-reveal>
                <AmbientMedia video={COURSE_LOOPS[entry.slug]} videoWebm={COURSE_LOOPS_WEBM[entry.slug]} poster={COURSE_ART[entry.slug]} scrub />
              </div>
            )}
            <LecturerCard />
          </div>
        </div>
      </section>

      {course ? (
        <>
          {/* הבעיה והתוצאה */}
          <section className="section">
            <div className="container two-col">
              <div>
                <SectionHeader kicker="הבעיה" title={<>מה <Accent>שוחק</Accent> אתכם היום.</>} />
                <div className="prose" data-reveal>
                  {course.problem.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
              <div>
                <SectionHeader kicker="התוצאה" title={<>מה <Accent>נבנה</Accent> במקום.</>} />
                <div className="prose" data-reveal>
                  <p>{course.outcome}</p>
                  {course.methodName && <p><b>{course.methodName}</b></p>}
                </div>
                <div className="course-note" data-reveal>
                  <b>התוצר הסופי: </b>
                  {course.finalDeliverable}
                </div>
              </div>
            </div>
          </section>

          {/* יכולות */}
          <section className="section">
            <div className="container">
              <SectionHeader
                kicker="מה תדעו לעשות"
                title={<>יכולות שנשארות <Accent>אצלכם</Accent>.</>}
              />
              <div className="chip-row" data-reveal>
                {course.capabilities.map((c) => (
                  <span className="chip" key={c}>{c}</span>
                ))}
              </div>
            </div>
          </section>

          {/* סילבוס */}
          <section className="section" id="syllabus">
            <div className="container">
              <SectionHeader
                kicker="הסילבוס"
                title={<>לומדים, מתרגלים, <Accent>בונים</Accent>.</>}
                sub="כל חלק בנוי מאותם ארבעה צעדים: מה לומדים, מה מתרגלים, מה בונים ועם מה יוצאים."
              />
              {workshop ? (
                <>
                  <div className="sessions" data-reveal>
                    {workshop.sessions.map((sess) => (
                      <div className="session" key={sess.title}>
                        <div className="session-head">
                          {sess.name && <span className="session-name">{sess.name}</span>}
                          <h3>{sess.title}</h3>
                        </div>
                        <ul className="session-points">
                          {sess.points.map((pt) => (
                            <li key={pt}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="outcome-card" data-reveal>
                    <span className="outcome-k">מה יוצאים איתו</span>
                    <p>{workshop.outcome}</p>
                  </div>
                </>
              ) : (
              <div className="syllabus">
                {course.syllabus.map((m) => (
                  <div className="syl-module" key={m.title} data-reveal>
                    <div className="syl-body">
                      <h3>{m.title}</h3>
                      <div className="syl-rows">
                        <div className="syl-row">
                          <span className="k">לומדים</span>
                          <span className="v">{m.learn}</span>
                        </div>
                        <div className="syl-row">
                          <span className="k">מתרגלים</span>
                          <span className="v">{m.practice}</span>
                        </div>
                        <div className="syl-row">
                          <span className="k">בונים</span>
                          <span className="v">{m.build}</span>
                        </div>
                      </div>
                      <p className="syl-takeaway">
                        <span className="k">יוצאים עם:</span>
                        <span className="v">{m.takeaway}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>

          {/* נושאים */}
          <section className="section">
            <div className="container">
              <SectionHeader kicker="הנושאים" title={<>מה נכנס <Accent>פנימה</Accent>.</>} />
              <div className="chip-row" data-reveal>
                {topics.map((t) => (
                  <span className="chip" key={t}>{t}</span>
                ))}
              </div>
            </div>
          </section>

          {/* התאמה */}
          <section className="section">
            <div className="container two-col">
              <div className="panel" data-reveal>
                <h3>למי המסלול מתאים</h3>
                <ul className="check-list">
                  {course.suitability.map((s) => (
                    <li key={s}>
                      <span className="ic yes" aria-hidden="true"><CheckIcon /></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel" data-reveal>
                <h3>למי הוא לא מתאים</h3>
                <ul className="check-list">
                  {course.notSuitableFor.map((s) => (
                    <li key={s}>
                      <span className="ic no" aria-hidden="true"><XIcon /></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* לוגיסטיקה */}
          <section className="section">
            <div className="container">
              <SectionHeader kicker="הפרטים" title={<>הלוגיסטיקה, על <Accent>השולחן</Accent>.</>} />
              <div className="logistics-grid" data-reveal>
                {LOGISTICS_LABELS.map(({ key, label }) => {
                  const value = course.logistics[key];
                  return (
                    <div className="log-cell" key={key}>
                      <span className="k">{label}</span>
                      <span className={`v${value ? "" : " soon"}`}>{value || "ייסגר בקרוב"}</span>
                    </div>
                  );
                })}
              </div>
              {course.note && <p className="course-note" data-reveal>{course.note}</p>}
            </div>
          </section>

          {/* שאלות */}
          <section className="section">
            <div className="container split-section">
              <div className="split-aside">
                <SectionHeader
                  kicker="שאלות על הסדנה"
                  title={<>מה ששואלים <Accent>הכי הרבה</Accent>.</>}
                />
              </div>
              <FAQAccordion items={course.faq} />
            </div>
          </section>
        </>
      ) : (
        <>
          {/* עמוד תמצית: רק מה שרון כתב, בלי להמציא */}
          <section className="section">
            <div className="container two-col">
              <div>
                <SectionHeader kicker="על מה זה" title={<>מה <Accent>בונים</Accent> כאן.</>} />
                <div className="prose" data-reveal>
                  <p>{entry.blurb}</p>
                  <p>
                    כמו בכל מסלולי האקדמיה: לומדים פנים מול פנים, בקבוצה קטנה, עובדים על החומרים
                    האמיתיים שלכם ומקבלים ליווי צמוד לאורך הדרך.
                  </p>
                </div>
              </div>
              <div className="panel" data-reveal>
                <h3>מה נכנס פנימה</h3>
                <div className="chip-row">
                  {topics.map((t) => (
                    <span className="chip" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {workshop && (
            <section className="section" id="syllabus">
              <div className="container">
                <SectionHeader
                  kicker="הסילבוס"
                  title={<>מה קורה <Accent>בפנים</Accent>.</>}
                />
                <div className="sessions" data-reveal>
                  {workshop.sessions.map((sess) => (
                    <div className="session" key={sess.title}>
                      <div className="session-head">
                        {sess.name && <span className="session-name">{sess.name}</span>}
                        <h3>{sess.title}</h3>
                      </div>
                      <ul className="session-points">
                        {sess.points.map((pt) => (
                          <li key={pt}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="outcome-card" data-reveal>
                  <span className="outcome-k">מה יוצאים איתו</span>
                  <p>{workshop.outcome}</p>
                </div>
              </div>
            </section>
          )}

          <section className="section">
            <div className="container">
              <SectionHeader kicker="הפרטים" title={<>המועדים <Accent>נסגרים</Accent> בקרוב.</>}
                sub="המועדים והמחיר ייסגרו בקרוב. השאירו פרטים ותקבלו אותם ראשונים, בלי התחייבות." />
              <div className="logistics-grid" data-reveal>
                <div className="log-cell">
                  <span className="k">פורמט</span>
                  <span className="v">{entry.kind === "סדנה" ? "סדנה פרונטלית מעשית" : "מסלול פרונטלי מעשי בקבוצה קטנה"}</span>
                </div>
                <div className="log-cell">
                  <span className="k">מועדים</span>
                  <span className="v soon">ייסגר בקרוב</span>
                </div>

                <div className="log-cell">
                  <span className="k">ציוד נדרש</span>
                  <span className="v">מחשב נייד</span>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container split-section">
              <div className="split-aside">
                <SectionHeader
                  kicker="שאלות נפוצות"
                  title={<>מה שכולם <Accent>שואלים</Accent>.</>}
                />
              </div>
              <FAQAccordion items={GENERAL_FAQ.slice(0, 5)} />
            </div>
          </section>
        </>
      )}

      {/* טופס */}
      <section className="section" id="lead-form">
        <div className="container split-section">
          <div className="split-aside">
            <SectionHeader
              kicker="שריינו מקום"
              title={<>הקבוצות <Accent>קטנות</Accent>. הפרטים לפניכם.</>}
              sub="השאירו פרטים ונחזור אליכם עם כל מה שצריך לדעת: מועדים, מחירים ותשובות לכל שאלה."
            />
          </div>
          <LeadForm
            courseSlug={entry.slug}
            leadSource={leadSource}
            title={ctaText}
            sub={`בלי התחייבות ובלי ספאם. נחזור אליכם עם כל הפרטים על ${entry.title}.`}
          />
        </div>
      </section>
    </>
  );
};

export default CoursePage;
