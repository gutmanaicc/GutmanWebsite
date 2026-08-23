import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMediaQuery, useMotionCapability } from "../lib/motion";

export type SnakeStep = { title: string; text: string };

type Props = {
  steps: SnakeStep[];
  /** מזהה ייחודי, כדי ששני מסלולים באותו עמוד לא יתנגשו */
  id: string;
};

/** רוחב המסדרון של הנחש, לפי רוחב מסך. הטקסט מתחיל מיד אחריו. */
const RAIL_WIDE = 88;
const RAIL_NARROW = 44;
/** כמה הרצועה מתפתלת בתוך המסדרון. חייב להישאר קטן מחצי הרוחב. */
const AMP_RATIO = 0.32;
const AMP_MAX = 30;
/** אורך הזנב שנכנס מעל השלב הראשון ויוצא מתחת לאחרון */
const STUB = 44;
/** רצפת השקיפות של שלב שטרם הואר. מתחת לזה גוף הטקסט נופל מ-AA. */
const DIM = 0.75;

/**
 * מסלול הנחש כרצועה צדדית, עם הטקסט בעמודה אחת לצדה.
 *
 * הגרסה הקודמת (SnakePath) פרשה את הכרטיסים לסירוגין משני צדי הקו,
 * ולכן כל כותרת התחילה בנקודה אחרת לרוחב המסך. הקורא נאלץ לקפוץ עם
 * העיניים מקצה לקצה בכל שלב, וזה בדיוק מה שמנע ממנו לקרוא ברצף.
 *
 * כאן הקו נכלא במסדרון צר בצד ההתחלה (ימין ב-RTL), והטקסט יושב בעמודה
 * אחת לצדו. כל הכותרות מתחילות באותו קו אנכי, ולכן העין נשארת במקום
 * אחד לאורך כל הסקשן. מה שזז זה רק האור.
 *
 * הנחש עדיין מתפתל, אבל בתוך המסדרון בלבד. העיגונים יושבים על ציר ישר
 * במרכזו, והרצועה משתרגת סביבם: חוט שעובר דרך חרוזים. זו הסיבה
 * שהמספר עבר מתוך העיגון אל הטקסט. עיגון שמכיל ספרה הוא תחנה בסולם
 * שלבים, ועיגון ריק הוא נקודת אור על גוף הנחש.
 */
