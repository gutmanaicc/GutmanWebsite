import { hasDeclined } from "./consent";

const CLARITY_ID = "y8w96aifrd";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Microsoft Clarity: מפות חום והקלטות מסך.
 *
 * נטען באותו מודל של הפיקסל ודרך אותו דגל הסכמה. מי שכיבה מדידה לא
 * מקבל אותו כלל, גם בביקורים הבאים, ולכן הבדיקה כאן ולא בקומפוננטה.
 */
export function loadClarity() {
  if (typeof window === "undefined" || window.clarity || hasDeclined()) return;

  /*
   * תור הפקודות נשמר כפי שהוא בסניפט הרשמי של מיקרוסופט, על ה-arguments
   * שבתוכו. קריאות שקורות לפני שהסקריפט ירד נכנסות ל-clarity.q והוא
   * משחזר אותן כשהוא עולה; ניסוח מחדש של השורה הזאת מסכן את התור.
   *
   * מה שכן שונה מהסניפט: ההזרקה היא ל-head במקום לפני תגית הסקריפט
   * הראשונה. השיטה המקורית נשענת על כך שקיימת בדף תגית script, וזה נכון
   * כאן במקרה בלבד. אין לזה השפעה על התור.
   */
  const w = window as any;
  w.clarity =
    w.clarity ||
    function () {
      (w.clarity.q = w.clarity.q || []).push(arguments);
    };

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
}

/**
 * כיבוי אחרי שהסקריפט כבר רץ.
 *
 * consentv2 הוא ה-API הנוכחי של Clarity; הישן, consent, בדרך להוצאה
 * משימוש ואין להשתמש בו. שתי הקריאות יחד ולא אחת: consentv2 מסמן את
 * ההעדפה, ו-stop הוא זה שמפסיק בפועל קריאה וכתיבה של עוגיות צד ראשון.
 *
 * שים לב ש-stop לא הופך את Clarity לאילם לחלוטין. הוא מפסיק את העוגיות,
 * ואיסוף אנונימי ומצומצם עשוי להימשך עד סוף הביקור. הביקורים הבאים
 * נחסמים ממילא ב-loadClarity, שלא יטען את הסקריפט כלל.
 */
export function revokeClarity() {
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  window.clarity?.("stop");
}

export function grantClarity() {
  window.clarity?.("consentv2", { ad_Storage: "granted", analytics_Storage: "granted" });
}
