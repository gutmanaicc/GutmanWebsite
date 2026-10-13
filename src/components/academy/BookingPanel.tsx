import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LeadInterestForm from './LeadInterestForm';
import SeminarPrice from './SeminarPrice';
import { CalendarDays, ArrowLeft, MapPin } from 'lucide-react';
import { ACADEMY_CONFIG, academyRequest, formatSeminarDate, trackAcademy, type Catalog } from '../../lib/academy';

export default function BookingPanel({ seminarSlug, seminarTitle }: { seminarSlug: string; seminarTitle: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setCatalog(null); setError(''); setSelected('');
    academyRequest<Catalog>('/catalog').then(result => { if (active) setCatalog(result); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [seminarSlug, attempt]);
  const dates = catalog?.dates.filter(date => date.seminarId === seminarSlug) || [];
  const date = dates.find(item => item.id === selected);
  return <section className="academy-booking" aria-labelledby="booking-title">
    <div className="academy-kicker">הצעד הבא</div>
    <h2 id="booking-title">בוחרים מועד. מתחילים לבנות.</h2>
    <p>{seminarTitle} · {ACADEMY_CONFIG.durationHours} שעות · <bdi>{ACADEMY_CONFIG.startTime}-{ACADEMY_CONFIG.endTime}</bdi></p>
    <SeminarPrice pricing={catalog?.pricing} />
    {error ? <div role="status" className="academy-notice"><p>{error}</p><button className="academy-text-button" onClick={() => setAttempt(value => value + 1)}>ניסיון נוסף</button></div> : !catalog ? <p role="status">בודקים מועדים זמינים…</p> : dates.length ? <>
      <fieldset className="academy-dates"><legend>מועד הסמינר</legend>{dates.map(item => <label className={`academy-date ${selected === item.id ? 'is-selected' : ''}`} key={item.id}>
        <input type="radio" name="seminar-date" value={item.id} disabled={item.remainingCapacity === 0 || item.status !== 'open_for_registration'} checked={selected === item.id} onChange={() => { setSelected(item.id); trackAcademy('select_seminar_date', { seminar_id: seminarSlug, date_id: item.id }); }} />
        <span><strong><CalendarDays size={17} aria-hidden />{formatSeminarDate(item.date)}</strong><span><bdi>{item.startTime}-{item.endTime}</bdi> · {item.remainingCapacity ? `${item.remainingCapacity} מקומות זמינים` : 'ההרשמה סגורה'}</span></span>
      </label>)}</fieldset>
      {date && <p><MapPin size={16} aria-hidden /> {date.venue}</p>}
      {catalog.commerce.ready && selected ? <Link reloadDocument className="academy-button" to={`/register?date=${encodeURIComponent(selected)}&seminar=${encodeURIComponent(seminarSlug)}`} onClick={() => trackAcademy('begin_checkout', { seminar_id: seminarSlug, date_id: selected })}>הרשמה לסמינר <ArrowLeft size={18} aria-hidden /></Link> : <p className="academy-notice">{selected ? 'ההרשמה בתשלום תיפתח לאחר השלמת ההגדרות הנדרשות.' : 'בחרו מועד כדי להמשיך להרשמה.'}</p>}
    </> : <div className="academy-notice"><CalendarDays size={22} aria-hidden /><strong>עדיין אין מועד מאושר להרשמה</strong><p>כשהמועדים יאושרו, תוכלו לבחור כאן תאריך ולהירשם אונליין.</p></div>}
    {catalog?.leads?.ready && <LeadInterestForm seminarSlug={seminarSlug} requestedDate={date?.date} />}
    <p className="academy-fineprint">הסמינר מתקיים בקבוצה של 8-12 משתתפים. פתיחת הקבוצה מותנית ב־8 הרשמות בתשלום. פרטי המקום ותנאי הביטול יוצגו לפני הרשמה.</p>
  </section>;
}
