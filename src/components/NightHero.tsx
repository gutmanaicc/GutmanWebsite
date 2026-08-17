import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { SITE } from "../data/site";
import { useMediaQuery } from "../lib/motion";
import { useRegisterModal } from "../context/RegisterModalContext";
import Pressable from "./Pressable";

/**
 * הירו בלילה: ציור מלא מסך של שדה פורח מתחת לשמי כוכבים, עם טיפוגרפיית
 * תצוגה סריפית במרכז. התמונה חיה - לופ פלינדרום שקט של עשב שנע ומסכים
 * שנושמים.
 *
 * הלופ הוא וידאו ולא WebP מונפש. הגרסה הקודמת הייתה WebP של 2.76MB ב-170
 * פריימים, ו-WebP מונפש מפוענח במעבד בלבד - אין לו מסלול פענוח בחומרה. בטלפון
 * זה אומר ליבה שעסוקה בפענוח רקע בזמן שהיא אמורה לצייר את הגלילה, וזה מה
 * שגרם לתקיעות. וידאו מפוענח בחומרה וכמעט לא נוגע במעבד.
 *
 * הפורמט הקודם נבחר במקור כדי לעקוף את מדיניות הניגון האוטומטי, שחוסמת וידאו
 * בתוך iframe בלי allow="autoplay". המחיר כאן מקובל: כשהניגון חסום נשארת
 * התמונה הסטטית, שגם ככה נצבעת ראשונה.
 *
 * קודם נטענת תמונה סטטית קלה לצביעה מיידית, והלופ נפתח מעליה בדעיכה כשהוא
 * מוכן לניגון.
 *
 * הלופ נטען תמיד, גם כשמערכת ההפעלה מבקשת תנועה מופחתת. זו תנועת רקע
 * אווירית ואיטית ולא פרלקסה שמזיזה את העמוד, והרבה משתמשים מדליקים את
 * ההגדרה הזו מסיבות שאינן קשורות. מי שבוחר במפורש לעצור אנימציות בתפריט
 * הנגישות של האתר מקבל את התמונה הסטטית, דרך הכלל ב-CSS.
 */

const IMAGE = "/images/hero-night.jpg";
const LOOP_WEBM = "/videos/hero-night-loop.webm";
const LOOP_MP4 = "/videos/hero-night-loop.mp4";

const EASE = [0.22, 1, 0.36, 1] as const;

/** עולה מלמטה עם טשטוש שנפתח, בהשהיה מדורגת */
const rise = (delay: number) => ({
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: EASE, delay },
  },
});

