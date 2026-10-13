import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { academyRequest, formatMoney, formatSeminarDate, hostedCheckoutUrl, trackAcademy, type Catalog, type Order, type Quote } from '../lib/academy';
import { getSeminar } from '../data/seminars';
import SeminarPrice from '../components/academy/SeminarPrice';
import { CommercialDisclosure, SellerDisclosure } from '../components/academy/CommercialDisclosure';
import { useSeo } from '../lib/seo';

export default function Checkout() {
  const [params] = useSearchParams();
  const dateId = params.get('date') || '';
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const keyRef = useRef(crypto.randomUUID());
  const submittingRef = useRef(false);
  useSeo({ title: 'הרשמה לסמינר | Gutman Academy', description: 'בחירת מועד, פרטי הרשמה ומחיר סופי לסמינר.', path: '/register' });
  useEffect(() => {
    let active = true;
    academyRequest<Catalog>('/catalog').then(value => { if (active) setCatalog(value); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  const date = catalog?.dates.find(item => item.id === dateId);
  const seminar = date ? getSeminar(date.seminarId) : undefined;
  const ready = Boolean(date && catalog?.commerce.ready && date.remainingCapacity > 0 && date.status === 'open_for_registration');
  const total = quote?.totalAgorot ?? (catalog?.pricing.activePrice === 'regular' ? catalog.pricing.regularPriceAgorot : catalog?.pricing.launchPriceAgorot) ?? 119000;
  const applyCoupon = async () => {
    setError(''); setQuoteBusy(true);
    try {
      if (!couponInput.trim()) { setQuote(null); setAppliedCoupon(''); return; }
      const result = await academyRequest<Quote>('/quote', { method: 'POST', body: JSON.stringify({ dateId, couponCode: couponInput.trim(), email }) });
      setQuote(result); setAppliedCoupon(couponInput.trim());
      trackAcademy('apply_coupon', { seminar_id: date?.seminarId || '', discount: result.discountAgorot / 100 });
    } catch (err) { setQuote(null); setAppliedCoupon(''); setError((err as Error).message); }
    finally { setQuoteBusy(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || !ready || quoteBusy) return;
    submittingRef.current = true; setBusy(true); setError('');
    try {
      const order = await academyRequest<Order>('/orders', {
        method: 'POST', headers: { 'Idempotency-Key': keyRef.current },
        body: JSON.stringify({ dateId, customer: { name: name.trim(), email: email.trim(), phone: phone.trim() }, couponCode: appliedCoupon || undefined, termsAccepted, marketingConsent, installments: 1, disclosureVersion: catalog?.legal?.version }),
      });
      const accessToken = order.accessToken || order.orderAccessToken;
      if (!accessToken) throw new Error('לא התקבל אישור גישה להזמנה. ההרשמה לא אושרה.');
      /* הסוד נשמר בטאב בלבד; הוא אינו מופיע בכתובת או במדידה. */
      sessionStorage.setItem(`academy-order-${order.orderId}`, accessToken);
      const paymentUrl = hostedCheckoutUrl(order.checkoutUrl);
      if (!order.simulation && order.status === 'pending' && paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }
      navigate(`/orders/${encodeURIComponent(order.orderId)}`);
    } catch (err) { setError((err as Error).message); }
    finally { submittingRef.current = false; setBusy(false); }
  };
  return <div className="academy-checkout" data-clarity-mask="true">
    <Link to="/courses" className="academy-kicker">← לכל הסמינרים</Link>
    <h1>עוד רגע, מתחילים.</h1>
    <p className="academy-muted">ממלאים פרטים וממשיכים לתשלום מאובטח. פרטי האשראי מוזנים אצל חברת הסליקה.</p>
    {catalog?.commerce.mode === 'simulation' && <div className="academy-notice"><strong>בדיקת הרשמה בסביבת פיתוח</strong><p>הזרימה שלהלן מדמה תשלום לצורכי בדיקה. לא נגבה כסף ולא נוצרת הרשמה לסמינר אמיתי. השתמשו בפרטים פיקטיביים בלבד.</p></div>}
    {error && <div className="academy-checkout-error" role="alert">{error}</div>}
    {!catalog && !error && <p role="status">טוענים את פרטי ההרשמה…</p>}
    {catalog && !date && <div className="academy-notice"><strong>בחרו סמינר ומועד מאושר כדי להמשיך</strong><p>טיוטות ומועדים סגורים אינם זמינים לרכישה.</p><Link className="academy-button" to="/courses">לבחירת הסמינר שלי <ArrowLeft size={18} aria-hidden /></Link></div>}
    {date && seminar && <div className="academy-checkout-grid">
      <form className="academy-checkout-card" onSubmit={submit}>
        <h2>הפרטים שלכם</h2>
        <label htmlFor="checkout-name">שם מלא</label><input id="checkout-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} disabled={busy || !ready} />
        <label htmlFor="checkout-email">אימייל</label><input id="checkout-email" type="email" dir="ltr" autoComplete="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setQuote(null); setAppliedCoupon(''); }} disabled={busy || !ready} />
        <label htmlFor="checkout-phone">טלפון</label><input id="checkout-phone" type="tel" dir="ltr" autoComplete="tel" required pattern="[+0-9 ()-]{8,20}" maxLength={20} value={phone} onChange={event => setPhone(event.target.value)} disabled={busy || !ready} />
        <details><summary>יש לכם קוד קופון?</summary><label htmlFor="checkout-coupon">קוד קופון</label><div className="academy-coupon"><input id="checkout-coupon" dir="ltr" maxLength={40} value={couponInput} onChange={event => setCouponInput(event.target.value)} disabled={busy || !ready} /><button type="button" disabled={!ready || busy || quoteBusy} onClick={applyCoupon}>{quoteBusy ? 'בודקים…' : 'החלת קופון'}</button></div>{appliedCoupon && <p role="status">הקופון הוחל. ההנחה: {formatMoney(quote?.discountAgorot || 0)}.</p>}</details>
        <p className="academy-muted">תשלום אחד. אפשרות לתשלומים נוספים תוצג רק לאחר אישור חברת הסליקה.</p>
        <SellerDisclosure disclosure={catalog?.legal} />
        <CommercialDisclosure seminarSlug={seminar.slug} compact />
        <p className="academy-muted">ביטול עד 48 שעות לפני הסמינר מזכה בהחזר מלא. זכויות הביטול לפי הדין נשמרות גם לאחר מכן. אפשר למסור <Link to="/cancel">הודעת ביטול באתר</Link>.</p>
        <label className="academy-checkbox"><input type="checkbox" required checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} disabled={busy || !ready} /><span>{catalog?.commerce.mode === 'simulation' ? 'הבנתי שזו בדיקה ללא חיוב וללא הרשמה אמיתית.' : <>קראתי ואישרתי את <Link to="/booking-terms" target="_blank" rel="noopener">תנאי ההרשמה והביטול</Link>{catalog?.legal?.siteTermsApproved && <> ואת <Link to="/terms" target="_blank" rel="noopener">תקנון האתר</Link></>}, הוצגו לי פרטי העסק והעלויות הנפרדות של כלי AI, וידוע לי על <Link to="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</Link>. אין באישור ויתור על זכויות לפי הדין.</>}</span></label>
        <label className="academy-checkbox"><input type="checkbox" checked={marketingConsent} onChange={event => setMarketingConsent(event.target.checked)} disabled={busy || !ready} /><span>אשמח לקבל עדכונים מהאקדמיה באימייל. לא חובה לצורך הרשמה.</span></label>
        <button className="academy-button" type="submit" disabled={!ready || busy || quoteBusy || !termsAccepted}>{busy ? 'מכינים את ההזמנה…' : catalog?.commerce.mode === 'simulation' ? 'יצירת הזמנת בדיקה' : 'המשך לתשלום מאובטח'}<ArrowLeft size={18} aria-hidden /></button>
        {!ready && <p className="academy-notice">הרשמה בתשלום אינה זמינה כעת. המועד והסליקה חייבים להיות מאושרים לפני המשך.</p>}
      </form>
      <aside className="academy-checkout-card" aria-label="סיכום הרשמה"><ShieldCheck size={28} aria-hidden /><h2>{seminar.title}</h2><dl><dt>מועד</dt><dd>{formatSeminarDate(date.date)}</dd><dt>שעות</dt><dd><bdi>{date.startTime}-{date.endTime}</bdi> · חמש שעות</dd><dt>מקום</dt><dd>{date.venue}</dd><dt>מנחה</dt><dd>רון גוטמן</dd></dl><SeminarPrice pricing={catalog?.pricing} />{quote?.discountAgorot ? <p>הנחת קופון: {formatMoney(quote.discountAgorot)}</p> : null}<div className="academy-checkout-total"><span>סך הכול</span><strong>{formatMoney(total)}</strong></div><p className="academy-muted">מחיר סופי למשתתף. אין תוספת מע״מ בהגדרת המחיר הנוכחית.</p><p className="academy-muted">פתיחת הסמינר מותנית ב־8 משתתפים בתשלום. הקבוצה מוגבלת ל־12.</p>{!catalog?.commerce.bookingTermsApproved && <p className="academy-muted">תנאי הביטול לפורמט החדש ממתינים לאישור. סליקה אמיתית תיפתח לאחר פרסומם.</p>}</aside>
    </div>}
  </div>;
}
