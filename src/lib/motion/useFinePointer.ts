import { useEffect, useState } from "react";

/**
 * True when the primary pointing device can hover (desktop mouse / trackpad).
 *
 * נקרא סינכרונית ברינדור הראשון, מאותה סיבה כמו ב-useMediaQuery: הערך
 * הזה מזין את useMotionCapability, וכל קומפוננטה שבוחרת ענף לפי רמת
 * התנועה הייתה מרנדרת קודם את ענף הנייד ורק אז מחליפה. החלפה כזו
 * מרכיבה מחדש עצים שלמים ומפילה אנימציות כניסה שכבר רצו.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(pointer: fine)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return fine;
}
