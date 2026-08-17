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
    __lenis?: {
      stop: () => void;
      start: () => void;
      scrollTo: (target: number, options?: { immediate?: boolean; force?: boolean }) => void;
      resize: () => void;
    };
  }
}

/**
 * חותמת הזמן של איפוס הגלילה האחרון במעבר עמוד.
 *
 * ScrollManager מדווח לכאן, וזה מכריע תחרות אמיתית: כשסוגרים פופאפ
 * בגלל ניווט, שני מנגנונים רוצים לקבוע את מיקום הגלילה של העמוד החדש.
 * האיפוס של המעבר רץ ראשון, ואז סגירת הפופאפ מגיעה בקומיט מאוחר יותר
 * ומחזירה את המיקום של העמוד הקודם - כך נחת /reviews באמצע העמוד אחרי
 * ניווט מתפריט הנייד. איפוס עמוד תמיד גובר על שחזור מיקום של פופאפ.
 */
let lastResetAt = 0;

export function markScrollReset() {
  lastResetAt = Date.now();
}

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const lenis = window.__lenis;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const scrollY = window.scrollY;
    const lockedAt = Date.now();

    lenis?.stop();
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
      lenis?.start();

      /* העמוד התחלף בזמן שהפופאפ היה פתוח: המיקום הישן כבר לא רלוונטי */
      if (lastResetAt > lockedAt) return;

      /*
       * השחזור עובר דרך Lenis ולא דרך window.scrollTo.
       *
       * Lenis מחזיק מיקום גלילה משלו ודוחף אותו בחזרה בפריים הבא, ולכן
       * window.scrollTo נמחק מיד והעמוד קפץ לראש בסגירת כל פופאפ. force
       * כדי שהפקודה תתפוס גם ברגע שבו המנוע עוד לא התעורר לגמרי.
       */
      if (lenis) lenis.scrollTo(scrollY, { immediate: true, force: true });
      else window.scrollTo({ top: scrollY, behavior: "auto" });
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