const SnakeRail = ({ steps, id }: Props) => {
  /*
   * דרך useMotionCapability ולא דרך useReducedMotion לבדו, כדי שתפריט
   * הנגישות (a11y-reduce-motion) יעצור גם הוא את התנועה. SnakePath
   * הישן הכיר רק את העדפת המערכת והמשיך לרוץ אחרי לחיצה בתפריט.
   */
  const still = useMotionCapability() === "static";
  const wide = useMediaQuery("(min-width: 768px)");
  const rail = wide ? RAIL_WIDE : RAIL_NARROW;

  const wrapRef = useRef<HTMLDivElement>(null);
  const beadRefs = useRef<(HTMLElement | null)[]>([]);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);

  /*
   * הגאומטריה נמדדת מה-DOM ולא מחושבת מגבהים משוערים: אורך הטקסט,
   * גודל הגופן ורוחב המסך משנים את גובה כל שלב, וכל חישוב מראש נשבר
   * ברגע שמישהו עורך משפט ב-src/data.
   */
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect();
      setBox({ w: base.width, h: base.height });
      setPts(
        beadRefs.current.slice(0, steps.length).map((el) => {
          if (!el) return { x: 0, y: 0 };
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
   * ההתקדמות נמדדת בכל פריים ולא מאירוע scroll.
   *
   * האתר מריץ Lenis, ואירועי scroll של החלון לא מגיעים לכאן בכלל.
   * לולאת הפריימים של framer לא תלויה במי שמנהל את הגלילה. המחיר הוא
   * getBoundingClientRect אחד לפריים, וגם הוא נחסך כשהסקשן רחוק.
   *
   * המהלך ממוקם סביב מרכז המסך: מתחיל כשראש הסקשן חוצה 60% מגובה
   * החלון ונגמר כשסופו מגיע ל-45%, ולכן כל שלב נדלק בזמן שהוא עדיין
   * עולה אל אזור הקריאה הנוח, לא אחרי שעבר אותו.
   */
  const raw = useMotionValue(0);
  useAnimationFrame(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    const startAt = window.innerHeight * 0.6;
    const endAt = window.innerHeight * 0.45;
    const span = r.height + (startAt - endAt);
    const travelled = startAt - r.top;
    const next = span > 0 ? Math.min(1, Math.max(0, travelled / span)) : 0;
    if (Math.abs(next - raw.get()) > 0.0005) raw.set(next);
  });

  const progress = useSpring(raw, { stiffness: 120, damping: 26, mass: 0.35 });

  /*
   * ציר המסדרון נלקח מהעיגון שנמדד, ולא מ-rail/2.
   *
   * האתר כולו dir="rtl", ולכן עמודת המסדרון יושבת בקצה הימני של
   * המעטפת: המרכז שלה הוא box.w - rail/2, לא rail/2. החישוב הקבוע צייר
   * את הנחש בצד השמאלי של הסקשן בזמן שהעיגונים ישבו בימין, ושניהם לא
   * נגעו. קריאה מהמדידה נכונה בשני הכיוונים בלי להתנות על אף אחד מהם.
   */
  const cx = pts.length ? pts[0].x : rail / 2;
  const amp = Math.min(AMP_MAX, rail * AMP_RATIO);
  const topY = pts.length ? Math.max(0, pts[0].y - STUB) : 0;
  const bottomY = pts.length ? Math.min(box.h, pts[pts.length - 1].y + STUB) : 0;

  /*
   * העיגונים על ציר ישר, הרצועה מתפתלת סביבם.
   *
   * שתי נקודות הבקרה של כל מקטע נדחפות לאותו צד, והצד מתחלף בין מקטע
   * למקטע. כך נוצר גל מתמשך שחוצה את הציר בדיוק בכל עיגון, במקום
   * זיגזג שמזיז גם את העיגונים עצמם.
   */
  const d = pts.length
    ? pts.reduce((acc, p, i) => {
        if (i === 0) return `M ${cx} ${topY} L ${cx} ${p.y}`;
        const prev = pts[i - 1];
        const s = i % 2 === 1 ? 1 : -1;
        const dy = (p.y - prev.y) * 0.45;
        return `${acc} C ${cx + s * amp} ${prev.y + dy}, ${cx + s * amp} ${p.y - dy}, ${cx} ${p.y}`;
      }, "") + ` L ${cx} ${bottomY}`
    : "";

  /*
   * מה שכבר עברנו נשאר מואר.
   *
   * ה-dash נכתב ידנית על אלמנט רגיל ולא דרך motion.path: framer מנהל
   * שם בעצמו את strokeDasharray וכל ערך שנכתב אליו נדרס, וכל הקו נראה
   * דלוק בבת אחת.
   *
   * באותו מעבר נמדד גם המיקום של כל עיגון על הקו, בחיפוש בינארי לפי y.
   * בלי זה השלבים היו נדלקים לפי index/(total-1), כלומר בהנחה שכל
   * השלבים באותו גובה. הם לא: פסקה בת שתי שורות דוחפת את כל מי שאחריה,
   * והאור היה מקדים או מאחר את העיגון בכמה עשרות פיקסלים.
   */
  const litRef = useRef<SVGPathElement | null>(null);
  const [beadAt, setBeadAt] = useState<number[]>([]);
  useEffect(() => {
    const el = litRef.current;
    if (still || !el || !d || !pts.length) return;
    const total = el.getTotalLength();
    if (!total) return;

    el.style.strokeDasharray = `${total} ${total}`;
    const apply = (v: number) => {
      el.style.strokeDashoffset = String(total * (1 - Math.min(1, Math.max(0, v))));
    };
    apply(progress.get());

    setBeadAt(
      pts.map(({ y }) => {
        let lo = 0;
        let hi = total;
        for (let k = 0; k < 24; k += 1) {
          const mid = (lo + hi) / 2;
          if (el.getPointAtLength(mid).y < y) lo = mid;
          else hi = mid;
        }
        return lo / total;
      }),
    );

    return progress.on("change", apply);
  }, [d, pts, progress, still]);

  const headDistance = useTransform(progress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);
  /* הנחש נכנס לפריים ויוצא ממנו, במקום להיתקע דבוק לקצוות */
  const headOpacity = useTransform(progress, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);

  return (
    <div
      ref={wrapRef}
      /*
       * הרוחב נגזר מהכותרת, לא מנוחות קריאה בלבד.
       *
       * ב-46rem הרצועה נחתה מחוץ לטווח הכותרת של הסקשן (49px מעבר לקצה
       * הימני שלה במסך 1440), ולכן הנחש נראה מנותק ומרחף בשוליים למרות
       * שהבלוק עצמו היה ממורכז בדיוק. ב-40rem הרצועה נופלת בתוך הכותרת,
       * והכותרת והמסלול נקראים כעמודה אחת.
       */
      className="relative mx-auto w-full max-w-[40rem]"
      data-snake={id}
    >
      {d && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${Math.max(1, box.w)} ${Math.max(1, box.h)}`}
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          {/*
            * בלי תנועה המסלול כולו נצבע, ושכבת ה"כבר עברנו" לא נטענת בכלל.
            * הסתרה שלה בשקיפות 0 השאירה רצועה אפורה חיוורת מתחת לעיגונים
            * דלוקים, וזה נראה כמו סקשן שלא סיים להיטען.
            */}
          <path
            d={d}
            stroke={still ? "rgba(255,45,133,0.45)" : "rgba(242,241,236,0.12)"}
            strokeWidth={still ? 2 : 1.5}
            strokeLinecap="round"
          />
          {!still && (
            <path
              ref={litRef}
              d={d}
              stroke="#FF2D85"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,45,133,0.5))" }}
            />
          )}
        </svg>
      )}

      {d && !still && (
        <motion.span
          className="pointer-events-none absolute left-0 top-0 z-[3] block h-2.5 w-2.5 rounded-full bg-brand"
          style={{
            offsetPath: `path("${d}")`,
            offsetDistance: headDistance,
            offsetRotate: "0deg",
            opacity: headOpacity,
            marginLeft: -5,
            marginTop: -5,
            boxShadow: "0 0 18px 6px rgba(255,45,133,0.55)",
            willChange: "offset-distance",
          }}
          aria-hidden
        />
      )}

      <ol className="relative z-[1]">
        {steps.map((step, i) => (
          <RailStep
            key={step.title}
            step={step}
            index={i}
            rail={rail}
            at={beadAt[i]}
            progress={progress}
            still={still}
            setBead={(el) => (beadRefs.current[i] = el)}
          />
        ))}
      </ol>
    </div>
  );
};

type StepProps = {
  step: SnakeStep;
  index: number;
  rail: number;
  /** מיקום העיגון על הקו, כשבר מאורכו. undefined עד שהקו נמדד. */
  at: number | undefined;
  progress: ReturnType<typeof useSpring>;
  still: boolean;
  setBead: (el: HTMLElement | null) => void;
};

const RailStep = ({ step, index, rail, at, progress, still, setBead }: StepProps) => {
  /*
   * לפני שהקו נמדד אין at, ובלי טווח תקין useTransform מחזיר ערך קפוא.
   * נותנים טווח דמה קדימה, והשלב פשוט נשאר בשקיפות ההמתנה עד שהמדידה
   * מגיעה בפריים הבא.
   */
  const to = at ?? 2;
  const from = Math.max(0, to - 0.05);
  const lit = useTransform(progress, [from, Math.max(from + 0.001, to)], [0, 1]);

  /*
   * במצב סטטי נכתבים ערכי הסוף במפורש ולא style={undefined}.
   *
   * framer כותב את הערכים ישירות ל-DOM דרך מנוי על ה-MotionValue, ולכן
   * הסרת ה-prop לא מנקה מה שכבר נכתב: אחרי כיבוי התנועה מהתפריט השלבים
   * שכבר הוארו נשארו דלוקים והשאר נשארו כבויים לתמיד.
   */
  const dim = useTransform(lit, [0, 1], [DIM, 1]);
  const grow = useTransform(lit, [0, 1], [0, 1]);
  const beadScale = useTransform(lit, [0, 1], [0.6, 1]);
  const numeral = useTransform(lit, [0, 1], ["rgba(242,241,236,0.7)", "#FF2D85"]);

  return (
    <li className="relative grid py-7 sm:py-9" style={{ gridTemplateColumns: `${rail}px 1fr` }}>
      {/* עמודת המסדרון: העיגון והקו שמחבר אותו לטקסט */}
      <div className="relative">
        <motion.span
          ref={setBead}
          className="absolute top-[0.45rem] z-[2] block h-3 w-3 rounded-full border border-white/20 bg-surface-1"
          /*
           * המרכוז דרך x של framer ולא דרך מחלקת translate: framer כותב
           * transform inline בשביל ה-scale, ו-inline גובר על המחלקה.
           * העיגון היה יוצא מוסט בחצי מרוחבו והקו לא היה עובר דרכו.
           */
          style={{ left: "50%", x: "-50%", scale: still ? 1 : beadScale }}
        >
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full bg-brand"
            style={{
              opacity: still ? 1 : grow,
              boxShadow: still ? undefined : "0 0 14px 3px rgba(255,45,133,0.5)",
            }}
            aria-hidden
          />
        </motion.span>

        {/*
          * החוט הקצר מהעיגון אל הטקסט. הוא זה שהופך את הרצועה ואת המילים
          * לדבר אחד, ולכן הוא נמתח מכיוון העיגון החוצה.
          *
          * transform-origin לא מקבל ערכים לוגיים, והאתר כולו dir="rtl",
          * ולכן "right" כאן הוא צד ההתחלה, כלומר צד העיגון.
          */}
        <motion.span
          className="pointer-events-none absolute top-[0.95rem] block h-px bg-brand/60"
          style={{
            insetInlineStart: "50%",
            insetInlineEnd: 0,
            transformOrigin: "right center",
            scaleX: still ? 1 : grow,
            opacity: still ? 1 : grow,
          }}
          aria-hidden
        />
      </div>

      {/* עמודת הטקסט: אותה נקודת התחלה בכל שלב, ולכן העין לא נודדת */}
      <motion.div className="ps-5 sm:ps-6" style={{ opacity: still ? 1 : dim }}>
        <motion.span
          className="mb-2 block w-fit font-display text-xs font-semibold tabular-nums tracking-[0.2em]"
          dir="ltr"
          style={still ? { color: "#FF2D85" } : { color: numeral }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
        <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-bone sm:text-xl">
          {step.title}
        </h3>
        <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-bone/85">{step.text}</p>
      </motion.div>
    </li>
  );
};

export default SnakeRail;
