import { seminarNames } from './seminar-names.mjs';
import commercial from '../shared/commercial-disclosures.json' with { type: 'json' };
import venueDetails from '../shared/academy-venue.json' with { type: 'json' };
import { renderOrderDocument } from './legal-documents.mjs';
export { seminarNames } from './seminar-names.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const preparation = {
  'social-media-ai': ['בריף קצר של לקוח או מותג שאתם מנהלים, עם קהל היעד והשפה שלו.', 'שתיים או שלוש דוגמאות תוכן ומסמכי ידע שאפשר לשתף בבטחה.', 'גישה לחשבון AI אישי. הרחבה לכלי תוכן בתשלום היא לבחירתכם.'],
  'ai-video-content': ['אוזניות וגישה לחשבונות ChatGPT ו־Higgsfield.', 'רעיון קצר לסרטון או בריף, וחומרי מקור שיש לכם הרשאה להשתמש בהם.', 'בדקו מראש שהמנויים והקרדיטים שלכם פעילים ושאפשר להתחבר לכלים.'],
  'ai-business-owners': ['תיאור קצר של העסק, השירותים והלקוחות שלכם.', 'משימה שחוזרת על עצמה ושאלות שתרצו להתייעץ עליהן עם הסוכן.', 'טלפון עם WhatsApp פעיל וגישה לחשבונות העבודה שלכם.'],
};
const outcomes = {
  'social-media-ai': 'נבנה עובד AI ללקוח שלכם וניישם אותו על תכנון התוכן והעבודה השוטפת.',
  'ai-video-content': 'נעבוד על רעיון משלכם ונחבר כלי תמונה, וידאו ועריכה לתהליך יצירה מעשי.',
  'ai-business-owners': 'נעבוד על סוכן AI שמכיר את ההקשר של העסק שלכם ועוזר במשימות ובהתייעצות בוואטסאפ.',
};
const dateLabel = date => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date(`${date.date}T12:00:00Z`));
function emailHtml({ name, title, intro, label, date, items, costs, navigation, origin, orderId }) {
  const row = (label, value) => `<tr><td style="padding:9px 0;color:#6d6270;width:85px;vertical-align:top">${escape(label)}</td><td style="padding:9px 0;font-weight:600">${escape(value)}</td></tr>`;
  const links = `<a href="mailto:gutmanaicc@gmail.com" style="color:#8e285d">gutmanaicc@gmail.com</a> · <a href="tel:0508185107" style="color:#8e285d">050-8185107</a>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;background:#f3eee9;color:#211b25;font-family:Arial,sans-serif;line-height:1.7" dir="rtl"><div style="display:none;max-height:0;overflow:hidden">${escape(label)} · ${escape(dateLabel(date))} · ${escape(date.startTime)}-${escape(date.endTime)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:26px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffcf8;border-radius:22px;overflow:hidden"><tr><td style="padding:24px 30px;background:#211426;color:#f7eaf1"><p style="margin:0;color:#f594c5;font-size:14px;letter-spacing:1px">GUTMAN ACADEMY</p><h1 style="font-size:30px;line-height:1.35;margin:10px 0 0">${escape(title)}</h1></td></tr><tr><td style="padding:26px 28px"><p style="margin-top:0">שלום ${escape(name)},</p><p>${escape(intro)}</p><h2 style="font-size:21px;margin:26px 0 8px">${escape(label)}</h2><table width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;border-top:1px solid #e4d7df;border-bottom:1px solid #e4d7df">${row('מועד', dateLabel(date))}${row('שעות', `${date.startTime}-${date.endTime} · חמש שעות`)}${row('מקום', date.venue)}${row('מנחה', 'רון גוטמן')}</table>${navigation ? `<p style="margin:22px 0"><a href="${escape(navigation)}" style="display:inline-block;background:#f64398;color:#201320;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:bold;text-decoration:none">ניווט לטרמינל ב־Waze</a></p>` : ''}<h2 style="font-size:20px;margin:28px 0 10px">מה להכין לפני שנפגשים?</h2><ul style="padding-right:20px">${items.map(item => `<li style="margin:8px 0">${escape(item)}</li>`).join('')}</ul>${costs ? `<div style="background:#f1e6ed;border-radius:12px;padding:16px 18px;margin:22px 0"><strong style="color:#7e2756">עלויות כלי AI בנפרד</strong><p style="font-size:14px;margin:7px 0 0">${escape(costs)}</p></div>` : ''}<p style="font-size:14px;color:#675b69">בחרו חומרי מקור שאפשר לשתף בהרשאה. אין צורך להביא מידע רגיש או פרטים אישיים של לקוחות.</p><p style="font-size:14px">הקבוצה היא של 8-12 משתתפים. קיום הסמינר מותנה בלפחות 8 משתתפים בתשלום. במקרה של שינוי נעדכן בהתאם לתנאי ההרשמה.</p><p>נתראה,<br><strong>רון גוטמן</strong><br>מכללת גוטמן</p><p style="font-size:14px">לשאלות ולהכנה: ${links}</p></td></tr><tr><td style="padding:20px 28px;background:#ece3e9;color:#665b67;font-size:12px"><p style="margin:0">מספר הזמנה: ${escape(orderId)}. זו הודעת שירות בקשר להרשמה שלכם, והיא אינה קבלה.</p><p style="margin:8px 0 0"><a href="${escape(origin)}/cancel" style="color:#7e2756">מסירת הודעת ביטול</a> · <a href="${escape(origin)}/privacy" style="color:#7e2756">מדיניות פרטיות</a></p></td></tr></table></td></tr></table></body></html>`;
}
/** Frozen service copy for the actual order. No advertising or sends here. */
export function buildMessage(kind, order, date, { publicOrigin = 'https://gutmanai.com' } = {}) {
  const origin = new URL(publicOrigin); if (origin.protocol !== 'https:' || origin.origin !== publicOrigin) throw Error('A canonical HTTPS email origin is required.');
  const label = seminarNames[date.seminarId] ?? date.seminarId;
  const detail = `${label} | ${date.date} | ${date.startTime}-${date.endTime} | ${date.venue}`;
  const navigation = date.venue === venueDetails.venue ? venueDetails.wazeUrl : null;
  const items = ['מחשב נייד וטעון, מטען ויכולת להתחבר לחשבונות שלכם.', ...(preparation[date.seminarId] ?? [])];
  const costs = order.legalSnapshot?.commercial?.text ?? commercial.seminars[date.seminarId]?.text ?? '';
  const serviceCosts = costs ? `${costs} המנויים והקרדיטים משולמים בנפרד לספקים ואינם כלולים במחיר הסמינר.` : '';
  const templates = {
    confirmation: ['אישור הרשמה | מכללת גוטמן', order.simulation ? `שלום ${order.customer.name}, ההרשמה אומתה בסביבת ההדגמה. ${detail}. אסמכתא: ${order.id}. זהו אישור הדגמה ואינו קבלה או רכישה אמיתית.` : `שלום ${order.customer.name}, התשלום אומת והרשמתכם התקבלה. ${detail}. מספר הזמנה: ${order.id}. פתיחת הסמינר מותנית במינימום המשתתפים בהתאם לתנאי ההרשמה. אישור זה אינו קבלה.`],
    preparation: [`מכינים אתכם לסמינר | ${label}`, `נפגשים לחמש שעות של עבודה מעשית. ${outcomes[date.seminarId] ?? ''}`],
    reminder: [`לקראת המפגש שלנו | ${label}`, 'לקראת המפגש שלנו, הנה פרטי היום ומה שכדאי להכין. נתרגל על העבודה שלכם ונבנה משהו שתוכלו להמשיך לעבוד איתו.'],
    followup: ['ממשיכים לתרגל', `שלום ${order.customer.name}, תודה על ההשתתפות ב${label}. בחרו משימה אחת לתרגול, המשיכו לעבוד עם התוצר שבניתם ובדקו את התוצאה לפני שימוש או פרסום.`],
    cancellation: ['עדכון על ההרשמה', `שלום ${order.customer.name}, ההרשמה ל${detail} בוטלה בסביבת ההדגמה. אם נדרש החזר אמיתי, יש לבדוק מול ספק התשלום; אין כאן אישור לביצוע החזר כספי אמיתי.`],
  };
  if (!templates[kind]) throw Error('Unknown service message kind.');
  const [subject, intro] = templates[kind];
  const service = ['preparation', 'reminder'].includes(kind);
  const text = service ? [`שלום ${order.customer.name},`, intro, '', label, dateLabel(date), `${date.startTime}-${date.endTime} | חמש שעות`, date.venue, 'בהנחיית רון גוטמן', navigation ? `ניווט ב־Waze: ${navigation}` : '', '', 'מה להכין?', ...items.map(item => `• ${item}`), '', serviceCosts, 'אין צורך להביא מידע רגיש או פרטים אישיים של לקוחות.', 'הקבוצה היא של 8-12 משתתפים. קיום הסמינר מותנה בלפחות 8 משתתפים בתשלום; במקרה של שינוי נעדכן בהתאם לתנאי ההרשמה.', '', 'נתראה,', 'רון גוטמן | מכללת גוטמן', 'לשאלות: gutmanaicc@gmail.com | 050-8185107', `מסירת הודעת ביטול: ${publicOrigin}/cancel`, `מספר הזמנה: ${order.id}. הודעת שירות זו אינה קבלה.`].filter(line => line !== null).join('\n') : intro;
  const documentAttached = kind === 'preparation' && order.legalSnapshot?.sellerComplete;
  const result = { to: order.customer.email, subject, text: text + (documentAttached ? '\nמצורף עותק פרטי העסקה והתנאים כפי שנמסרו בזמן ההזמנה.' : ''), orderId: order.id, dateId: date.id, simulation: Boolean(order.simulation) };
  if (service) result.html = emailHtml({ name: order.customer.name, title: kind === 'preparation' ? 'מגיעים מוכנים. בונים בעצמכם.' : 'לקראת יום העבודה שלכם.', intro, label, date, items, costs: serviceCosts, navigation, origin: publicOrigin, orderId: order.id });
  if (kind === 'preparation' && order.legalSnapshot?.sellerComplete) result.attachments = [{ filename: 'gutman-order.html', contentType: 'text/html; charset=utf-8', content: renderOrderDocument(order.legalSnapshot, { origin: publicOrigin }) }];
  return result;
}