const NightHero = () => {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loopReady, setLoopReady] = useState(false);
  const { openRegisterModal } = useRegisterModal();
  /* מסך מגע = טלפון. שם מוותרים על הפרלקסה, ראו הערה למטה */
  const coarse = useMediaQuery("(pointer: coarse)");

  const still = reduced || coarse;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  /*
   * הרקע נשאר מאחור: זז מעט בזמן שהתוכן מפנה את המקום.
   *
   * רק הזזה, בלי סקאלה שמשתנה בגלילה. הרקע הוא תמונה מונפשת מלאת מסך,
   * ושינוי סקאלה מכריח את הדפדפן לרסטר אותה מחדש בכל פריים של גלילה -
   * בעוד שהזזה טהורה נשארת אצל הקומפוזיטור ולא עולה כמעט כלום. הסקאלה
   * נשארת קבועה כדי שההזזה לא תחשוף את שולי התמונה.
   */
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  /* הכותרת נוטה מעט אחורה כשגוללים, כאילו היא לוח שנשען לתוך הסצנה */
  const contentTilt = useTransform(scrollYProgress, [0, 1], [0, 14]);

  /*
   * הלופ נעצר כשההירו יוצא מהמסך.
   *
   * דפדפנים לא תמיד עוצרים וידאו רקע שגולל אל מחוץ לתצוגה, וגם פענוח
   * בחומרה תופס מפענח ומושך סוללה. עצירה מפורשת עדיפה על פירוק האלמנט,
   * כי כך אין טעינה מחדש כשחוזרים לראש העמוד.
   */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-start overflow-hidden bg-canvas px-5 pb-24 pt-[18vh] sm:px-8 sm:pt-[15vh]"
    >
      {/* הציור */}
      <motion.div
        className="absolute inset-0 z-0 will-change-transform"
        style={still ? { scale: 1.04 } : { y: bgY, scale: 1.08 }}
        aria-hidden
      >
        <img
          src={IMAGE}
          alt=""
          className="h-full w-full object-cover object-bottom"
          /*
           * האטריביוט נכתב באותיות קטנות דרך spread.
           *
           * גרסת React שכאן לא מזהה את הפרופ fetchPriority ומדפיסה אזהרה
           * בכל טעינה, בזמן שטיפוסי React דווקא דורשים את הצורה הזו. spread
           * עם המרה מספק את שניהם: HTML תקין וקונסול נקי.
           */
          {...({ fetchpriority: "high" } as Record<string, string>)}
          decoding="async"
        />
        <video
          /*
           * muted נכפה גם כאטריביוט, לא רק כ-prop.
           *
           * React מגדיר את muted כמאפיין של האלמנט ולא כותב אותו ל-HTML,
           * וספארי ב-iOS בודק דווקא את האטריביוט לפני שהוא מרשה ניגון
           * אוטומטי. בלי זה הלופ לא מתחיל בטלפון והמבקר נשאר מול פריים
           * קפוא. אותו תיקון בדיוק יושב בקרוסלת התוצרים.
           */
          ref={(el) => {
            videoRef.current = el;
            if (!el) return;
            el.muted = true;
            el.setAttribute("muted", "");
          }}
          className="hero-loop absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: loopReady ? 1 : 0 }}
          onCanPlay={() => setLoopReady(true)}
          poster={IMAGE}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={LOOP_WEBM} type="video/webm" />
          <source src={LOOP_MP4} type="video/mp4" />
        </video>
      </motion.div>

      {/* שכבות קריאות: כהה למעלה לניווט, הילה מרכזית לטקסט, מעבר לקנבס למטה */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,9,14,0.72) 0%, rgba(10,9,14,0.45) 26%, rgba(10,9,14,0.08) 55%, rgba(13,12,17,0.5) 90%, #0d0c11 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(64% 42% at 50% 24%, rgba(10,9,14,0.62) 0%, rgba(10,9,14,0.2) 60%, rgba(10,9,14,0) 100%)",
        }}
        aria-hidden
      />

      <motion.div
        className="relative z-[2] w-full max-w-3xl text-center text-bone [perspective:1200px]"
        /* rotateX על גוש טקסט שלם מחייב רסטור מחדש של הטיפוגרפיה בכל פריים.
           בטלפון משאירים הזזה ושקיפות בלבד, שתיהן זולות אצל הקומפוזיטור. */
        style={
          reduced
            ? undefined
            : coarse
              ? { y: contentY, opacity: contentOpacity }
              : { y: contentY, opacity: contentOpacity, rotateX: contentTilt }
        }
        initial="hidden"
        animate="show"
      >
        <motion.span
          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-bone/55 sm:text-xs"
          variants={reduced ? undefined : rise(0.1)}
        >
          <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
          {SITE.hebrewName}
        </motion.span>

        <motion.h1
          className="hero-title mt-7 font-display font-black leading-[1.04] tracking-tightest text-bone"
          style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)" }}
          variants={reduced ? undefined : rise(0.24)}
        >
          במקום שבו רעיון
          <br />
          הופך למשהו <span className="hero-title-accent">אמיתי</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-7 max-w-lg text-[15px] leading-relaxed text-bone/65 sm:text-base"
          variants={reduced ? undefined : rise(0.42)}
        >
          {SITE.tagline}. לומדים דרך בנייה, בזמן אמת, ויוצאים עם תוצר אמיתי שנשאר איתכם.
        </motion.p>

        <motion.div
          className="mt-11 flex flex-col items-center"
          variants={reduced ? undefined : rise(0.58)}
        >
          {/*
           * הבקשה הראשית מעל הקיפול היא השארת פרטים.
           *
           * קודם שני הכפתורים כאן הובילו לעיון במסלולים ולצ'אט, והבקשה
           * היחידה בכל המסך הראשון הייתה כפתור קטן בסרגל הניווט.
           */}
          <div className="flex w-full items-center justify-center gap-2.5 sm:w-auto sm:gap-3">
            <Pressable
              type="button"
              /* flex-1 ולא w-full: שני הכפתורים חולקים את השורה בשווה
                 במובייל, וחוזרים לרוחב טבעי מ-sm ומעלה */
              className="btn btn-brand flex-1 px-4 text-sm sm:flex-none sm:px-9 sm:text-[15px]"
              rippleTone="pink"
              onClick={() => openRegisterModal({ leadSource: "hero" })}
            >
              השאירו פרטים
            </Pressable>

            <Link
              to="/courses"
              className="group relative inline-flex min-h-12 flex-1 items-center justify-center overflow-hidden rounded-full border border-bone/35 px-4 text-sm font-medium text-bone transition-colors duration-500 hover:border-bone/70 hover:text-ink sm:flex-none sm:px-8 sm:text-[15px]"
            >
              <span
                className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                aria-hidden
              />
              <span className="relative">{SITE.hero.primaryCta}</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("finder")
                ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
            }
            className="mt-4 inline-flex min-h-11 items-center justify-center px-5 text-sm text-bone/55 underline-offset-[6px] transition-colors duration-300 hover:text-bone hover:underline sm:text-[15px]"
          >
            {SITE.hero.secondaryCta}
          </button>
        </motion.div>
      </motion.div>

      {/* רמז גלילה */}
      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 z-[2] -translate-x-1/2"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        aria-hidden
      >
        <span className="block h-12 w-px overflow-hidden bg-bone/15">
          <motion.span
            className="block h-1/3 w-px bg-bone/70"
            animate={reduced ? undefined : { y: ["-100%", "300%"] }}
            transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
      </motion.div>
    </section>
  );
};

export default NightHero;
