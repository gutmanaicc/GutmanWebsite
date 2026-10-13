export const CONSENT_KEY = 'cookie-consent-v2';
export const COOKIE_PREFERENCES_EVENT = 'gutman:cookie-preferences';
export const MEASUREMENT_READY_EVENT = 'gutman:measurement-ready';
export function measurementEnvironmentEnabled() {
  if (typeof window === 'undefined') return false;
  const explicit = import.meta.env.VITE_ACADEMY_MEASUREMENT_ORIGIN;
  if (import.meta.env.VITE_ACADEMY_MEASUREMENT_ENABLED === '1' && explicit) {
    try { const url = new URL(explicit); return url.protocol === 'https:' && url.origin === explicit && window.location.origin === explicit; } catch { return false; }
  }
  return import.meta.env.VITE_ACADEMY_PRODUCTION_APPROVED === '1' && /^(www\.)?gutmanai\.com$/.test(window.location.hostname);
}
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
  return measurementEnvironmentEnabled() && hasAnalyticsConsent() && analyticsPathAllowed(window.location.pathname);
}
