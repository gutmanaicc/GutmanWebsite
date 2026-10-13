import config from '../../shared/commerce-config.json';
import { canUseAnalytics } from '../consent';
import { trackStandard, track } from '../pixel';

export const ACADEMY_CONFIG = {
  activePrice: config.activePrice,
  launchPriceILS: config.launchPriceAgorot / 100,
  plannedPriceILS: config.regularPriceAgorot / 100,
  currentPriceILS: (config.activePrice === "regular" ? config.regularPriceAgorot : config.launchPriceAgorot) / 100,
  priceLabel: config.activePrice === "regular" ? "מחיר רגיל" : "מחיר השקה",
  durationHours: config.durationHours,
  startTime: config.startTime,
  endTime: config.endTime,
  minimumParticipants: config.minimumParticipants,
  maximumParticipants: config.maximumParticipants,
};
export type SeminarDate = {
  id: string; seminarId: string; date: string; startTime: string; endTime: string;
  timezone: string; venue: string; capacity: number; paidCount: number;
  pendingCount: number; remainingCapacity: number; status: string;
  approvalStatus: string; published: boolean; minimumEnrollmentMet: boolean;
};
export type Catalog = {
  legal?: LegalDisclosure;
  leads?: { ready: boolean };
  dates: SeminarDate[];
  commerce: { mode: 'disabled' | 'simulation' | 'morning'; ready: boolean; bookingTermsApproved?: boolean };
  pricing: { launchPriceAgorot: number; regularPriceAgorot: number; activePrice?: string; currency: string };
};
export type Quote = { subtotalAgorot: number; discountAgorot: number; totalAgorot: number; currency: string };
export type Order = {
  documentAvailable?: boolean;
  orderId: string; status: string; totalAgorot: number; currency: string;
  holdExpiresAt: string; simulation: boolean; checkoutUrl: string | null;
  checkoutState?: 'not_created' | 'not_required' | 'creating' | 'ready' | 'unknown' | 'failed'; checkoutExpiresAt?: string | null;
  accessToken?: string; orderAccessToken?: string; transactionId?: string; date?: SeminarDate; customer?: { name: string; email: string; phone: string }; preparation?: string;
};
export type LegalDisclosure = {
  siteTermsApproved?: boolean; siteTermsVersion?: string;
  version: string; policyVersion: string; policySha256: string; commercialSha256: string; sellerComplete: boolean;
  seller: { businessName: string; registrationNumber: string; postalAddress: string; taxStatus: string; email: string; phone: string } | null;
};
export function hostedCheckoutUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export async function academyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/academy${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('מערכת ההרשמה אינה זמינה כרגע. אפשר לנסות שוב בהמשך.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'הפעולה לא הושלמה. נסו שוב.');
  return result as T;
}
export const formatMoney = (agorot: number) => new Intl.NumberFormat('he-IL', {
  style: 'currency', currency: 'ILS', maximumFractionDigits: 2,
}).format(agorot / 100);
export const formatSeminarDate = (date: string) => new Intl.DateTimeFormat('he-IL', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem',
}).format(new Date(`${date}T12:00:00+03:00`));

/* רק מזהי תוכן מגיעים למדידה; כתובות אימייל וקודי קופון נשארים בשרת. */
export function trackAcademy(event: string, values: Record<string, string | number> = {}) {
  if (!canUseAnalytics()) return;
  const allowed = ['seminar_id', 'date_id', 'placement', 'discount', 'value'];
  const clean = Object.fromEntries(Object.entries(values).filter(([key, value]) => allowed.includes(key) && (typeof value === 'number' ? Number.isFinite(value) : /^[a-zA-Z0-9_-]{1,100}$/.test(value))));
  const seminar = typeof clean.seminar_id === 'string' && ['social-media-ai','ai-video-content','ai-business-owners'].includes(clean.seminar_id) ? clean.seminar_id : undefined;
  const ecommerce = seminar ? { currency: 'ILS', items: [{ item_id: seminar, item_category: 'seminar', quantity: 1 }], ...(typeof clean.value === 'number' ? { value: clean.value } : {}) } : {};
  const name = event === 'seminar_view' ? 'view_item' : event === 'lead_received' ? 'generate_lead' : event;
  if (!['seminar_view','lead_received','begin_checkout','homepage_cta_click','select_seminar_date','apply_coupon'].includes(event)) return;
  window.gtag?.('event', name, { ...clean, ...ecommerce });
  const meta = seminar ? { content_ids: [seminar], content_type: 'product', currency: 'ILS', ...(typeof clean.value === 'number' ? { value: clean.value } : {}) } : clean;
  if (event === 'seminar_view') trackStandard('ViewContent', meta);
  else if (event === 'lead_received') trackStandard('Lead', meta);
  else if (event === 'begin_checkout') trackStandard('InitiateCheckout', meta);
  else track(event, clean);
}
