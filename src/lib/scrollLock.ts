import { useEffect } from "react";

/**
 * נעילת גלילה לכל פופאפ באתר.
 *
 * לא מספיק להסתיר את הגלילה של ה-body: מנוע הגלילה החלקה (Lenis) ממשיך
 * לתפוס את גלגלת העכבר, וכשהרקע נעול והפופאפ לא מקבל את הגלגלת, העמוד
 * מרגיש תקוע. לכן עוצרים את Lenis במפורש כל עוד הפופאפ פתוח, ומחזירים
 * אותו בסגירה.
 *
 * בנוסף שומרים את מיקום הגלילה ומשחזרים אותו, כדי שסגירת הפופאפ לא
 * תקפיץ את המשתמש לראש העמוד.
 */

declare global {
  interface Window {
    __lenis?: { stop: () => void; start: () => void };
  }
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const lenis = window.__lenis;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const scrollY = window.scrollY;

    lenis?.stop();
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
      lenis?.start();
      /* Lenis עלול לאפס את המיקום כשהוא מתעורר, ולכן מחזירים אותו ידנית */
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [active]);
}

/**
 * חלון קצר אחרי סגירת פופאפ שבו אסור לפתוח אותו מחדש.
 *
 * הסגירה בלחיצה מחוץ לפאנל קורית ב-pointerdown, ואז שחרור העכבר נוחת
 * על מה שהיה מתחת. בלי החסם הזה, אותה לחיצה עצמה פותחת את הפופאפ שוב
 * והמשתמש מרגיש שהאתר תקוע.
 */
let lastCloseAt = 0;

export function markPopupClosed() {
  lastCloseAt = Date.now();
}

export function popupJustClosed() {
  return Date.now() - lastCloseAt < 350;
}
