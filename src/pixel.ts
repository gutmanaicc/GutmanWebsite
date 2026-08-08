// Meta Pixel: נטען רק אחרי הסכמת עוגיות (אותו pixel id כמו בדף הישן)
const PIXEL_ID = "1392343815914070";
export const CONSENT_KEY = "cookie-consent-v1";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function loadPixel() {
  if (window.fbq) return;
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

export function track(event: string, params?: Record<string, string>) {
  window.fbq?.("trackCustom", event, params);
}
