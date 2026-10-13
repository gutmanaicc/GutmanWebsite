import { canUseAnalytics } from "./consent";

const GA_ID = "G-HDBJY296MJ";

/** המתג הרשמי של גוגל לכיבוי מדידה עבור מזהה מסוים */
const GA_DISABLE_KEY = `ga-disable-${GA_ID}`;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4.
 *
 * נטען באותו מודל של הפיקסל ו-Clarity ודרך אותו דגל הסכמה. מי שלא אישר
 * מדידה לא מקבל אותו כלל, גם בביקורים הבאים.
 *
 * אין כאן מעקב ידני אחרי מעבר בין עמודים, בכוונה. GA4 מזהה ניווטי
 * History API דרך Enhanced Measurement, ושליחה ידנית נוספת הייתה
 * סופרת כל מעבר עמוד ב-SPA פעמיים.
 */
export function loadGa() {
  if (typeof window === "undefined" || window.gtag || !canUseAnalytics()) return;

  /*
   * dataLayer ופונקציית הדחיפה נשמרים כפי שהם בסניפט הרשמי, על
   * ה-arguments שבתוכו. gtag היא לא יותר מדוחפת לתור, והספרייה קוראת
   * את התור כשהיא עולה; ניסוח מחדש של השורה הזאת מסכן אותו.
   */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.gtag("js", new Date());
  const query = new URLSearchParams(window.location.search);
  const campaign: Record<string, string> = {};
  for (const [param, key] of Object.entries({ utm_source: 'campaign_source', utm_medium: 'campaign_medium', utm_campaign: 'campaign_name', utm_id: 'campaign_id', utm_term: 'campaign_term', utm_content: 'campaign_content' })) {
    const value = query.get(param);
    if (value && /^[\p{L}\p{N} _.-]{1,100}$/u.test(value)) campaign[key] = value;
  }
  window.gtag("config", GA_ID, {
    page_location: window.location.origin + window.location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : '',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...campaign,
  });
}

/**
 * כיבוי אחרי שהסקריפט כבר רץ.
 *
 * שתי דרכים יחד, כי הן עושות דברים שונים. ga-disable הוא מתג קשיח:
 * gtag בודקת אותו לפני כל שליחה ולפני כל עוגייה, ולא שולחת. consent
 * update מעדכן את מצב ההסכמה בארבעת הפרמטרים של Consent Mode v2, וזה
 * מה שמסמן לגוגל למה השליחה נפסקה.
 *
 * המתג הוא לכל עמוד בנפרד ולא נשמר בין ביקורים, אבל זה לא חסר: בביקור
 * הבא loadGa לא יטען את הסקריפט בכלל.
 */
export function revokeGa() {
  setDisabled(true);
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function grantGa() {
  setDisabled(false);
  window.gtag?.("consent", "update", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/* המתג של גוגל הוא מפתח דינמי על window, ואין לו מקום בטיפוס Window */
function setDisabled(value: boolean) {
  (window as unknown as Record<string, boolean>)[GA_DISABLE_KEY] = value;
}
