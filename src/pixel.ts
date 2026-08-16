const PIXEL_ID = "1392343815914070";
export const CONSENT_KEY = "cookie-consent-v1";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/**
 * המדידה פועלת בברירת מחדל, ונכבית למי שמבקש.
 *
 * קודם הפיקסל נטען רק אחרי לחיצה על "אישור", כך שכל מי שהתעלם
 * מהבאנר - והם הרוב - לא נספר בכלל, והנתונים בקמפיינים היו חלקיים.
 * עכשיו הפיקסל עולה מיד, הבאנר הוא הודעת יידוע, ומי שלוחץ "לא תודה"
 * מכבה את המדידה מאותו רגע ובכל הביקורים הבאים.
 */
export function hasDeclined(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "declined";
  } catch {
    return false;
  }
}

export function loadPixel() {
  if (typeof window === "undefined" || window.fbq || hasDeclined()) return;

  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue.push(args);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

/**
 * כיבוי המדידה אחרי שכבר נטענה.
 *
 * אי אפשר "לפרוק" סקריפט שכבר רץ, ולכן משתמשים במנגנון ההסכמה של
 * מטא עצמה: revoke עוצר שליחת אירועים בצד הלקוח. בנוסף כל הפונקציות
 * כאן בודקות את הדגל, כך שגם אם משהו ישתנה אצל מטא לא נשלח כלום.
 */
export function revokeTracking() {
  window.fbq?.("consent", "revoke");
}

export function grantTracking() {
  window.fbq?.("consent", "grant");
}

/** אירוע מותאם אישית */
export function track(event: string, params?: Record<string, unknown>) {
  if (hasDeclined()) return;
  window.fbq?.("trackCustom", event, params);
}

/** אירוע סטנדרטי של מטא (Lead, ViewContent וכדומה), שמנוע האופטימיזציה מזהה */
export function trackStandard(event: string, params?: Record<string, unknown>) {
  if (hasDeclined()) return;
  window.fbq?.("track", event, params);
}
