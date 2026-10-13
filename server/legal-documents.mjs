import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { seminarNames } from './message-templates.mjs';
import policy from '../shared/approved-booking-policy.json' with { type: 'json' };
import commercial from '../shared/commercial-disclosures.json' with { type: 'json' };
import privacy from '../shared/privacy-notice.json' with { type: 'json' };
import siteTerms from '../shared/site-terms-draft.json' with { type: 'json' };

const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\x00-\x1f]/.test(value);
export function loadMerchantDisclosure(path, verifiedMerchant) {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || (stat.mode & 0o777) !== 0o600 || stat.size > 8192) return null;
    const p = JSON.parse(readFileSync(path, 'utf8'));
    if (!verifiedMerchant?.verified || p.ownerConfirmed !== true || p.registrationNumber !== verifiedMerchant.businessTaxId || p.taxStatus !== 'exempt' || !validText(p.businessName, 100) || !validText(p.postalAddress, 250)) return null;
    return { businessName: p.businessName, registrationNumber: p.registrationNumber, postalAddress: p.postalAddress, taxStatus: 'exempt', email: 'gutmanaicc@gmail.com', phone: '050-8185107' };
  } catch { return null; }
}
export function publicLegalDisclosure(seller, { siteTermsApproved = false } = {}) {
  const version = 'gutman-disclosure-' + digest({ policy, commercial, privacy, seller, siteTerms: siteTermsApproved ? siteTerms : null }).slice(0, 20);
  return { version, policyVersion: policy.version, policySha256: digest(policy), commercialSha256: digest(commercial), privacyVersion: privacy.version, privacySha256: digest(privacy), siteTermsApproved, siteTermsVersion: siteTerms.version, seller: seller ?? null, sellerComplete: !!seller, commercial };
}
/** One immutable, server-derived offer/consent copy; never retrofit old orders. */
export function buildOrderLegalSnapshot(order, date, seller, acceptedAt, { siteTermsApproved = false } = {}) {
  return { version: 1, disclosureVersion: publicLegalDisclosure(seller, { siteTermsApproved }).version, policy: structuredClone(policy), policySha256: digest(policy), privacy: structuredClone(privacy), privacySha256: digest(privacy), siteTerms: siteTermsApproved ? structuredClone(siteTerms) : null, commercialVersion: commercial.version, commercialSha256: digest(commercial), commercial: { ...commercial.seminars[date.seminarId], common: commercial.common }, seller: seller ? structuredClone(seller) : null, sellerComplete: !!seller, acceptedAt, offerExpiresAt: order.holdExpiresAt, customer: structuredClone(order.customer), orderId: order.id, seminar: { title: seminarNames[date.seminarId], date: date.date, startTime: date.startTime, endTime: date.endTime, timezone: date.timezone, venue: date.venue, minimumParticipants: date.minimumParticipants, capacity: date.capacity, durationHours: 5 }, price: { totalAgorot: order.totalAgorot, discountAgorot: order.discountAgorot, currency: order.currency, installments: 1 }, marketing: { email: order.marketingConsent === true, sms: false, whatsapp: false } };
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Statutory transaction summary carried into Morning's accounting document.
 * Uses the original order snapshot, never today's mutable offer or profile.
 */
export function accountingDocumentRemarks(snapshot, origin) {
  const s = snapshot.seller, d = snapshot.seminar;
  const url = new URL(origin);
  if (!s || url.protocol !== 'https:' || url.origin !== origin) throw Error('Complete original seller disclosure and canonical origin are required.');
  const result = [
    `${s.businessName}, עוסק פטור, מספר עוסק ${s.registrationNumber}. כתובת העסק: ${s.postalAddress}.`,
    `${d.title}, סמינר פרונטלי מעשי, ${d.date}, ${d.startTime}-${d.endTime}, ${d.venue}. 5 שעות בהנחיית רון גוטמן, 8-12 משתתפים.`,
    `מחיר סופי: ${(snapshot.price.totalAgorot / 100).toFixed(2)} ILS, תשלום אחד, ללא תוספת מע״מ. מנויי כלים אינם כלולים. ${snapshot.commercial.text}`,
    'ביטול עד 48 שעות לפני הסמינר: החזר מלא ללא דמי ביטול. זכויות ביטול והחזר לפי הדין נשמרות, לרבות זכויות מיוחדות. אין מדובר בהגבלה של זכות לפי הדין למניין ימים שאינם ימי מנוחה.',
    'אם המכללה מבטלת, כולל פחות מ־8 משתתפים בתשלום: החזר מלא. אפשר לבחור מועד חלופי בהסכמה; אין חובה לעשות זאת לקבלת החזר.',
    `הודעת ביטול: ${s.email}, בטלפון ${s.phone} בהתאם לדין, בדואר רשום לכתובת העסק, ובאתר ${origin}/cancel . יש לציין שם ומספר זהות; מספר הזמנה מסייע. אין חובה לנמק או להשתמש רק בטופס.`,
    `תנאים שנמסרו: ${snapshot.policy.version}. פרטי העסקה והתנאים זמינים לשמירה בטאב ההזמנה המקורי באתר. פנייה לקבלת עותק נוסף: ${s.email}.`
  ].join('\n');
  if (result.length > 2000) throw Error('Accounting disclosure exceeds the verified provider field limit.');
  return result;
}
export function renderOrderDocument(snapshot, { origin } = {}) {
  const s = snapshot.seller, seminar = snapshot.seminar;
  const line = (label, value) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`;
  const amount = new Intl.NumberFormat('he-IL', { style: 'currency', currency: snapshot.price.currency }).format(snapshot.price.totalAgorot / 100);
  const sections = document => document.sections.map(section => `<h3>${escape(section.title)}</h3>${section.paragraphs.map(p => '<p>' + escape(p) + '</p>').join('')}`).join('');
  const links = new URL(origin); if (links.protocol !== 'https:' || links.origin !== origin) throw Error('An exact website HTTPS origin is required.');
  return `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>מסמך פרטי העסקה | מכללת גוטמן</title><style>body{font:16px/1.8 sans-serif;max-width:850px;margin:32px auto;padding:0 24px;color:#151515}h1,h2{line-height:1.3}dl{display:grid;grid-template-columns:minmax(110px,1fr) 3fr;gap:8px}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}a{overflow-wrap:anywhere}@media(max-width:500px){dl{display:block}dd{margin-bottom:14px}}@media print{body{margin:0}}</style><body><h1>מסמך פרטי העסקה</h1><p>עותק פרטי ההזמנה והמידע שהוצג בעת יצירתה. מסמך זה אינו קבלה או הוכחה לביצוע תשלום.</p><dl>${line('מספר הזמנה', snapshot.orderId)}${line('שם', snapshot.customer.name)}${line('מועד אישור התנאים', snapshot.acceptedAt)}${line('שמירת המקום עד', snapshot.offerExpiresAt)}${line('סמינר', seminar.title)}${line('מועד', seminar.date)}${line('שעות', seminar.startTime + '-' + seminar.endTime)}${line('מקום', seminar.venue)}${line('משך וקבוצה', '5 שעות, מינימום 8 משתתפים בתשלום ועד 12')}${line('מחיר הסמינר', amount)}${line('תשלום', 'תשלום אחד, דרך Morning')}${line('מנחה', 'רון גוטמן')}</dl><h2>פרטי העסק</h2>${s ? `<dl>${line('שם משפטי', s.businessName)}${line('מספר עוסק', s.registrationNumber)}${line('כתובת למסירת הודעות', s.postalAddress)}${line('דוא״ל', s.email)}${line('טלפון', s.phone)}${line('מעמד מס במועד ההזמנה', 'עוסק פטור')}</dl>` : '<p>הפרטים המשפטיים המלאים לא היו זמינים בעת יצירת עותק זה; אין לראות בו מסמך גילוי מלא.</p>'}<h2>מה כלול ועלויות כלי AI</h2><p>המחיר מתייחס להשתתפות בסמינר המעשי המפורט לעיל. תוצאות התרגול תלויות גם בהשתתפות, בחומרי המקור ובכלים; אין הבטחה להכנסה, מספר צפיות או תוצאה מסחרית.</p><h3>${escape(snapshot.commercial.title)}</h3><p>${escape(snapshot.commercial.text)}</p><p>${escape(snapshot.commercial.common)}</p><h2>${escape(snapshot.policy.title)}</h2>${snapshot.policy.paragraphs.map(p => '<p>' + escape(p) + '</p>').join('')}${snapshot.siteTerms ? '<h2>תקנון האתר</h2>' + sections(snapshot.siteTerms) : ''}<h2>מסירת הודעת ביטול</h2><p>אפשר למסור הודעה באימייל, בדואר רשום לכתובת העסק ובטלפון בהתאם לדין. אפשר למסור הודעה גם ללא כניסה לחשבון באמצעות <a href="${escape(origin)}/cancel">טופס הביטול באתר</a>. הדין כולל ציון שם ומספר זהות בהודעת ביטול; מספר הזמנה מסייע לזיהוי. הטופס אינו דרך הביטול היחידה, ואין חובה לנמק ביטול או להמתין לאישור כדי לתעד הודעה.</p><h2>מדיניות פרטיות שנמסרה בעת ההזמנה</h2>${sections(snapshot.privacy)}<h2>הסכמות ותיעוד</h2><p>אישור לעדכונים באימייל: ${snapshot.marketing.email ? 'כן' : 'לא'}. לא ניתנה כאן הסכמה לשיווק בהודעות SMS או WhatsApp.</p><p>גרסת תנאים: ${escape(snapshot.policy.version)}. גרסת גילוי עלויות: ${escape(snapshot.commercialVersion)}.</p><p>מסמך המקור נשמר כפי שהיה בעת יצירת ההזמנה. עדכון עתידי באתר אינו משנה את העותק הזה או את הזכויות בעסקה שכבר נוצרה.</p></body></html>`;
}
