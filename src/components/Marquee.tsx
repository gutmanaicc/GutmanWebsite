import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";

type Props = {
  items: string[];
  className?: string;
};

/**
 * רצועה נעה שאפשר לתפוס ולגרור. הלולאה רצה על motion value אחד,
 * הגרירה מזיזה אותו ידנית, והשחרור מחזיר את התנועה מאותה נקודה.
 */
const Marquee = ({ items, className = "" }: Props) => {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  /* אורך מחזור הלולאה = רוחב עותק אחד */
  const halfWidth = useRef(0);

  /*
   * מספר העותקים נגזר מהרוחב, ולא קבוע על שניים.
   *
   * עותק אחד של המשפטים הוא כ-1350px. במסך 1920 זה צר מהרצועה עצמה,
   * ולכן בכל גלגול של הלולאה לא היה מספיק תוכן כדי למלא את הרוחב
   * ונפער חלל - הרצועה נראתה "חתוכה" או נעלמת. בטלפון זה לא הופיע כי
   * עותק אחד רחב מהמסך. עכשיו מרנדרים עותקים עד שהם מכסים את הרוחב,
   * ועוד אחד כרזרבה לגלגול.
   */
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const measure = () => {
      const rowW = rowRef.current?.scrollWidth ?? 0;
      const wrapW = trackRef.current?.parentElement?.clientWidth ?? 0;
      if (!rowW) return;
      halfWidth.current = rowW;
      setCopies(Math.max(2, Math.ceil(wrapW / rowW) + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current?.parentElement) ro.observe(trackRef.current.parentElement);
    return () => ro.disconnect();
  }, [items]);

  useEffect(() => {
    const rowW = rowRef.current?.scrollWidth ?? 0;
    if (rowW) halfWidth.current = rowW;
  }, [copies, items]);

  /* מחזיר כל ערך אל תוך [-half, 0). הדוגמה מחזורית, ולכן זה בלתי נראה. */
  const wrap = (v: number, half: number) => {
    if (!half) return v;
    let n = v % half;
    if (n > 0) n -= half;
    return n;
  };

  useAnimationFrame((_, delta) => {
    const half = halfWidth.current || rowRef.current?.scrollWidth || 0;
    halfWidth.current = half;
    if (!half) return;

    /*
     * הגלגול קורה בכל פריים, גם תוך כדי גרירה.
     *
     * קודם הפונקציה יצאה מוקדם כשגררו, ולכן שום דבר לא החזיר את הערך
     * לתחום הלולאה עד לשחרור. שתי השורות שמרכיבות את הרצועה מכסות
     * חצי רוחב בלבד, ומי שגרר רחוק יצא מהתחום וראה חלל ריק - הרצועה
     * "נחתכה" או נעלמה בקצה. עכשיו הערך תמיד בתוך הלולאה.
     */
    if (!reduced && !dragging.current) {
      x.set(wrap(x.get() + (delta / 1000) * 42, half)); // 42px לשנייה
    } else {
      const v = x.get();
      const w = wrap(v, half);
      if (w !== v) x.set(w);
    }
  });

  /*
   * גרירה בשליטה מלאה, במקום drag של framer.
   *
   * framer כותב ל-motion value מתוך מקור פנימי משלו, ולכן כל תיקון
   * שלנו באמצע הגרירה היה נדרס בתנועת המצביע הבאה וגורם לקפיצה. כאן
   * אנחנו כותבים את הערך, ולכן אפשר לגלגל אותו לתוך הלולאה בכל פריים
   * בלי להיאבק באף אחד. touch-action: pan-y משאיר את גלילת העמוד
   * האנכית זמינה תוך כדי.
   */
  const dragStart = useRef({ pointer: 0, value: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    dragging.current = true;
    dragStart.current = { pointer: e.clientX, value: x.get() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.pointer;
    x.set(wrap(dragStart.current.value + dx, halfWidth.current));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  /*
   * המרווח יושב על הטקסט עצמו, ולא כ-gap בין האלמנטים.
   *
   * קודם הטקסט והכוכב היו בתוך flex עם gap-14, ובין הפריטים היה gap-14
   * נוסף - אבל שתי השורות שמרכיבות את הלולאה ישבו צמודות זו לזו בלי שום
   * מרווח. בתפר שביניהן הכוכב האחרון נדבק לטקסט הראשון של השורה הבאה.
   *
   * להוסיף gap בין השורות לא היה פותר: חישוב הלולאה נשען על scrollWidth
   * חלקי שתיים, וכל מרווח נוסף היה מזיז את נקודת הגלגול ויוצר קפיצה.
   * כשכל פריט נושא את הריפוד שלו, שתי השורות מתחברות בלי תפר והמרווח
   * סביב כל כוכב זהה לאורך כל הרצועה.
   */
  const row = (dup: boolean) => (
    <div
      ref={dup ? undefined : rowRef}
      className="flex shrink-0 items-center"
      aria-hidden={dup || undefined}
    >
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="flex select-none items-center whitespace-nowrap text-sm font-medium tracking-wide text-bone/70"
        >
          <span className="px-14">{item}</span>
          <span className="select-none text-brand" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`marquee cursor-grab active:cursor-grabbing ${className}`} dir="ltr">
      <motion.div
        ref={trackRef}
        className="flex w-max"
        dir="rtl"
        style={{ x, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {Array.from({ length: copies }, (_, i) => (
          <Fragment key={i}>{row(i > 0)}</Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export default Marquee;
