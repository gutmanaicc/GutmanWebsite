import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { academyRequest, formatMoney, formatSeminarDate, hostedCheckoutUrl, type Order } from '../lib/academy';
import { useSeo } from '../lib/seo';
import { SITE } from '../data/site';
import { getSeminar } from '../data/seminars';
import VenueNavigation from '../components/academy/VenueNavigation';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reconcileError, setReconcileError] = useState('');
  const [documentBusy, setDocumentBusy] = useState(false);
  const token = orderId ? sessionStorage.getItem(`academy-order-${orderId}`) : null;
  useSeo({ title: 'מצב ההרשמה | Gutman Academy', description: 'בדיקת מצב ההזמנה על פי אישור שרת.', path: orderId ? `/orders/${orderId}` : '/thank-you' });
  useEffect(() => {
    if (!orderId || !token) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;
    // Load first, then reconcile. Parallel status reads can otherwise return
    // an older pending snapshot after payment has already been confirmed.
    const reconcile = async () => {
      try {
        const value = await academyRequest<Order>(`/orders/${encodeURIComponent(orderId)}/reconcile`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: '{}' });
        if (!active) return;
        setOrder(value); setReconcileError('');
        if (value.status !== 'pending') return;
      } catch {
        if (!active) return;
        setReconcileError('אימות התשלום מתעכב. ההרשמה תאושר לאחר קבלת אישור מחברת הסליקה.');
      }
      if (active && ++tries < 20) timer = setTimeout(reconcile, 5000);
    };
    void academyRequest<Order>(`/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token}` } }).then(value => {
      if (!active) return;
      setOrder(value); setError(''); setReconcileError('');
      if (!value.simulation && value.status === 'pending' && value.checkoutUrl) void reconcile();
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; clearTimeout(timer); };
  }, [orderId, token, attempt]);
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const remaining = Date.parse(order.checkoutExpiresAt || order.holdExpiresAt) - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = setTimeout(() => setAttempt(value => value + 1), Math.max(100, Math.min(remaining + 100, 86_400_000)));
    return () => clearTimeout(timer);
  }, [order?.status, order?.checkoutExpiresAt, order?.holdExpiresAt]);
  const seminar = order?.date ? getSeminar(order.date.seminarId) : undefined;
  const paymentUrl = order && !order.simulation && order.status === 'pending' && Date.parse(order.checkoutExpiresAt || order.holdExpiresAt) > Date.now() ? hostedCheckoutUrl(order.checkoutUrl) : null;
  const simulatePayment = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await academyRequest('/simulation/pay', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId }) });
      setAttempt(value => value + 1);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const downloadDocument = async () => {
    if (!orderId || !token || documentBusy) return;
    setDocumentBusy(true); setError('');
    try {
      const response = await fetch(`/api/academy/orders/${encodeURIComponent(orderId)}/document`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) throw new Error('לא ניתן להוריד את מסמך העסקה כרגע. אפשר לפנות אלינו עם מספר ההזמנה.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'gutman-order.html';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError((err as Error).message); }
    finally { setDocumentBusy(false); }
  };
  return <section className="academy-confirmation" data-clarity-mask="true">
    {!orderId || !token ? <><ShieldCheck size={32} aria-hidden /><h1>נבדוק את מצב ההרשמה</h1><p>הגעה לעמוד הזה אינה אישור תשלום או הרשמה. כדי להציג הזמנה נדרש קישור ההזמנה ואישור הגישה מהטאב שבו נוצרה.</p><p>כבר שילמתם? פנו אלינו עם מספר ההזמנה לבדיקת המצב.</p></> : <>
      {(order?.status === 'paid' || order?.status === 'complimentary') ? <CheckCircle2 size={38} aria-hidden /> : <Clock3 size={38} aria-hidden />}
      <h1>{(order?.status === 'paid' || order?.status === 'complimentary') ? order.simulation ? 'בדיקת ההרשמה הושלמה' : 'ההרשמה אושרה' : 'ההזמנה ממתינה לאישור'}</h1>
      {order?.simulation && <div className="academy-notice"><strong>סימולציה בלבד</strong><p>לא נגבה כסף, לא נשלחה קבלה ולא נוצרה הרשמה לסמינר אמיתי.</p></div>}
      {!order && !error && <p role="status">בודקים את מצב ההזמנה בשרת…</p>}
      {order && <><dl>{order.customer && <><dt>שם</dt><dd>{order.customer.name}</dd></>}{seminar && <><dt>הסמינר</dt><dd>{seminar.title}</dd></>}{order.date && <><dt>מועד</dt><dd>{formatSeminarDate(order.date.date)} · <bdi>{order.date.startTime}-{order.date.endTime}</bdi></dd><dt>מקום</dt><dd>{order.date.venue}</dd></>}<dt>מספר הזמנה</dt><dd><bdi>{orderId}</bdi></dd><dt>סכום ההזמנה</dt><dd>{formatMoney(order.totalAgorot)}</dd><dt>מצב</dt><dd>{order.status === 'complimentary' ? 'הרשמה מאושרת ללא חיוב' : order.status === 'paid' ? 'התשלום אושר בשרת' : order.status === 'pending' || order.status === 'pending_payment' ? 'ממתינה לתשלום' : order.status === 'expired' ? 'ההזמנה פגה' : order.status === 'cancelled' ? 'בוטלה' : order.status === 'failed' ? 'התשלום נכשל' : order.status === 'refund_required' ? 'נדרשת בדיקת החזר, ההרשמה לא אושרה' : order.status === 'refunded' ? 'בוטלה ובוצע החזר בסימולציה' : 'מצב ההזמנה בבדיקה'}</dd></dl>
      {(order.status === 'pending' || order.status === 'pending_payment') && <p>המקום נשמר זמנית בלבד. הרשמה מאושרת רק לאחר אימות תשלום בשרת.</p>}
      {order.date && <VenueNavigation venue={order.date.venue} />}
      {paymentUrl && <a className="academy-button" href={paymentUrl} referrerPolicy="no-referrer">להמשך התשלום המאובטח</a>}
      {order.documentAvailable && <div className="academy-confirmation-prep"><h2>עותק פרטי העסקה שלכם</h2><p>פרטי העסק, הסמינר והעלויות, ותנאי ההרשמה שהוצגו בזמן ההזמנה. אפשר לשמור את הקובץ ולפתוח או להדפיס אותו גם בהמשך.</p><button type="button" className="academy-text-button" onClick={downloadDocument} disabled={documentBusy}>{documentBusy ? 'מכינים את הקובץ…' : 'הורדת מסמך פרטי העסקה'}</button><p>המסמך אינו קבלה או אישור תשלום. <Link to="/cancel">למסירת הודעת ביטול</Link>.</p></div>}
      {!order.simulation && order.checkoutState === 'unknown' && <p role="status">יצירת קישור התשלום עדיין בבדיקה. כדי למנוע תשלום כפול, אל תפתחו הזמנה נוספת; פנו אלינו עם מספר ההזמנה.</p>}
      {!order.simulation && order.checkoutState === 'failed' && <p role="status">לא ניתן להמשיך לתשלום בהזמנה זו. פנו אלינו עם מספר ההזמנה לקבלת עזרה.</p>}
      {order.simulation && (order.status === 'pending' || order.status === 'pending_payment') && <button className="academy-button" onClick={simulatePayment} disabled={busy}>{busy ? 'מאמתים תשלום בדיקה…' : 'הדמיית תשלום מוצלח ללא חיוב'}</button>}
      {(order.status === 'paid' || order.status === 'complimentary') && <div className="academy-confirmation-prep"><h2>לקראת יום העבודה שלכם</h2>{seminar && <ul>{seminar.preparation.map(item => <li key={item}>{item}</li>)}</ul>}<p>בדקו את דרישות ההכנה ואת עלויות המנויים הנפרדות בעמוד הסמינר. לשאלות או לעזרה בהכנה אפשר לפנות אלינו דרך פרטי הקשר כאן.</p>{seminar && <Link className="academy-text-button" to={`/courses/${seminar.slug}#agenda`}>לצפייה בתוכנית ובהנחיות ההכנה</Link>}</div>}
      </>}
      <button className="academy-text-button" onClick={() => setAttempt(value => value + 1)} disabled={busy}>רענון מצב ההזמנה</button>
    </>}
    {error && <p className="academy-checkout-error" role="alert">{error}</p>}
    {reconcileError && <p role="status">{reconcileError}</p>}
    <div className="academy-support"><p>צריכים עזרה? <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a></p><Link className="academy-button" to="/courses">בחזרה לסמינרים</Link></div>
  </section>;
}
