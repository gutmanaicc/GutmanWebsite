import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { buildStickyCourseSlides } from "./StickyCoursesShowcase";
import { getMockWindowForVisual } from "./MockWindows";
import Pressable from "./Pressable";
import { useRegisterModal } from "../context/RegisterModalContext";

const slides = buildStickyCourseSlides();

/**
 * מסלולים בסגנון ה-stacking cards של orbix: כל מסלול הוא כרטיס ענק
 * מעוגל שנדבק מתחת ל-header, והבא נערם עליו עם היסט קטן.
 * ה-CSS עושה את העבודה - sticky עם top גדל - בלי מנוע גלילה.
 */
const StackingCourses = () => {
  const { openRegisterModal } = useRegisterModal();

  return (
    <div className="container-site flex flex-col gap-6 pb-10">
      {slides.map((slide, i) => {
        const dark = slide.bg === "#191919";
        const MockWindow = getMockWindowForVisual(slide.visual);

        return (
          <div key={slide.id} className="sticky" style={{ top: `calc(4.25rem + ${i * 1.1}rem)` }}>
            <article
              className={`overflow-hidden rounded-[2rem] border shadow-[0_-12px_40px_-24px_rgba(25,25,25,0.35)] sm:rounded-[2.5rem] ${
                dark ? "border-white/12" : "border-transparent"
              }`}
              style={{ background: slide.bg, color: slide.fg }}
            >
              <div className="grid min-h-[72vh] items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:p-14">
                <div className="flex flex-col items-start">
                  <span
                    className={`section-label ${dark ? "!text-white/50" : ""}`}
                  >
                    {slide.format} · {slide.duration} · {slide.level}
                  </span>

                  <h3 className="mt-5 text-[clamp(2rem,4.5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight">
                    {slide.title}
                    <span className="accent-serif mt-1 block text-[0.85em]" style={{ color: slide.accentColor }}>
                      {slide.accent}
                    </span>
                  </h3>

                  <p className={`mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${dark ? "text-white/70" : "text-ink/60"}`}>
                    {slide.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
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

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Pressable
                      type="button"
                      className={`btn ${dark ? "bg-white text-ink shadow-pill hover:bg-white/90" : "bg-ink text-white shadow-pill hover:bg-black"}`}
                      onClick={() => openRegisterModal({ courseId: slide.id, leadSource: "stacking-courses" })}
                    >
                      שמרו לי מקום
                      <ArrowUpLeft size={17} aria-hidden />
                    </Pressable>
                    <Link
                      to={slide.href}
                      className={`btn border-2 font-semibold ${
                        dark
                          ? "border-white/45 text-white hover:border-white hover:bg-white/10"
                          : "border-ink/45 text-ink hover:border-ink hover:bg-ink/5"
                      }`}
                    >
                      לסילבוס המלא
                    </Link>
                  </div>
                </div>

                <div className="relative hidden lg:block" aria-hidden>
                  <div className="mx-auto w-full max-w-md -rotate-1 transition-transform duration-500 hover:rotate-0">
                    <MockWindow />
                  </div>
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
