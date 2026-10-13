import { ArrowDown, ArrowLeft, Check, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import BookingPanel from '../components/academy/BookingPanel';
import { Examples, FAQ, Founder, Proof, SectionHeading } from '../components/academy/Content';
import { ACADEMY_FAQ, getSeminar } from '../data/seminars';
import { ACADEMY_CONFIG } from '../lib/academy';
import { courseSchema, faqSchema, useSeo } from '../lib/seo';
import NotFound from './NotFound';
import ownerSchedule from '../../shared/academy-owner-schedule.json';
import { SeminarVisual } from '../components/academy/PremiumSeminarShowcase';
import { CommercialDisclosure } from '../components/academy/CommercialDisclosure';

export default function SeminarDetail() {
  const { slug } = useParams();
  const seminar = getSeminar(slug);
  useSeo({ title: seminar ? `${seminar.title} | מכללת גוטמן` : 'סמינר לא נמצא | מכללת גוטמן', description: seminar?.description || 'הסמינרים המעשיים של מכללת גוטמן', path: `/courses/${slug || ''}`, schema: seminar ? [courseSchema(seminar), faqSchema([...seminar.faq, ...ACADEMY_FAQ])] : undefined });
  if (!seminar) return <NotFound />;
  return <div className={`academy-page academy-product academy-product--${seminar.slug}`}><section className="academy-product-hero"><div className="academy-container"><nav aria-label="ניווט היררכי" className="academy-breadcrumb"><Link to="/courses">הסמינרים</Link><span aria-hidden="true"> / </span><span>{seminar.title}</span></nav><div className="academy-product-hero-grid"><div><p className="academy-eyebrow">{seminar.accentLabel}</p><h1>{seminar.title}</h1><p className="academy-product-tagline">{seminar.tagline}</p><p className="academy-description">{seminar.description}</p><div className="academy-actions"><a className="academy-button" href="#booking">הרשמה לסמינר <ArrowLeft size={21} aria-hidden="true" /></a><a href="#agenda" className="academy-text-link">לצפייה בתוכנית <ArrowDown size={18} aria-hidden="true" /></a></div><div className="academy-product-facts"><span>{ACADEMY_CONFIG.durationHours} שעות</span><span><bdi>{ACADEMY_CONFIG.startTime}-{ACADEMY_CONFIG.endTime}</bdi></span><span>{ACADEMY_CONFIG.minimumParticipants}-{ACADEMY_CONFIG.maximumParticipants} משתתפים</span><span>בהנחיית רון גוטמן</span><span className="academy-product-location"><MapPin size={16} aria-hidden="true" /><span>הטרמינל לעיצוב, בת ים<small>{ownerSchedule.venue.split(', ')[1]}</small></span></span></div></div><div className="academy-product-visual"><SeminarVisual seminar={seminar} /></div></div></div></section>
    <div className="academy-container academy-product-body"><div className="academy-product-main"><section className="academy-product-section"><SectionHeading eyebrow="הצורך" title="מוכר לכם?" description={seminar.problem} /></section><section className="academy-product-section"><SectionHeading eyebrow="התוצאה" title="מה תבנו בסמינר?" description={seminar.outcome} /><ul className="academy-check-list">{seminar.deliverables.map(item => <li key={item}><Check size={18} aria-hidden="true" /><span>{item}</span></li>)}</ul></section>
    <section className="academy-product-section"><SectionHeading eyebrow="למי זה מתאים" title={"מגיעים מהשטח.\nמתרגלים על שלכם."} /><div className="academy-audience-tags">{seminar.audience.map(item => <span key={item}>{item}</span>)}</div><p className="academy-description">{seminar.experience}</p></section>
    <section className="academy-product-section" id="agenda"><SectionHeading eyebrow="תוכנית היום" title="חמש שעות, שלב אחרי שלב." /><p className="academy-source-note">תוכנית מוצעת לפורמט החדש, כפופה לאישור פדגוגי ולהתאמה לכל מועד.</p><ol className="academy-agenda">{seminar.agenda.map(item => <li key={item.time}><time dir="ltr">{item.time}</time><div><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol></section>
    <section className="academy-product-section"><SectionHeading eyebrow="הכנה קצרה" title="מה כדאי להביא?" /><ul className="academy-check-list">{seminar.preparation.map(item => <li key={item}><Check size={18} aria-hidden="true" /><span>{item}</span></li>)}</ul><p className="academy-source-note">סוגי הכלים: {seminar.tools.join(' · ')}. הדרישות ועלויות המנויים הנפרדות מפורטות להלן ומוצגות שוב לפני התשלום.</p></section>
    <CommercialDisclosure seminarSlug={seminar.slug} />
    </div><aside className="academy-product-booking" id="booking" aria-label="מועדים והרשמה"><BookingPanel seminarSlug={seminar.slug} seminarTitle={seminar.title} /></aside></div>
    {seminar.slug === 'ai-video-content' && <Examples videoOnly />}
    <Proof seminarSlug={seminar.slug} /><Founder compact />
    <section className="academy-section academy-faq-section"><div className="academy-container academy-faq-layout"><SectionHeading eyebrow="לפני שמחליטים" title="עוד כמה שאלות." /><FAQ items={[...seminar.faq, ...ACADEMY_FAQ.filter((_, index) => [0, 1, 2, 4, 5, 6, 7, 8].includes(index))]} /></div></section>
    <section className="academy-section academy-product-closing"><div className="academy-container"><h2>הצעד הראשון הוא לבחור יום.</h2><p>המועדים המאושרים ופרטי ההרשמה מופיעים כאן, בשקיפות.</p><a className="academy-button" href="#booking">למועדים ולהרשמה <ArrowLeft size={21} aria-hidden="true" /></a><Link className="academy-text-link" to="/courses">בחזרה לכל הסמינרים</Link></div></section>
  </div>;
}
