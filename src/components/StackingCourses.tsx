import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { buildStickyCourseSlides } from "./StickyCoursesShowcase";
import Pressable from "./Pressable";
import { useRegisterModal } from "../context/RegisterModalContext";
import { getSyllabusHref } from "../data/syllabi";
import { useMediaQuery } from "../lib/motion";

const slides = buildStickyCourseSlides();

/**
 * מסלולים בסגנון stacking cards: כל מסלול הוא כרטיס מעוגל שנדבק מתחת
 * ל-header, והבא נערם עליו עם היסט קטן. הכרטיס הוא טיפוגרפיה בלבד,
 * ממורכזת, בלי מוקאפ מלווה - כך שהתוכן הוא הגיבור והכרטיס נמוך יותר.
 */
const StackingCourses = () => {
  const { openRegisterModal } = useRegisterModal();
  /*
   * ההיסט של הערימה קטן יותר בטלפון.
   *
   * חמישה כרטיסים דביקים עם היסט של 1.1rem כל אחד דוחפים את האחרון
   * 8.65rem מתחת לראש המסך, וזה נגס בחלק גדול מדי מגובה המסך בנייד.
   */
  const coarse = useMediaQuery("(pointer: coarse)");
  const step = coarse ? 0.5 : 1.1;

  return (
    <div className="container-site flex flex-col gap-6 pb-10">
      {slides.map((slide, i) => {
        /*
         * הטון מגיע מהתמה ולא נעול יותר על "כהה".
         *
         * קודם זה היה const dark = true, ולכן כרטיס בהיר היה מקבל טקסט
         * לבן על אבן ונעלם לגמרי. הענף הבהיר כבר היה כתוב כאן וחיכה.
         */
        const dark = slide.tone !== "light";

        return (
          <div key={slide.id} className="sticky" style={{ top: `calc(4.25rem + ${i * step}rem)` }}>
            <article
              className={`relative overflow-hidden rounded-[2rem] border shadow-[0_-12px_40px_-24px_rgba(0,0,0,0.7),0_28px_70px_-40px_rgba(0,0,0,0.9)] sm:rounded-[2.5rem] ${
                dark ? "border-white/12" : "surface-light border-transparent"
              }`}
              style={{ background: slide.bg, color: slide.fg }}
            >
              {/*
                * הילה רכה מאחורי התוכן, בגוון של הכרטיס.
                *
                * זה מה שהופך משטח שטוח לחלל: העין קוראת מרכז מואר ושוליים
                * כהים כעומק, ולא כמלבן צבוע. הכהות בפינות גם מחזיקה את
                * הניגודיות של הטקסט הלבן, שנשאר על החלק הכהה של הכרטיס.
                */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(105% 78% at 50% 0%, ${slide.glow} 0%, transparent 62%)`,
                }}
                aria-hidden
              />

              {/*
                * קו דק בשפה העליונה, מה שנותן לכרטיס קצה פיזי בערימה.
                *
                * על אבן הוא כהה ולא לבן: קו לבן על משטח בהיר הוא קו שלא
                * קיים, והכרטיס היה מאבד את הקצה שלו בדיוק בערימה.
                */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${
                    dark ? "rgba(255,255,255,0.28)" : "rgba(25,25,25,0.14)"
                  } 50%, transparent 100%)`,
                }}
                aria-hidden
              />

              <div className="relative flex min-h-[38vh] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[48vh] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
                {/*
                  * 65% ולא 50%, בגלל ההילה.
                  *
                  * ההילה מבהירה בדיוק את החלק העליון של הכרטיס, ששם יושבת
                  * השורה הזו, ועל שלושה מהכרטיסים היא הפילה אותה ל-4.46
                  * מול רקע מואר - מתחת לסף של AA לטקסט בגודל 12px. 65%
                  * מחזיר אותה ל-6.45 ומעלה בכל החמישה.
                  */}
                <span className={`section-label ${dark ? "!text-white/65" : "!text-ink/70"}`}>
                  {slide.format} · {slide.duration} · {slide.level}
                </span>

                <h3 className="mt-5 max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-bold leading-[1.08] tracking-tightest">
                  {slide.title}
                  {slide.accent && (
                    <span className="accent-serif mt-1 block text-[0.85em]" style={{ color: slide.accentColor }}>
                      {slide.accent}
                    </span>
                  )}
                </h3>

                {/*
                  * 75% ולא 60% על אבן.
                  *
                  * דיו ב-60% על #e9e3d7 יוצא ביחס 4.23, כלומר מתחת ל-AA
                  * לטקסט גוף. על רקע כהה 70% לבן נותן 7.4 ואין בעיה, ולכן
                  * שני הצדדים לא יכולים לחלוק את אותו ערך.
                  */}
                <p
                  className={`mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${
                    dark ? "text-white/70" : "text-ink/75"
                  }`}
                >
                  {slide.description}
                </p>

                {/*
                  * הצ'יפים קיבלו משטח משלהם ולא רק מסגרת.
                  *
                  * מסגרת בלבד על רקע כהה כמעט נעלמת, ושלוש המילים שנושאות
                  * את מה שיוצאים איתו מהסדנה נראו כמו הערת שוליים. רקע
                  * עדין נותן להן גוף בלי להתחרות בכותרת.
                  */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {slide.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm ${
                        dark
                          ? "border-white/15 bg-white/[0.07] text-white/85"
                          : "border-ink/15 bg-ink/[0.05] text-ink/75"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* במובייל: הראשי ברוחב מלא, ושני המשניים חולקים שורה אחת מתחתיו */}
                <div className="mt-7 flex w-full flex-col items-center gap-2.5 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
                  <Pressable
                    type="button"
                    className={`btn w-full sm:w-auto ${
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
                    className={`btn w-full border-2 font-semibold sm:w-auto ${
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
