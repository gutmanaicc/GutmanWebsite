import { Navigate, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import Logo from "../components/Logo";
import Pressable from "../components/Pressable";
import { getCourse } from "../data/courses";
import { getMarketingSyllabus } from "../data/syllabi";
import { useRegisterModal } from "../context/RegisterModalContext";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";
import NotFound from "./NotFound";

/**
 * מסמך הסילבוס המלא של סדנה. בנוי כמסמך ולא כעמוד שיווקי: לוגו בפינה
 * הימנית העליונה, כותרת, פרטי הסדנה, שלבי הלמידה, הכלים והתוצר.
 * מותאם להדפסה ולשמירה כ-PDF דרך כפתור ההדפסה.
 */
const Syllabus = () => {
  const { slug = "" } = useParams();
  const course = getCourse(slug);
  const syllabus = getMarketingSyllabus(course?.slug ?? slug);
  const { openRegisterModal } = useRegisterModal();

  useSeo({
    title: course ? `סילבוס · ${course.title} | ${SITE.name}` : `סילבוס | ${SITE.name}`,
    description: syllabus?.intro ?? "",
    path: `/syllabus/${slug}`,
  });

  if (!course || !syllabus) return <NotFound />;
  if (slug !== course.slug) return <Navigate to={`/syllabus/${course.slug}`} replace />;

  const meta = [
    course.logistics.format,
    course.logistics.sessions,
    course.experienceLevel,
  ].filter(Boolean);

  return (
    <div className="syllabus-doc py-10 sm:py-14">
      <div className="container-site max-w-3xl">
        <div className="mb-8 flex justify-start print:hidden">
          <BackButton fallbackTo={`/courses/${course.slug}`} />
        </div>

        <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface-1 text-bone shadow-card print:rounded-none print:border-0 print:bg-white print:text-black print:shadow-none">
          {/* כותרת המסמך: הלוגו בצד ימין למעלה, על רצועה כהה של המותג */}
          <header className="relative bg-canvas px-7 pb-9 pt-8 text-bone sm:px-10 sm:pb-10">
            <div className="flex items-start justify-between gap-6">
              <Logo height={34} className="max-h-8 w-auto shrink-0 sm:max-h-9" />
              <span className="mt-1 text-[11px] font-semibold tracking-[0.2em] text-bone/40">
                סילבוס הסדנה
              </span>
            </div>

            <h1 className="mt-8 font-display text-[1.8rem] font-bold leading-tight tracking-tightest sm:text-4xl">
              {course.title}
            </h1>

            {meta.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2">
                {meta.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-full border border-white/15 px-3.5 py-1 text-xs font-medium text-bone/65"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="px-7 pb-10 pt-8 sm:px-10 sm:pb-12">
            <p className="text-base leading-relaxed text-bone/70 sm:text-lg">{syllabus.intro}</p>

            <h2 className="mt-10 flex items-center gap-2.5 font-display text-xs font-bold tracking-[0.2em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              מה לומדים
            </h2>

            <ol className="mt-5 space-y-5">
              {syllabus.blocks.map((block, i) => (
                <li key={block.title} className="flex gap-4 border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand"
                    dir="ltr"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-bone">
                      {block.title}
                    </h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{block.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {syllabus.tools && syllabus.tools.length > 0 && (
              <>
                <h2 className="mt-10 flex items-center gap-2.5 font-display text-xs font-bold tracking-[0.2em] text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                  הכלים שנעבוד איתם
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {syllabus.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-bone/75"
                      dir="ltr"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-bone/45">
                  הכלים מתחלפים מדי כמה חודשים. הסדנה בנויה סביב שיטת עבודה שנשארת נכונה גם כשהכלי
                  משתנה.
                </p>
              </>
            )}

            <div className="mt-10 rounded-[1.25rem] border border-brand/30 bg-brand/[0.06] p-6 sm:p-7">
              <h2 className="flex items-center gap-2.5 font-display text-xs font-bold tracking-[0.2em] text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                בסיום הסדנה
              </h2>
              <p className="mt-3 font-display text-lg font-bold leading-snug tracking-tight text-bone sm:text-xl">
                {syllabus.outcome}
              </p>
            </div>

            <footer className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs leading-relaxed text-bone/45">
                <p>
                  {SITE.name} · {SITE.tagline}
                </p>
                <p dir="ltr" className="mt-0.5">
                  {SITE.contact.email} · {SITE.contact.phone}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <Pressable
                  type="button"
                  className="btn-submit !w-auto"
                  onClick={() =>
                    openRegisterModal({ courseId: course.slug, leadSource: `syllabus-${course.slug}` })
                  }
                >
                  שמרו לי מקום
                </Pressable>
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-medium text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
                  onClick={() => window.print()}
                >
                  הדפסה או שמירה כ-PDF
                </button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Syllabus;
