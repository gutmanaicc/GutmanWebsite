import { useCallback, useEffect, useRef } from "react";
import { animate, useInView, useMotionValue } from "framer-motion";
import { SCROLL_EASE, useStillMotion } from "./useStillMotion";

type Props = {
  to: number;
  from?: number;
  /** משך בשניות, ברירת מחדל 1.4 */
  duration?: number;
  className?: string;
  /** טקסט שמוצג אחרי המספר, למשל "אלף ₪" */
  suffix?: string;
  /** טקסט לפני */
  prefix?: string;
};

/** מספר השברים נגזר מהיעד, אחרת 4.5 היה מתגלגל דרך 4.5000000001 בדרך. */
function decimalsOf(value: number): number {
  if (Number.isInteger(value)) return 0;
  return String(value).split(".")[1]?.length ?? 0;
}

const CountUp = ({ to, from = 0, duration = 1.4, className = "", suffix, prefix }: Props) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const still = useStillMotion();
  const inView = useInView(wrapRef, { once: true, amount: 0.4 });
  const count = useMotionValue(from);

  const decimals = decimalsOf(to);
  /** מיוצב ב-useCallback כי הוא נכנס לתלויות של האפקט, ופונקציה חדשה בכל רינדור הייתה מאתחלת את הספירה מחדש. */
  const format = useCallback(
    (value: number) =>
      value.toLocaleString("he-IL", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );

  useEffect(() => {
    if (still || !inView) return;

    /**
     * המספר נכתב ישירות ל-DOM ולא דרך state. ספירה היא הערך הבודד באתר שאי
     * אפשר להנפיש בטרנספורם, ורינדור מחדש של React בכל פריים של הספירה מושך
     * איתו את כל תת-העץ. כתיבה ל-textContent נוגעת בצומת אחד.
     *
     * זה בטוח מול React דווקא כי הילד שנרנדר הוא מחרוזת קבועה: בעדכון הבא
     * React משווה מול ה-vDOM הקודם, מוצא אותו ערך, ולא נוגע בצומת.
     */
    const stop = count.on("change", (value) => {
      if (numberRef.current) numberRef.current.textContent = format(value);
    });
    const controls = animate(count, to, { duration, ease: SCROLL_EASE });

    return () => {
      stop();
      controls.stop();
    };
  }, [still, inView, to, duration, count, format]);

  /**
   * במצב "בלי תנועה" מוצג היעד מיד. הבדיקה הזאת היא גם הרשת מול הבאגה
   * המסוכנת של הרכיב: בלי אנימציה שרצה, `from` היה נשאר על המסך לנצח.
   */
  const initial = format(still ? to : from);
  const srText = `${prefix ?? ""}${format(to)}${suffix ? ` ${suffix}` : ""}`;

  /**
   * `bdi` עוטף את הקידומת והמספר ביחד: בהקשר RTL סימן כמו "+" או "₪" שצמוד
   * למספר נודד לצד השני של הביטוי לפי כללי ה-bidi. הסיומת נשארת בחוץ כי היא
   * טקסט עברי שאמור לזרום עם המשפט.
   */
  return (
    <span ref={wrapRef} className={className}>
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true">
        <bdi dir="ltr">
          {prefix}
          <span ref={numberRef}>{initial}</span>
        </bdi>
        {suffix ? ` ${suffix}` : null}
      </span>
    </span>
  );
};

export default CountUp;
