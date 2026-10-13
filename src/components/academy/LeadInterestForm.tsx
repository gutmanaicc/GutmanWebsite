import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { academyRequest, trackAcademy } from '../../lib/academy';
import { SITE } from '../../data/site';

export default function LeadInterestForm({ seminarSlug, requestedDate }: { seminarSlug: string; requestedDate?: string }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const [error, setError] = useState('');
  const lastRequest = useRef<{ body: string; key: string }>();
  const submitting = useRef(false);
  const prefix = `interest-${seminarSlug}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    const body = JSON.stringify({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), seminarId: seminarSlug, requestedDate, note: note.trim(), marketingConsent });
    if (lastRequest.current?.body !== body) lastRequest.current = { body, key: crypto.randomUUID() };
    try {
      const response = await academyRequest<{ ok: boolean; received: boolean }>('/leads', { method: 'POST', headers: { 'Idempotency-Key': lastRequest.current!.key }, body });
      if (!response.ok || !response.received) throw new Error('לא הצלחנו לאשר שהפנייה נקלטה.');
      setReceived(true);
      trackAcademy('lead_received', { seminar_id: seminarSlug });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'הפנייה לא הושלמה. אפשר ליצור קשר באימייל.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="academy-interest-form">
    {received ? <div role="status" className="academy-interest-success"><Check size={24} aria-hidden="true" /><h3>הפנייה שלכם נקלטה.</h3><p>נחזור אליכם עם פרטים על הסמינר. הפנייה אינה הרשמה ואינה שומרת מקום.</p></div> : <>
      <h3>רוצים פרטים לפני שמחליטים?</h3><p>השאירו פרטים ושאלה, ונחזור אליכם.</p>
      <form data-clarity-mask="true" onSubmit={submit}>
        <label htmlFor={`${prefix}-name`}>שם מלא</label><input id={`${prefix}-name`} autoComplete="name" required minLength={2} maxLength={100} value={fullName} onChange={e => setFullName(e.target.value)} disabled={busy} />
        <label htmlFor={`${prefix}-email`}>אימייל</label><input id={`${prefix}-email`} type="email" dir="ltr" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
        <label htmlFor={`${prefix}-phone`}>טלפון</label><input id={`${prefix}-phone`} type="tel" dir="ltr" autoComplete="tel" required pattern="[+0-9 ()-]{8,25}" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} />
        <label htmlFor={`${prefix}-note`}>מה תרצו לדעת? <span>(לא חובה)</span></label><textarea id={`${prefix}-note`} rows={3} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} disabled={busy} />
        <label className="academy-checkbox"><input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} disabled={busy} /><span>אשמח לקבל עדכונים מהמכללה. לא חובה לצורך הפנייה.</span></label>
        <p className="academy-interest-privacy">הפרטים ישמשו למענה לפנייה בהתאם ל<Link reloadDocument to="/privacy">מדיניות הפרטיות</Link>.</p>
        {error && <div role="alert" className="academy-interest-error"><p>{error}</p><a href={`mailto:${SITE.contact.email}`}>אפשר לפנות אלינו באימייל</a></div>}
        <button className="academy-button" type="submit" disabled={busy}>{busy ? 'שולחים את הפנייה…' : 'חזרו אליי עם פרטים'}<ArrowLeft size={18} aria-hidden="true" /></button>
      </form>
    </>}
  </div>;
}
