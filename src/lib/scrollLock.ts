import { useEffect } from "react";

/**
 * נעילת גלילה אחת ויחידה לכל האתר.
 *
 * קודם היו חמישה מקומות שכתבו ישירות ל-body.style.overflow: מסך
 * הטעינה, תפריט הנייד, גלריית התוצרים ושלושת הפופאפים. כשהם נפתחו
 * ונסגרו בסדר שונה הם דרסו זה את זה, ומצב אחד סיים עם overflow:hidden
 * תקוע - כלומר עמוד שלא נגלל בכלל, בלי שום סימן חיצוני לבעיה.
 *
 * עכשיו יש מונה אחד: הנעילה הראשונה שומרת את הערך המקורי, והשחרור
 * האחרון מחזיר אותו. כל נעילה באמצע לא נוגעת בכלום.
 */

declare global {
  interface Window {
    __lenis?: { stop: () => void; start: () => void };
  }
}

let locks = 0;
let savedOverflow = "";

export function lockScroll() {
  if (typeof document === "undefined") return;
  const { body } = document;
  if (locks === 0) {
    savedOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    window.__lenis?.stop();
  }
  locks += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  locks -= 1;
  if (locks > 0) return;
  locks = 0;
  document.body.style.overflow = savedOverflow;
  window.__lenis?.start();
}

/**
 * נועל את הגלילה כל עוד active, ומשחזר את מיקום הגלילה בסגירה כדי
 * שסגירת פופאפ לא תקפיץ את המשתמש לראש העמוד.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    lockScroll();

    return () => {
      unlockScroll();
      /* Lenis עלול לאפס את המיקום כשהוא מתעורר, ולכן מחזירים אותו ידנית */
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [active]);
}

/**
 * חלון קצר אחרי סגירת פופאפ שבו אסור לפתוח אותו מחדש.
 *
 * הסגירה בלחיצה מחוץ לפאנל קורית ב-pointerdown, ואז שחרור העכבר נוחת
 * על מה שהיה מתחתיו. בלי החסם הזה, אותה לחיצה עצמה פותחת את הפופאפ שוב
 * והמשתמש מרגיש שהאתר תקוע.
 */
let lastCloseAt = 0;

export function markPopupClosed() {
  lastCloseAt = Date.now();
}

export function popupJustClosed() {
  return Date.now() - lastCloseAt < 350;
}
