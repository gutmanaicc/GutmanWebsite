import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useMediaQuery } from "../lib/motion";

export type SnakeStep = { title: string; text: string };

type Props = {
  steps: SnakeStep[];
  /** מזהה ייחודי, כדי ששני מסלולים באותו עמוד לא יתנגשו */
  id: string;
};

/** כמה רחב הזיגזג ביחס לרוחב המדוד, עם רצפה ותקרה. */
const AMP_RATIO = 0.2;
const AMP_MIN = 90;
const AMP_MAX = 300;

/**
 * מסלול מתפתל שמתמלא עם הגלילה.
 *
 * הקו חי בתוך מסדרון צר במרכז, והכרטיסים יושבים משני צדיו לסירוגין.
 * זו הסיבה שהטקסט לא יושב על הקו: הם לא חולקים את אותו מרחב. הניסיון
 * הקודם מירכז את הכרטיסים והזיז אותם ±150, ולכן הקו עבר דרך המילים.
 *
 * הקו האפור הוא המסלול המלא. הוורוד הוא אותו path בדיוק, עם
 * strokeDashoffset שנגזר מההתקדמות, ולכן הצבע מסמן איפה כבר עברנו
 * במקום לקשט.
 *
 * הגאומטריה נמדדת ולא מחושבת: נקודות העיגון נקראות מה-DOM אחרי
 * הפריסה, ולכן אורך טקסט, גודל גופן ורוחב מסך לא מפרקים את החיבור.
 */
