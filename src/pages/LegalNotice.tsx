import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LegalPage, { LegalSection } from '../components/LegalPage';
import { SITE } from '../data/site';
import { academyRequest } from '../lib/academy';
import { useSeo } from '../lib/seo';

const kinds = { cancellation: 'הודעת ביטול עסקה', privacy_access: 'בקשת עיון במידע', privacy_correction: 'בקשת תיקון מידע', privacy_erasure: 'בקשה למחיקת מידע', marketing_withdrawal: 'הסרה מעדכונים שיווקיים' };
type Kind = keyof typeof kinds;
type Receipt = { received: boolean; noticeId: string; receivedAt: string; type: Kind; refundExecuted: false };
export default function LegalNotice() {
  const privacy = useLocation().pathname === '/privacy-requests';
  const [kind, setKind] = useState<Kind>(privacy ? 'privacy_access' : 'cancellation');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState(''); const [identity, setIdentity] = useState(''); const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const request = useRef<{ body: string; key: string } | null>(null); const sending = useRef(false);
  useSeo({ title: `${privacy ? 'פניות פרטיות' : 'ביטול עסקה'} | מכללת גוטמן`, description: 'מסירת הודעה לאקדמיה וקבלת אסמכתה על מועד קבלתה.', path: privacy ? '/privacy-requests' : '/cancel', noindex: true });
  async function submit(event: FormEvent) {
    event.preventDefault(); if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    const body = JSON.stringify({ type: kind, fullName: name, email, phone, orderId, identityNumber: identity, message });
    if (request.current?.body !== body) request.current = { body, key: crypto.randomUUID() };
    try { setReceipt(await academyRequest<Receipt>('/legal-notices', { method: 'POST', body, headers: { 'Idempotency-Key': request.current.key } })); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); sending.current = false; }
  }
  function downloadReceipt() {
    if (!receipt) return;
    const text = `${kinds[receipt.type]}\nמכללת גוטמן\nאסמכתה: ${receipt.noticeId}\nמועד קבלת ההודעה: ${receipt.receivedAt}\nשם: ${name}\nמספר הזמנה: ${orderId || 'לא נמסר'}\nההודעה התקבלה ונשמרה. זהו אישור קבלת הודעה, לא אישור לביצוע החזר כספי.\nפרטי קשר: ${SITE.contact.email} | ${SITE.contact.phone}`;
    const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `gutman-notice-${receipt.noticeId}.txt`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <LegalPage kicker="שירות ופניות" title={privacy ? 'המידע שלכם. הבחירה שלכם.' : 'מסירת הודעת ביטול'} meta="אפשר למסור הודעה גם ללא כניסה לחשבון" intro={privacy ? 'אפשר לפנות בנושא עיון, תיקון, מחיקה או הסרה מעדכונים. נבחן את הפנייה בהתאם לדין ולפרטים הדרושים לאימות.' : 'הטופס מתעד את מועד קבלת ההודעה. אין חובה להשתמש דווקא בטופס הזה, לנמק ביטול או להמתין לאישור כדי למסור הודעה.'}>
    <LegalSection title="מסירת הודעה בדרכים נוספות">
      <p>בדוא״ל: <a href={`mailto:${SITE.contact.email}`} dir="ltr">{SITE.contact.email}</a>. בטלפון: <a href={`tel:${SITE.contact.phone.replace(/\D/g, '')}`} dir="ltr">{SITE.contact.phone}</a>, בהתאם להוראות הדין בדבר הודעה בכתב, ככל שחלה חובה כזו.</p>
      <p>דרכי הביטול ופרטי העסק מפורטים גם ב<Link to="/booking-terms">תנאי ההרשמה והביטול</Link>. היעדר מספר הזמנה או פרטים משלימים אינו מונע תיעוד של פנייה בטופס.</p>
    </LegalSection>
    {receipt ? <div className="academy-legal-receipt" role="status"><h2>ההודעה התקבלה.</h2><p>מועד הקבלה: {new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date(receipt.receivedAt))}</p><p>אסמכתה: <bdi>{receipt.noticeId}</bdi></p><p>ההודעה נשמרה ותטופל בהתאם לתנאים ולדין. אישור זה מתעד את קבלת ההודעה ואינו אישור לביצוע החזר כספי.</p><button type="button" className="academy-button" onClick={downloadReceipt}>שמירת אישור קבלת ההודעה</button></div> : <form data-clarity-mask="true" className="academy-legal-form" onSubmit={submit}>
      {privacy && <><label htmlFor="notice-type">נושא הפנייה</label><select id="notice-type" value={kind} onChange={event => setKind(event.target.value as Kind)} disabled={busy}>{Object.entries(kinds).filter(([id]) => id !== 'cancellation').map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></>}
      <label htmlFor="notice-name">שם מלא</label><input id="notice-name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} disabled={busy} />
      <label htmlFor="notice-email">אימייל לקבלת עדכון, אם תרצו</label><input id="notice-email" type="email" dir="ltr" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
      <label htmlFor="notice-phone">טלפון, אם תרצו</label><input id="notice-phone" type="tel" dir="ltr" autoComplete="tel" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} />
      {!privacy && <><label htmlFor="notice-order">מספר הזמנה, אם ידוע</label><input id="notice-order" dir="ltr" maxLength={100} value={orderId} onChange={e => setOrderId(e.target.value)} disabled={busy} /><details><summary>פרטי זיהוי להודעת ביטול</summary><p>הדין כולל ציון שם ומספר זהות בהודעת ביטול. אפשר למסור מספר כאן; אם לא יימסר, הפנייה עדיין תתועד וייתכן שנבקש להשלים זיהוי בהמשך. אין לצרף צילום תעודה.</p><label htmlFor="notice-identity">מספר זהות</label><input id="notice-identity" dir="ltr" autoComplete="off" maxLength={30} value={identity} onChange={e => setIdentity(e.target.value)} disabled={busy} /></details></>}
      <label htmlFor="notice-message">פרטים נוספים, לא חובה</label><textarea id="notice-message" rows={4} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} disabled={busy} />
      <p className="academy-legal-form-note">אין צורך לנמק ביטול. אל תשלחו פרטי כרטיס אשראי, סיסמאות, מסמכים רפואיים או צילומי תעודות. פרטי הפנייה משמשים לקבלתה, לזיהוי ולטיפול בה ונשמרים באקדמיה. מסירת הפרטים הנוספים היא מרצון; בלעדיהם ייתכן שלא נוכל לחזור אליכם או לזהות את העסקה. אפשר לבקש עיון ותיקון לפי <Link to="/privacy">מדיניות הפרטיות</Link>.</p>
      {error && <p className="academy-checkout-error" role="alert">{error} אפשר למסור הודעה גם ב<a href={`mailto:${SITE.contact.email}`}>אימייל</a>.</p>}
      <button type="submit" className="academy-button" disabled={busy}>{busy ? 'שומרים את ההודעה…' : privacy ? 'שליחת פנייה' : 'מסירת הודעת ביטול'}</button>
    </form>}
  </LegalPage>;
}
