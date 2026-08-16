import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { buildStickyCourseSlides } from "./StickyCoursesShowcase";
import Pressable from "./Pressable";
import { useRegisterModal } from "../context/RegisterModalContext";
import { getSyllabusHref } from "../data/syllabi";

const slides = buildStickyCourseSlides();

/**
 * מסלולים בסגנון stacking cards: כל מסלול הוא כרטיס מעוגל שנדבק מתחת
 * ל-header, והבא נערם עליו עם היסט קטן. הכרטיס הוא טיפוגרפיה בלבד,
 * ממורכזת, בלי מוקאפ מלווה - כך שהתוכן הוא הגיבור והכרטיס נמוך יותר.
 */
const StackingCourses = () => {
  const { openRegisterModal } = useRegisterModal();

  return (
    <div className="container-site flex flex-col gap-6 pb-10">
      {slides.map((slide, i) => {
        /* כל השקפים כהים אחרי המעבר; הענף הבהיר השאיר טקסט דיו על רקע כהה */
        const dark = true;

        return (
          <div key={slide.id} className="sticky" style={{ top: `calc(4.25rem + ${i * 1.1}rem)` }}>
            <article
              className={`overflow-hidden rounded-[2rem] border shadow-[0_-12px_40px_-24px_rgba(25,25,25,0.35)] sm:rounded-[2.5rem] ${
                dark ? "border-white/12" : "surface-light border-transparent"
              }`}
              style={{ background: slide.bg, color: slide.fg }}
            >
              <div className="flex min-h-[48vh] flex-col items-center justify-center px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-14 lg:py-20">
                <span className={`section-label ${dark ? "!text-white/50" : ""}`}>
                  {slide.format} · {slide.duration} · {slide.level}
                </span>

                <h3 className="mt-5 max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-bold leading-[1.08] tracking-tightest">
                  {slide.title}
                  <span className="accent-serif mt-1 block text-[0.85em]" style={{ color: slide.accentColor }}>
                    {slide.accent}
                  </span>
                </h3>

                <p
                  className={`mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${
                    dark ? "text-white/70" : "text-ink/60"
                  }`}
                >
                  {slide.description}
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {slide.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                        dark ? "border-white/20 text-white/80" : "border-ink/15 text-ink/70"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Pressable
                    type="button"
                    className={`btn ${
                      dark
                        ? "bg-white text-ink shadow-pill hover:bg-white/90"
                        : "bg-ink text-white shadow-pill hover:bg-black"
                    }`}
                    onClick={() => openRegisterModal({ courseId: slide.id, leadSource: "stacking-courses" })}
                  >
                    שמרו לי מקום
                    <ArrowUpLeft size={17} aria-hidden />
                  </Pressable>
                  <Link
                    to={getSyllabusHref(slide.id)}
                    className={`btn border-2 font-semibold ${
                      dark
                        ? "border-white/45 text-white hover:border-white hover:bg-white/10"
                        : "border-ink/45 text-ink hover:border-ink hover:bg-ink/5"
                    }`}
                  >
                    לסילבוס המלא
                  </Link>
                  <Link
                    to={slide.href}
                    className={`inline-flex min-h-11 items-center px-3 text-sm underline-offset-4 transition-opacity hover:underline ${
                      dark ? "text-white/60 hover:text-white" : "text-ink/55 hover:text-ink"
                    }`}
                  >
                    לעמוד הסדנה
                  </Link>
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
};

export default StackingCourses;
