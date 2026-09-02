import { Fragment, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { SCROLL_EASE, useStillMotion } from "./useStillMotion";

type Props = {
  /** הטקסט הרגיל */
  text: string;
  /** מילים שמקבלות את הטיפוגרפיה המודגשת. אופציונלי. */
  accent?: string;
  className?: string;
  accentClassName?: string;
  as?: "h1" | "h2" | "h3";
  /** מתחיל את מקטע ה-accent בשורה חדשה, כששבירת השורה היא החלטת קומפוזיציה ולא מקרה. */
  breakBeforeAccent?: boolean;
};

/** ראה ההסבר ב-Reveal: אינדוקס דינמי על ה-proxy מייצר איחוד טיפוסים בלתי אפשרי ל-JSX. */
const TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type Segment = { word: string; accent: boolean };

/**
 * `accent` מקבל שני שימושים לגיטימיים ולכן נתמכים שניהם: ביטוי שכבר יושב בתוך
 * `text` ורק צריך הדגשה, או זנב שנוסף אחריו. אם מכריחים את הקורא לבחור, מישהו
 * יכתוב את הביטוי פעמיים והכותרת תשוכפל בקוראי מסך.
 */
function buildSegments(text: string, accent?: string): Segment[] {
  const words = (raw: string, isAccent: boolean): Segment[] =>
    raw
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, accent: isAccent }));

  if (!accent) return words(text, false);

  const at = text.indexOf(accent);
  if (at === -1) return [...words(text, false), ...words(accent, true)];

  return [
    ...words(text.slice(0, at), false),
    ...words(accent, true),
    ...words(text.slice(at + accent.length), false),
  ];
}

/**
 * חלוקה לשורות קומפוזיציה, לא לשורות טיפוגרפיה: הדפדפן ממשיך לשבור בתוך כל
 * שורה כרגיל, וכאן נקבעת רק נקודת חיתוך אחת שהמעצב ביקש.
 *
 * כשאין מה לחתוך (בלי accent, או accent שפותח את הכותרת ואין לפניו כלום)
 * מוחזרת שורה אחת, וכל עטיפת הפריסה נעלמת. זאת הדרך להבטיח ש-`false` הוא
 * אפס שינוי מול הגרסה הקודמת, ולא "כמעט אפס".
 */
function toRows(segments: Segment[], breakBeforeAccent: boolean): Segment[][] {
  if (!breakBeforeAccent) return [segments];

  const at = segments.findIndex((segment) => segment.accent);
  if (at <= 0) return [segments];

  return [segments.slice(0, at), segments.slice(at)];
}

const CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

/**
 * 130% ולא 100%: לעטיפה יש ריפוד תחתון שמפנה מקום לזנבות אותיות, והריפוד
 * הזה נמצא בתוך אזור ה-overflow. ב-100% המילה הייתה מציצה בתוכו כפס דק.
 */
const WORD: Variants = {
  hidden: { opacity: 0, y: "130%" },
  show: { opacity: 1, y: "0%", transition: { duration: 0.65, ease: SCROLL_EASE } },
};

/**
 * `vertical-align: bottom` הכרחי: לאלמנט inline-block עם overflow מוסתר הבסיס
 * הטיפוגרפי הוא הקצה התחתון שלו, וברירת המחדל הייתה מקפיצה כל מילה מוסתרת
 * שורה למטה ביחס לשכנותיה. הריפוד ומרווח השוליים השלילי מבטלים זה את זה,
 * כך שגובה השורה לא משתנה בגלל האנימציה.
 */
const CLIP_STYLE = {
  display: "inline-block",
  overflow: "hidden",
  verticalAlign: "bottom",
  paddingBottom: "0.18em",
  marginBottom: "-0.18em",
} as const;

/**
 * `display: block` ולא `<br/>`: תג שבירה בין העטיפות היה נספר כילד נוסף בעץ
 * ה-inline ומשבש את חישוב ה-inline-block עם ה-overflow שכל מילה יושבת בו.
 * בלוק הוא מפריד ברמת הפריסה בלבד: הוא לא נושא גובה שורה משלו, אין לו מרווחים,
 * ולכן הכותרת נראית זהה למעט נקודת השבירה.
 */
const ROW_STYLE = { display: "block" } as const;

const KineticHeading = ({
  text,
  accent,
  className = "",
  accentClassName = "",
  as = "h2",
  breakBeforeAccent = false,
}: Props) => {
  const still = useStillMotion();
  const segments = buildSegments(text, accent);
  const rows = toRows(segments, breakBeforeAccent);
  const broken = rows.length > 1;
  const Tag = TAGS[as] as typeof motion.h2;

  /** בלי שבירה אין עטיפה בכלל, כדי שהמסלול הקיים יישאר בית לבית מה שהיה. */
  const wrapRow = (children: ReactNode, key: number): ReactNode =>
    broken ? (
      <span key={key} style={ROW_STYLE}>
        {children}
      </span>
    ) : (
      <Fragment key={key}>{children}</Fragment>
    );

  if (still) {
    const Plain = as as "h2";
    return (
      <Plain className={className}>
        {rows.map((row, r) =>
          wrapRow(
            row.map((segment, i) => (
              <Fragment key={`${segment.word}-${i}`}>
                {i > 0 ? " " : null}
                {segment.accent ? <span className={accentClassName}>{segment.word}</span> : segment.word}
              </Fragment>
            )),
            r,
          ),
        )}
      </Plain>
    );
  }

  /**
   * הפיצול למילים שובר את זרימת הטקסט לקוראי מסך: כל span נקרא כיחידה נפרדת
   * והכותרת מוקראת מגומגמת. לכן הכותרת השלמה יושבת פעם אחת ב-sr-only,
   * והמילים המונפשות מוסתרות מעץ הנגישות. הרווחים בין העטיפות אמיתיים ולא
   * ריפוד, ולכן שבירת השורות נשארת של הדפדפן ואין גלישה אופקית.
   *
   * המחרוזת נבנית מכל המילים ברצף גם כששוברים שורה, כי השבירה היא ויזואלית:
   * לקורא מסך זה משפט אחד, והוא צריך להישמע כמשפט אחד.
   */
  const fullText = segments.map((segment) => segment.word).join(" ");

  return (
    <Tag className={className}>
      <span className="sr-only">{fullText}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={CONTAINER}
        /**
         * מכל inline שמכיל ילדים בלוק נשבר לבלוקים אנונימיים בדפדפן. הפיכתו
         * לבלוק בעצמו כשיש שבירה מייתרת את זה, ולא משנה כלום בפריסה כי ה-h
         * שמעליו בלוק ממילא.
         */
        style={broken ? ROW_STYLE : undefined}
      >
        {rows.map((row, r) =>
          wrapRow(
            row.map((segment, i) => (
              <Fragment key={`${segment.word}-${i}`}>
                {i > 0 ? " " : null}
                <span style={CLIP_STYLE}>
                  <motion.span
                    className={segment.accent ? accentClassName : undefined}
                    style={{ display: "inline-block", willChange: "transform, opacity" }}
                    variants={WORD}
                  >
                    {segment.word}
                  </motion.span>
                </span>
              </Fragment>
            )),
            r,
          ),
        )}
      </motion.span>
    </Tag>
  );
};

export default KineticHeading;
