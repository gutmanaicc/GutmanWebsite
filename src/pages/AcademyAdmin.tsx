import { useEffect, useRef, useState, type FormEvent } from "react";
import "../styles/academy-admin.css";

const SEMINARS = [
  { id: "social-media-ai", title: "AI למנהלי ומנהלות סושיאל" },
  { id: "ai-video-content", title: "יצירת וידאו ותוכן באמצעות AI" },
  { id: "ai-business-owners", title: "AI לבעלי עסקים" },
];
const STATUSES: Record<string, string> = {
  draft: "טיוטה", awaiting_approval: "ממתין לאישור", scheduled: "מתוכנן",
  open_for_registration: "הרשמה פתוחה", fully_booked: "מלא", registration_closed: "הרשמה סגורה",
  cancelled: "בוטל", completed: "הסתיים",
};
const APPROVALS: Record<string, string> = { pending: "ממתין לאישור", approved: "מאושר", rejected: "נדחה" };
type DateEntry = {
  id: string; seminarId: string; date: string; venue: string; capacity: number;
  status: string; approvalStatus: string; published: boolean; paidCount: number; complimentaryCount?: number;
  pendingCount: number; remainingCapacity: number; minimumEnrollmentMet: boolean; minimumEnrollmentReviewAt?: string; requiresMinimumEnrollmentDecision?: boolean;
};
type Coupon = {
  id: string; code: string; type: "percentage" | "fixed"; value: number;
  seminarIds: string[]; dateIds: string[]; startsAt: string | null; expiresAt: string | null;
  maxRedemptions: number; perCustomerLimit: number | null; active: boolean; notes: string;
  totalRedemptions: number;
};
type Registration = {
  id: string; orderId: string; dateId: string; seminarId: string;
  customer: { name: string; email: string; phone: string }; status: string;
  totalAgorot: number; couponCode: string | null; transactionId: string; createdAt: string;
};
type Revenue = {
  grossAgorot: number; refundedAgorot: number; netAgorot: number;
  bySeminar: Array<{ seminarId: string; totalAgorot: number; paidCount: number }>;
  byDate: Array<{ dateId: string; totalAgorot: number; paidCount: number }>;
};
type Outbox = {
  id: string; kind: string; orderId: string; status: string; attempts: number;
  nextAttemptAt: string | null; payload: { to?: string; subject?: string; text?: string };
  lastError?: string; createdAt: string;
};
type Summary = {
  dates: DateEntry[]; coupons: Coupon[]; registrations: Registration[];
  revenue: Revenue; outbox: Outbox[]; commerce: { mode: string; ready: boolean };
};
type LegalNotice = { id: string; type: string; fullName: string; email: string; phone: string; orderId: string; receivedAt: string; status: string; message: string; identityProvided: boolean };
const noticeLabels: Record<string, string> = { cancellation: 'ביטול עסקה', privacy_access: 'עיון במידע', privacy_correction: 'תיקון מידע', privacy_erasure: 'בקשת מחיקה', marketing_withdrawal: 'הסרה משיווק' };
type DateDraft = Pick<DateEntry, "seminarId" | "date" | "venue" | "capacity" | "status" | "published">;
type CouponDraft = Omit<Coupon, "id" | "totalRedemptions">;
const money = (amount: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(amount / 100);
const seminarTitle = (id: string) => SEMINARS.find(s => s.id === id)?.title ?? id;
const dateLabel = (date: string) => new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeZone: "Asia/Jerusalem" }).format(new Date(`${date}T12:00:00+02:00`));
const timestamp = (value: string | null) => value ? new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(value)) : ",";
const emptyDate = (): DateDraft => ({ seminarId: SEMINARS[0].id, date: "", venue: "הטרמינל לעיצוב, אהוד קינמון 32, בת ים", capacity: 12, status: "draft", published: false });
const emptyCoupon = (): CouponDraft => ({ code: "", type: "percentage", value: 10, seminarIds: [], dateIds: [], startsAt: null, expiresAt: null, maxRedemptions: 1, perCustomerLimit: 1, active: false, notes: "" });