const SnakePath = ({ steps, id }: Props) => {
  const reduced = Boolean(useReducedMotion());
  const wide = useMediaQuery("(min-width: 768px)");
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLElement | null)[]>([]);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      setBox({ w: base.width, h: base.height });
      setPoints(
        dotRefs.current.slice(0, steps.length).map((el) => {
          if (!el) return { x: base.width / 2, y: 0 };
          const r = el.getBoundingClientRect();
          return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => ro.disconnect();
  }, [steps.length, wide]);

    /*
   * ההתקדמות מחושבת כאן ולא דרך useScroll.
   *
   * useScroll עם target פשוט לא התעדכן בקומפוננטה הזו: כל מה שנגזר
   * ממנו נשאר קפוא - הכרטיסים נתקעו על שקיפות 0.38, נקודת האור לא זזה
   * והקו לא נצבע, לאורך כל הגלילה. המדידה כאן ישירה: היכן ראש הסקשן
   * ביחס לחלון, ולכן אפשר לאמת אותה במספרים.
   *
   * המהלך ממוקם סביב מרכז המסך: מתחיל כשראש הסקשן חוצה 55% מגובה
   * החלון, ונגמר כשסופו מגיע ל-45%. לא כשהוא רק מציץ מלמטה.
   */
  const raw = useMotionValue(0);

  /*
   * הקריאה נעשית בכל פריים, ולא מאירוע scroll.
   *
   * האתר מריץ Lenis, ואירועי scroll של החלון פשוט לא הגיעו לכאן:
   * המדידה רצה פעם אחת בהרכבה, כשהסקשן היה 4704px מתחת לחלון, ומאז
   * לא עודכנה - ולכן הכל נשאר קפוא. לולאת הפריימים המשותפת של framer
   * לא תלויה במי שמנהל את הגלילה, וזה בדיוק מה שנדרש כאן.
   *
   * המחיר הוא getBoundingClientRect אחד לפריים על אלמנט אחד, וגם הוא
   * נחסך כשהסקשן רחוק מהחלון.
   */
  useAnimationFrame(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    const startAt = window.innerHeight * 0.55;
    const endAt = window.innerHeight * 0.45;
    const span = r.height + (startAt - endAt);
    const travelled = startAt - r.top;
    const next = span > 0 ? Math.min(1, Math.max(0, travelled / span)) : 0;
    if (Math.abs(next - raw.get()) > 0.0005) raw.set(next);
  });

  const progress = useSpring(raw, { stiffness: 120, damping: 26, mass: 0.35 });

  /*
   * הסטייה נגזרת מהרוחב שנמדד, ולא קבועה.
   *
   * ערך קבוע נראה צר במסך רחב ורחב מדי במסך צר. אחוז מהרוחב שומר על
   * אותה תחושה בכל רזולוציה, עם תקרה ורצפה כדי שלא יתפרק בקצוות.
   * המסדרון גדל יחד עם הסטייה, ולכן הכרטיסים אף פעם לא נוגעים בקו.
   */
  const amp = wide ? Math.min(AMP_MAX, Math.max(AMP_MIN, box.w * AMP_RATIO)) : 0;
  const corridor = amp + 32;

  /* ידיות אנכיות: המעבר בין הצדדים רך ולא זוויתי */
  const d = points.length
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const dy = (p.y - prev.y) * 0.5;
        return `${acc} C ${prev.x} ${prev.y + dy}, ${p.x} ${p.y - dy}, ${p.x} ${p.y}`;
      }, "")
    : "";

  /*
   * מה שכבר עברנו נשאר מואר.
   *
   * ה-dash נכתב ידנית על אלמנט רגיל ולא דרך motion.path: framer מנהל
   * בעצמו את strokeDasharray שם, וכל ערך שנכתב אליו נדרס - הרווח הוחלף
   * ב-1px, הדוגמה חזרה על עצמה, וכל הקו נראה דלוק בבת אחת. גם
   * pathLength לא הפיק dasharray, לא כפרופ ולא ב-style. כתיבה ישירה
   * נותנת התנהגות ודאית.
   *
   * dasharray באורך הקו המלא, ו-offset שיורד עם ההתקדמות: הוורוד נחשף
   * מההתחלה ועד הנקודה, ונשאר. השאר אפור.
   */
  const litRef = useRef<SVGPathElement | null>(null);
  useEffect(() => {
    const el = litRef.current;
    if (!el || !d) return;
    const total = el.getTotalLength();
    if (!total) return;
    el.style.strokeDasharray = `${total} ${total}`;
    const apply = (v: number) => {
      el.style.strokeDashoffset = String(total * (1 - Math.min(1, Math.max(0, v))));
    };
    apply(progress.get());
    return progress.on("change", apply);
  }, [d, progress]);

  const offsetDistance = useTransform(progress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-7xl">
      {d && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${Math.max(1, box.w)} ${Math.max(1, box.h)}`}
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          {/* המסלול המלא, אפור ושקט */}
          <path d={d} stroke="rgba(242,241,236,0.14)" strokeWidth="2" strokeLinecap="round" />
          {/* מה שכבר עברנו, בוורוד */}
          <path
            ref={litRef}
            d={d}
            stroke="#FF2D85"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={
              reduced
                ? { opacity: 0 }
                : { filter: "drop-shadow(0 0 7px rgba(255,45,133,0.55))" }
            }
          />
        </svg>
      )}

      {d && !reduced && (
        <motion.span
          className="pointer-events-none absolute left-0 top-0 z-[3] block h-3 w-3 rounded-full bg-brand"
          style={{
            offsetPath: `path("${d}")`,
            offsetDistance,
            offsetRotate: "0deg",
            marginLeft: -6,
            marginTop: -6,
            boxShadow: "0 0 16px 5px rgba(255,45,133,0.6)",
            willChange: "offset-distance",
          }}
          aria-hidden
        />
      )}

      <ol className="relative z-[1] flex flex-col" data-snake={id}>
        {steps.map((step, i) => (
          <SnakeStepItem
            key={step.title}
            step={step}
            index={i}
            total={steps.length}
            wide={wide}
            amp={amp}
            corridor={corridor}
            progress={progress}
            reduced={reduced}
            setDot={(el) => (dotRefs.current[i] = el)}
          />
        ))}
      </ol>
    </div>
  );
};

type ItemProps = {
  step: SnakeStep;
  index: number;
  total: number;
  wide: boolean;
  /** סטיית העיגון מהמרכז, בפיקסלים */
  amp: number;
  /** חצי רוחב המסדרון שהכרטיסים חייבים להישאר מחוצה לו */
  corridor: number;
  progress: ReturnType<typeof useSpring>;
  reduced: boolean;
  setDot: (el: HTMLElement | null) => void;
};

const SnakeStepItem = ({ step, index, total, wide, amp, corridor, progress, reduced, setDot }: ItemProps) => {
  const at = total > 1 ? index / (total - 1) : 0;
  /*
   * לשלב הראשון at הוא 0, ולכן [at-0.07, at] היה טווח באורך אפס -
   * useTransform על טווח מנוון לא מתקדם, והכרטיס נשאר תקוע בהיסט
   * הכניסה שלו. נותנים לו חלון קצר קדימה במקום אחורה.
   */
  const from = at === 0 ? 0 : Math.max(0, at - 0.07);
  const to = at === 0 ? 0.05 : at;

  /* ההדלקה: מ-0 ל-1 בדיוק כשנקודת האור מגיעה לשלב */
  const lit = useTransform(progress, [from, to], [0, 1]);
  const cardOpacity = useTransform(lit, [0, 1], [0.38, 1]);
  const dotScale = useTransform(lit, [0, 1], [0.72, 1]);
  const ring = useTransform(lit, [0, 1], [0, 1]);
  const barScale = useTransform(lit, [0, 1], [0, 1]);

  /* הכרטיס נכנס מהצד שלו: התנועה מספרת מאיפה הוא הגיע */
  const rightSide = index % 2 === 0;
  const enterFrom = wide ? (rightSide ? 28 : -28) : 16;
  const cardX = useTransform(lit, [0, 1], [enterFrom, 0]);

  /* ראשון ואחרון על ציר המרכז, האמצעיים סוטים לסירוגין */
  const isEdge = index === 0 || index === total - 1;
  const ampPx = !wide || isEdge ? 0 : rightSide ? amp : -amp;

  return (
    <li className="relative py-7 sm:py-9">
      {/* העיגון יושב על הקו: במרכז בדסקטופ, בשוליים בטלפון */}
      <motion.span
        ref={setDot}
        className="absolute top-8 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#141319] text-[11px] font-semibold text-bone sm:h-10 sm:w-10 sm:text-xs"
        /*
          * המרכוז עובר דרך x של framer ולא דרך -translate-x-1/2.
          * framer כותב transform inline בשביל ה-scale, ו-inline גובר על
          * המחלקה - העיגון יצא מוסט בחצי מרוחבו והקו לא ישב במרכז.
          */
        style={{
          left: wide ? `calc(50% + ${ampPx}px)` : 18,
          x: "-50%",
          ...(reduced ? {} : { scale: dotScale }),
        }}
      >
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={
            reduced
              ? undefined
              : { opacity: ring, boxShadow: "0 0 0 2px #FF2D85, 0 0 20px 4px rgba(255,45,133,0.45)" }
          }
          aria-hidden
        />
        <span className="relative" dir="ltr">
          {String(index + 1).padStart(2, "0")}
        </span>
      </motion.span>

      {/*
        * הכרטיס חי מחוץ למסדרון של הקו.
        * calc(50% - 5rem) משאיר מסדרון של 10rem במרכז לקו ולעיגון.
        */}
      <motion.div
        className={wide ? (rightSide ? "ms-auto text-start" : "me-auto text-end") : "ps-16 text-start"}
        style={{
          ...(wide ? { width: `calc(50% - ${corridor}px)` } : null),
          ...(reduced ? {} : { opacity: cardOpacity, x: cardX }),
        }}
      >
        {/* קו הדגשה קצר שנפתח מהצד של הכרטיס כשהוא נדלק */}
        <motion.span
          className={`mb-3 block h-px w-10 bg-brand ${wide && !rightSide ? "ms-auto origin-right" : "origin-left"}`}
          style={reduced ? undefined : { scaleX: barScale, opacity: ring }}
          aria-hidden
        />
        <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-bone sm:text-xl">
          {step.title}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-bone/60">{step.text}</p>
      </motion.div>
    </li>
  );
};

export default SnakePath;
