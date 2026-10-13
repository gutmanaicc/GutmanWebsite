export const CONSENT_KEY = 'cookie-consent-v2';
export const COOKIE_PREFERENCES_EVENT = 'gutman:cookie-preferences';
export function cookieChoice(): 'accepted' | 'declined' | null {
  try {
    const record = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return record?.version === 2 && ['accepted', 'declined'].includes(record.choice) ? record.choice : null;
  } catch { return null; }
}
export function hasAnalyticsConsent() { return cookieChoice() === 'accepted'; }
export function hasDeclined() { return cookieChoice() === 'declined'; }
export function analyticsPathAllowed(path: string) {
  return !/^\/(register|orders|thank-you|cancel|privacy-requests|admin|booking-terms|privacy|terms|legal-review)(\/|$)/.test(path);
}
export function canUseAnalytics() {
  return typeof window !== 'undefined' && hasAnalyticsConsent() && analyticsPathAllowed(window.location.pathname);
}