export default function AcademyAdmin() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");
  const activeToken = useRef("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("dates");
  const [dateDraft, setDateDraft] = useState<DateDraft>(emptyDate);
  const [dateId, setDateId] = useState<string | null>(null);
  const [couponDraft, setCouponDraft] = useState<CouponDraft>(emptyCoupon);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);

  useEffect(() => {
    document.title = "ניהול סמינרים | Gutman Academy";
    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = meta?.content;
    const robots = meta ?? document.createElement("meta");
    robots.name = "robots"; robots.content = "noindex, nofollow";
    if (!meta) document.head.append(robots);
    return () => { if (meta) meta.content = previous ?? ""; else robots.remove(); };
  }, []);

  async function request<T>(path: string, authToken: string, body?: unknown, method = "POST"): Promise<T> {
    const response = await fetch(`/api/academy/admin${path}`, {
      method: body === undefined ? "GET" : method,
      headers: { Authorization: `Bearer ${authToken}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "אסימון הניהול אינו תקף או חסר הרשאה." : result?.error?.message ?? (typeof result?.error === "string" ? result.error : "הפעולה לא הושלמה. נסו שוב בעוד רגע."));
    if (!result) throw new Error("השרת החזיר תשובה לא תקינה.");
    return result as T;
  }

  async function load(authToken: string) {
    const [result, delivery, notices] = await Promise.all([request<Summary>("/summary", authToken), request<{ ready: boolean }>("/delivery-readiness", authToken), request<{notices:LegalNotice[]}>("/legal-notices",authToken)]);
    if (activeToken.current === authToken) { setSummary(result); setDeliveryReady(delivery.ready === true); setLegalNotices(notices.notices); }
  }

  async function login(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    const entered = tokenInput.trim(); activeToken.current = entered;
    try { await load(entered); if (activeToken.current === entered) { setToken(entered); setTokenInput(""); } }
    catch (cause) { setError(cause instanceof Error ? cause.message : "לא ניתן להתחבר."); activeToken.current = ""; }
    finally { setBusy(false); }
  }

  async function mutate(path: string, body: unknown, method = "POST", success = "השינוי נשמר.") {
    setBusy(true); setError(""); setMessage("");
    try { await request(path, token, body, method); await load(token); setMessage(success); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "הפעולה נכשלה."); return false; }
    finally { setBusy(false); }
  }

  async function drainMessages() {
    setBusy(true); setError(""); setMessage("");
    try {
      const report = await request<{ sent: number; failed: number; reviewRequired: number }>("/outbox/drain", token, { limit: 20 });
      await load(token);
      setMessage(`ספק הדיוור קיבל ${report.sent} הודעות. ${report.failed} נכשלו; ${report.reviewRequired} דורשות בדיקה. אישור ספק אינו אישור מסירה לנמען.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "לא ניתן לשלוח כעת."); }
    finally { setBusy(false); }
  }

  async function refresh() { setBusy(true); setError(""); try { await load(token); } catch (cause) { setError(cause instanceof Error ? cause.message : "הרענון נכשל."); } finally { setBusy(false); } }
  function logout() { activeToken.current = ""; setToken(""); setTokenInput(""); setSummary(null); setDeliveryReady(false); setLegalNotices([]); setChecks({}); setError(""); setMessage(""); setDateDraft(emptyDate()); setDateId(null); setCouponDraft(emptyCoupon()); setCouponId(null); }
  function editDate(entry: DateEntry) { setDateId(entry.id); setDateDraft({ seminarId: entry.seminarId, date: entry.date, venue: entry.venue, capacity: entry.capacity, status: entry.status, published: entry.published }); setChecks({}); requestAnimationFrame(() => document.getElementById("academy-date-editor")?.focus()); }
  function editCoupon(entry: Coupon) { setCouponId(entry.id); const { id: _id, totalRedemptions: _redemptions, ...draft } = entry; setCouponDraft(draft); requestAnimationFrame(() => document.getElementById("academy-coupon-editor")?.focus()); }
  const dateName = (id: string) => { const entry = summary?.dates.find(d => d.id === id); return entry ? `${dateLabel(entry.date)} · ${seminarTitle(entry.seminarId)}` : id; };

  return <section className="academy-admin" dir="rtl" aria-label="ניהול סמינרים">
    <header className="academy-admin-header"><p className="academy-admin-kicker">GUTMAN ACADEMY / ניהול האקדמיה</p><h1>ניהול סמינרים</h1><p>הנתונים מגיעים מהשרת. מצב הבדיקה מסומן בנפרד; הודעות בתור אינן אישור שנשלחו.</p></header>
    <p className="academy-admin-notice">מועדים מוצעים דורשים בדיקת מקום, חגים והתחייבויות קיימות לפני אישור. פתיחת הרשמה כאן אינה אישור לפרסום אתר הייצור.</p>
    {error && <p role="alert" className="academy-admin-error">{error}</p>}
    {message && <p role="status" className="academy-admin-success">{message}</p>}
    {!token ? <section className="academy-admin-panel"><h2>כניסה מורשית</h2><p>הזינו את אסימון ACADEMY_ADMIN_TOKEN שהוגדר בשרת המקומי. הוא נשמר בזיכרון העמוד בלבד ונמחק ברענון או ביציאה.</p><form onSubmit={login} className="academy-admin-form"><label>אסימון ניהול<input type="password" required autoComplete="off" value={tokenInput} onChange={e => setTokenInput(e.target.value)} dir="ltr" /></label><button disabled={busy}>{busy ? "מתחברים…" : "כניסה"}</button></form></section> : <>
      <div className="academy-admin-toolbar"><p>מצב תשלום: <strong>{summary?.commerce.mode ?? "לא ידוע"}</strong> · {summary?.commerce.ready ? "מנוע הסביבה זמין" : "אינו זמין"} · אזור זמן: Asia/Jerusalem</p><button onClick={refresh} disabled={busy}>רענון נתונים</button><button onClick={logout} className="secondary" disabled={busy}>יציאה</button></div>
      <nav className="academy-admin-tabs" aria-label="מדורי ניהול">{[["dates", "מועדים"], ["coupons", "קופונים"], ["registrations", "הרשמות"], ["revenue", "הכנסות"], ["outbox", "תור הודעות"], ["legal", "ביטולים ופרטיות"]].map(([id, label]) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}>{label}</button>)}</nav>
      {summary && tab === "legal" && <section className="academy-admin-panel"><h2>הודעות ביטול ופניות פרטיות</h2><p>מועד המסירה נשמר בעת קבלת ההודעה, גם כשצריך להשלים זיהוי. סימון פנייה כטופלה אינו מבצע החזר ואינו מתעד החזר אצל Morning. יש לבדוק זכאות, לבצע החזר כשנדרש ולשמור אסמכתה. מספרי זהות אינם מוצגים כאן.</p>{legalNotices.length===0 ? <p>אין פניות.</p> : legalNotices.map(n=><article className="academy-admin-notice-item" key={n.id}><h3>{noticeLabels[n.type] || n.type} · {n.fullName}</h3><p>{timestamp(n.receivedAt)} · אסמכתה <bdi>{n.id}</bdi></p><p><bdi>{n.email}</bdi> · <bdi>{n.phone}</bdi> · מספר הזמנה <bdi>{n.orderId || 'לא נמסר'}</bdi></p>{n.message && <p style={{whiteSpace:'pre-wrap'}}>{n.message}</p>}<p>פרטי זיהוי: {n.identityProvided ? 'נמסרו ונשמרו בתיבה המוגנת' : 'לא נמסרו'} · מצב: {n.status==='closed'?'טופלה':n.status==='processing'?'בטיפול':'התקבלה'}</p><button disabled={busy} className="secondary" onClick={()=>mutate(`/legal-notices/${n.id}`,{status:'processing'},'PATCH','הפנייה סומנה בטיפול. לא בוצע החזר כספי.')}>סימון בטיפול</button> <button disabled={busy} className="secondary" onClick={()=>mutate(`/legal-notices/${n.id}`,{status:'closed'},'PATCH','הפנייה סומנה כטופלה. סימון זה אינו אישור החזר.')}>סימון כטופלה</button></article>)}</section>}
      {summary && tab === "dates" && <section className="academy-admin-panel"><h2>מועדים ואישורים</h2><p>כל הסמינרים: 15:00-20:00 · מינימום 8 ששילמו · עד 12 משתתפים. מושבים והיקף תשלום מחושבים בשרת.</p>
        <div className="academy-admin-date-list">{summary.dates.length === 0 && <p>אין מועדים בשרת.</p>}{summary.dates.map(entry => <article key={entry.id} className="academy-admin-date"><h3>{seminarTitle(entry.seminarId)} · {dateLabel(entry.date)}</h3><p>{entry.venue} · 15:00-20:00</p><p>{STATUSES[entry.status] ?? entry.status} · {APPROVALS[entry.approvalStatus] ?? entry.approvalStatus} · {entry.published ? "פורסם בסביבה המקומית" : "לא פורסם"}</p><p>שילמו: {entry.paidCount} · ללא עלות: {entry.complimentaryCount ?? 0} · שמירות זמניות: {entry.pendingCount} · פנויים: {entry.remainingCapacity} / {entry.capacity} · {entry.minimumEnrollmentMet ? "הושג מינימום לפתיחה" : "טרם הושג מינימום לפתיחה"}</p>{entry.minimumEnrollmentReviewAt && <p>נקודת בדיקה פנימית מוצעת למינימום משתתפים: {timestamp(entry.minimumEnrollmentReviewAt)}{entry.requiresMinimumEnrollmentDecision ? " · נדרשת החלטת בעלים" : ""}. אין ביטול אוטומטי או הודעה ללקוחות.</p>}<div className="academy-admin-actions"><button className="secondary" onClick={() => editDate(entry)} disabled={busy}>עריכה</button>{entry.approvalStatus !== "approved" && <><label className="academy-admin-check"><input type="checkbox" checked={!!checks[entry.id]} onChange={e => setChecks({ ...checks, [entry.id]: e.target.checked })} />בדקתי זמינות מקום ומנחה, חגים והתחייבויות ללקוחות קיימים</label><button disabled={busy || !checks[entry.id]} onClick={() => mutate(`/dates/${entry.id}/approve`, { checksConfirmed: true, publish: false, openRegistration: false }, "POST", "המועד אושר מקומית; הוא עדיין לא פורסם והרשמה לא נפתחה.")}>אישור מועד בלבד</button></>}<button className="secondary" disabled={busy || entry.approvalStatus === "rejected"} onClick={() => mutate(`/dates/${entry.id}/reject`, { reason: "נדחה בממשק הניהול" })}>דחייה וסגירת הרשמה</button></div></article>)}</div>
        <h3 id="academy-date-editor" tabIndex={-1}>{dateId ? "עריכת מועד" : "הוספת מועד בטיוטה"}</h3><form className="academy-admin-form" onSubmit={async e => { e.preventDefault(); if (await mutate(dateId ? `/dates/${dateId}` : "/dates", dateDraft, dateId ? "PATCH" : "POST")) { setDateId(null); setDateDraft(emptyDate()); setChecks({}); } }}>
          <label>סמינר<select value={dateDraft.seminarId} onChange={e => setDateDraft({ ...dateDraft, seminarId: e.target.value })}>{SEMINARS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
          <label>תאריך<input type="date" required value={dateDraft.date} onChange={e => setDateDraft({ ...dateDraft, date: e.target.value })} /></label>
          <label>מקום, אין להזין כתובת שלא אומתה<input required maxLength={500} value={dateDraft.venue} onChange={e => setDateDraft({ ...dateDraft, venue: e.target.value })} /></label>
          <label>קיבולת<input type="number" min={8} max={12} required value={dateDraft.capacity} onChange={e => setDateDraft({ ...dateDraft, capacity: Number(e.target.value) })} /></label>
          <label>מצב הרשמה ותפעול<select value={dateDraft.status} onChange={e => setDateDraft({ ...dateDraft, status: e.target.value })}>{Object.entries(STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="academy-admin-check"><input type="checkbox" checked={dateDraft.published} onChange={e => setDateDraft({ ...dateDraft, published: e.target.checked })} />פרסום בסביבה המקומית, נדרש אישור מועד בשרת</label>
          <p>כדי לפתוח מועד מאושר: לבחור ״הרשמה פתוחה״ ולסמן פרסום. כדי לסגור: לבחור ״הרשמה סגורה״. שינוי תאריך, סמינר או מקום מחייב בדיקה ואישור חוזר לפי כללי השרת.</p><div className="academy-admin-actions"><button disabled={busy}>שמירת {dateId ? "שינויים" : "טיוטה"}</button>{dateId && <button type="button" className="secondary" onClick={() => { setDateId(null); setDateDraft(emptyDate()); }}>ביטול עריכה</button>}</div>
        </form>
      </section>}
      {summary && tab === "coupons" && <section className="academy-admin-panel"><h2>קופונים פרטיים</h2><p>הרשימה מוגנת באסימון מנהל ואינה מוצגת לציבור. כל הנחה מאומתת מחדש בשרת לפני התשלום.</p><div className="academy-admin-table"><table><thead><tr><th>קוד</th><th>הנחה</th><th>מצב</th><th>מימושים</th><th>פעולות</th></tr></thead><tbody>{summary.coupons.map(c => <tr key={c.id}><td dir="ltr">{c.code}</td><td>{c.type === "percentage" ? `${c.value}%` : money(c.value)}</td><td>{c.active ? "פעיל" : "לא פעיל"}</td><td>{c.totalRedemptions} / {c.maxRedemptions}</td><td><button className="secondary" disabled={busy} onClick={() => editCoupon(c)}>עריכה</button> <button className="secondary" disabled={busy} onClick={() => mutate(`/coupons/${c.id}`, { active: !c.active }, "PATCH")}>{c.active ? "השבתה" : "הפעלה"}</button></td></tr>)}</tbody></table>{summary.coupons.length === 0 && <p>אין קופונים. קודים לדוגמה לא הופעלו.</p>}</div>
        <h3 id="academy-coupon-editor" tabIndex={-1}>{couponId ? "עריכת קופון" : "יצירת קופון"}</h3><form className="academy-admin-form" onSubmit={async e => { e.preventDefault(); if (await mutate(couponId ? `/coupons/${couponId}` : "/coupons", couponDraft, couponId ? "PATCH" : "POST")) { setCouponId(null); setCouponDraft(emptyCoupon()); } }}>
          <label>קוד<input dir="ltr" required pattern="[A-Za-z0-9_-]{3,40}" minLength={3} maxLength={40} value={couponDraft.code} onChange={e => setCouponDraft({ ...couponDraft, code: e.target.value.toUpperCase() })} /></label><label>סוג הנחה<select value={couponDraft.type} onChange={e => setCouponDraft({ ...couponDraft, type: e.target.value as CouponDraft["type"], value: 0 })}><option value="percentage">אחוזים</option><option value="fixed">סכום בשקלים</option></select></label>
          <label>{couponDraft.type === "percentage" ? "אחוז הנחה" : "סכום הנחה בשקלים"}<input type="number" required min={couponDraft.type === "percentage" ? 1 : 0.01} max={couponDraft.type === "percentage" ? 100 : undefined} step={couponDraft.type === "percentage" ? 1 : 0.01} value={couponDraft.type === "percentage" ? couponDraft.value : couponDraft.value / 100} onChange={e => setCouponDraft({ ...couponDraft, value: couponDraft.type === "percentage" ? Number(e.target.value) : Math.round(Number(e.target.value) * 100) })} /></label>
          <fieldset><legend>סמינרים זכאים, ללא בחירה: כל הסמינרים</legend>{SEMINARS.map(s => <label key={s.id} className="academy-admin-check"><input type="checkbox" checked={couponDraft.seminarIds.includes(s.id)} onChange={e => setCouponDraft({ ...couponDraft, seminarIds: e.target.checked ? [...couponDraft.seminarIds, s.id] : couponDraft.seminarIds.filter(id => id !== s.id) })} />{s.title}</label>)}</fieldset>
          <fieldset><legend>מועדים זכאים, ללא בחירה: כל המועדים</legend>{summary.dates.map(d => <label key={d.id} className="academy-admin-check"><input type="checkbox" checked={couponDraft.dateIds.includes(d.id)} onChange={e => setCouponDraft({ ...couponDraft, dateIds: e.target.checked ? [...couponDraft.dateIds, d.id] : couponDraft.dateIds.filter(id => id !== d.id) })} />{dateName(d.id)}</label>)}</fieldset>
          <label>תחילת תוקף (ISO כולל אזור זמן, ריק = ללא מגבלה)<input dir="ltr" placeholder="2026-10-20T00:00:00+03:00" value={couponDraft.startsAt ?? ""} onChange={e => setCouponDraft({ ...couponDraft, startsAt: e.target.value || null })} /></label><label>תפוגה (ISO כולל אזור זמן, ריק = ללא מגבלה)<input dir="ltr" placeholder="2026-11-20T23:59:59+02:00" value={couponDraft.expiresAt ?? ""} onChange={e => setCouponDraft({ ...couponDraft, expiresAt: e.target.value || null })} /></label>
          <label>מספר מימושים מרבי<input type="number" required min={1} step={1} value={couponDraft.maxRedemptions} onChange={e => setCouponDraft({ ...couponDraft, maxRedemptions: Number(e.target.value) })} /></label><label>מימושים מרביים ללקוח (ריק = ללא מגבלה)<input type="number" min={1} step={1} value={couponDraft.perCustomerLimit ?? ""} onChange={e => setCouponDraft({ ...couponDraft, perCustomerLimit: e.target.value ? Number(e.target.value) : null })} /></label><label>הערות ניהול<textarea maxLength={1000} value={couponDraft.notes} onChange={e => setCouponDraft({ ...couponDraft, notes: e.target.value })} /></label><label className="academy-admin-check"><input type="checkbox" checked={couponDraft.active} onChange={e => setCouponDraft({ ...couponDraft, active: e.target.checked })} />קופון פעיל</label><div className="academy-admin-actions"><button disabled={busy}>שמירת קופון</button>{couponId && <button type="button" className="secondary" onClick={() => { setCouponId(null); setCouponDraft(emptyCoupon()); }}>ביטול עריכה</button>}</div>
        </form>
      </section>}
      {summary && tab === "registrations" && <section className="academy-admin-panel"><h2>הרשמות ותשלומים</h2><p>מידע אישי מוגן. אין להעביר רשומות לאנליטיקה או לפרסם צילומי מסך עם פרטי משתתפים.</p><div className="academy-admin-table"><table><thead><tr><th>משתתף</th><th>מועד</th><th>מצב</th><th>סכום</th><th>הזמנה / עסקה</th></tr></thead><tbody>{summary.registrations.map(r => <tr key={r.id}><td>{r.customer.name}<br /><span dir="ltr">{r.customer.email}</span><br /><span dir="ltr">{r.customer.phone}</span></td><td>{dateName(r.dateId)}</td><td>{r.status === "confirmed" ? "מאושר" : r.status === "cancelled" ? "בוטל" : r.status}<br />{timestamp(r.createdAt)}</td><td>{money(r.totalAgorot)}<br />{r.couponCode ? `קופון: ${r.couponCode}` : "ללא קופון"}</td><td><span dir="ltr">{r.orderId}</span><br /><span dir="ltr">{r.transactionId}</span></td></tr>)}</tbody></table>{summary.registrations.length === 0 && <p>אין הרשמות. לא הוזנו משתתפים פיקטיביים.</p>}</div></section>}
      {summary && tab === "revenue" && <section className="academy-admin-panel"><h2>{summary.commerce.mode === "morning" ? "הכנסות מתשלומים מאומתים" : "הכנסות בסביבת בדיקה"}</h2><div className="academy-admin-stats"><p>ברוטו<strong>{money(summary.revenue.grossAgorot)}</strong></p><p>החזרים<strong>{money(summary.revenue.refundedAgorot)}</strong></p><p>נטו<strong>{money(summary.revenue.netAgorot)}</strong></p></div><h3>לפי סמינר</h3>{summary.revenue.bySeminar.length ? summary.revenue.bySeminar.map(r => <p key={r.seminarId}>{seminarTitle(r.seminarId)} · {r.paidCount} שילמו · {money(r.totalAgorot)}</p>) : <p>אין הכנסות רשומות.</p>}<h3>לפי מועד</h3>{summary.revenue.byDate.map(r => <p key={r.dateId}>{dateName(r.dateId)} · {r.paidCount} שילמו · {money(r.totalAgorot)}</p>)}<p>הדוח מקומי ואינו דוח חשבונאי או התאמה ל־Morning/Grow.</p></section>}
      {summary && tab === "outbox" && <section className="academy-admin-panel"><h2>תור אישורים, הכנה ותזכורות</h2><p>תור האירועים מאפשר לבדוק תוכן וסטטוס. ״ממתין״ אינו אישור מסירה. שליחה אמיתית דורשת חיבור ספק ותהליך עבודה פעיל.</p><button type="button" disabled={busy || !deliveryReady} onClick={drainMessages}>שליחת הודעות שירות שהגיע מועדן</button>{summary.outbox.length === 0 && <p>אין הודעות בתור.</p>}{summary.outbox.map(item => <article key={item.id} className="academy-admin-date"><h3>{item.payload.subject ?? item.kind}</h3><p>סוג: {item.kind} · מצב: {item.status === "pending" ? "ממתין" : item.status === "sent" ? "התקבל אצל ספק הדיוור" : item.status === "failed" ? "נכשל" : item.status} · ניסיונות: {item.attempts}</p><p>נמען: <span dir="ltr">{item.payload.to ?? "לא צוין"}</span> · מועד ניסיון הבא: {timestamp(item.nextAttemptAt)}</p>{item.lastError && <p role="status">שגיאת ספק: {item.lastError}</p>}<details><summary>תוכן ההודעה</summary><p className="academy-admin-message">{item.payload.text ?? "אין תוכן טקסט זמין."}</p></details></article>)}</section>}
    </>}
  </section>;
}
