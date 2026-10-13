import { useEffect, useRef, useState } from 'react';
import { ArrowUpLeft, Check, FileText, Layers, MessageSquare, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMotionCapability } from '../../lib/motion/useMotionCapability';
import { Link } from 'react-router-dom';
import SeminarPrice from './SeminarPrice';
import { SEMINARS, type Seminar } from '../../data/seminars';
import { ACADEMY_CONFIG, academyRequest, formatSeminarDate, type Catalog, type SeminarDate } from '../../lib/academy';

export function SeminarVisual({ seminar }: { seminar: Seminar }) {
  if (seminar.slug === 'ai-video-content') return <figure className="academy-stage-visual academy-stage-visual--film">
    <div className="academy-film-frame academy-film-frame--back"><img src="/images/works/movie-7.jpg" alt="" loading="lazy" /></div>
    <div className="academy-film-frame academy-film-frame--front"><img src="/images/works/movie-5.jpg" alt="פריים מתוך פרומו לקמפיין ממסלול וידאו קודם באקדמיה" loading="lazy" /></div>
    <div className="academy-film-timeline" aria-hidden="true"><span>רעיון</span><span>תמונה</span><span>תנועה</span><span>עריכה</span><i /><b>מרעיון לעריכה · המחשת תהליך</b></div>
    <figcaption>פריימים מתוצרים אמיתיים של מסלולי וידאו קודמים. אינם הבטחה לתוצר זהה בחמש שעות.</figcaption>
  </figure>;
  if (seminar.slug === 'ai-business-owners') return <figure className="academy-stage-visual academy-stage-visual--whatsapp">
    <a className="academy-whatsapp-phone academy-whatsapp-phone--riki" href="/images/riki-whatsapp.webp" target="_blank" rel="noopener noreferrer" aria-label="הגדלת השיחה של רון עם ריקי, בלשונית חדשה">
      <img src="/images/riki-whatsapp.webp" width={1100} height={1429} loading="lazy" decoding="async" alt="רון מתייעץ עם ריקי מזכירה בוואטסאפ על תעדוף הצעות מחיר, הכנה לסדנה ופוסט" />
    </a>
    <div className="academy-workspace-note"><Check size={17} aria-hidden="true" /><span>עוד יד בעסק. בוואטסאפ שלכם.</span></div>
    <figcaption>מתוך השיחה של רון עם ריקי. אפשר ללחוץ להגדלה.</figcaption>
    <div className="sr-only"><p>רון: ריקי, אני מוצף. יש לי שלוש הצעות מחיר לשלוח, סדנא לשבוע הבא ופוסט להעלות. במה להתחיל?</p><p>ריקי: חיים שלי, נתחיל מהצעות המחיר ללקוחות שכבר מחכים, כדי לקדם סגירה. אחר כך נקדם את ההכנה לסדנה. הפוסט יכול לחכות. שלח לי את הפרטים של ההצעה הראשונה ואכין לך טיוטה לאישור.</p></div>
  </figure>;
  return <figure className={`academy-stage-visual academy-stage-visual--${seminar.slug === 'social-media-ai' ? 'social' : 'business'}`}>
    <div className="academy-workspace-window"><div className="academy-workspace-bar"><span aria-hidden="true"><i /><i /><i /></span><p>{seminar.slug === 'social-media-ai' ? 'סביבת עבודה · לקוח אחד' : 'סביבת העבודה של העסק'}</p><Layers size={16} aria-hidden="true" /></div>
      <div className="academy-workspace-main"><aside><span className="academy-workspace-brand"><Sparkles size={17} aria-hidden="true" /> הידע שלי</span>{['הקשר ומטרות', 'שפה והוראות', 'משימות חוזרות'].map((label, index) => <span key={label} className={index === 0 ? 'is-active' : ''}><FileText size={14} aria-hidden="true" />{label}</span>)}</aside>
        <div className="academy-workspace-chat"><span className="academy-workspace-chip">הקשר לפני פרומפט</span><h4>{seminar.slug === 'social-media-ai' ? 'מתחילים ממה שמייחד את המותג.' : 'העסק שלכם, במילים שלכם.'}</h4><div className="academy-mock-question"><MessageSquare size={15} aria-hidden="true" /><p>{seminar.slug === 'social-media-ai' ? 'בואו נבנה רעיונות שמתאימים לקהל ולשפה שלנו.' : 'בואו נבנה טיוטה למשימה שחוזרת בכל שבוע.'}</p></div><div className="academy-mock-answer"><Sparkles size={17} aria-hidden="true" /><div><strong>{seminar.slug === 'social-media-ai' ? 'קהל. טון. מטרה.' : 'מידע. הוראות. תהליך.'}</strong><span /><span /><span /></div></div><div className="academy-mock-compose"><span>הצעד הבא מתחיל כאן...</span><ArrowUpLeft size={17} aria-hidden="true" /></div></div>
      </div>
    </div><div className="academy-workspace-note"><Check size={17} aria-hidden="true" /><span>{seminar.slug === 'social-media-ai' ? 'לקוח אחד. תהליך תוכן משלכם.' : 'משימה אחת. התחלה שעובדת.'}</span></div><figcaption>המחשה של מבנה העבודה, ולא צילום של מערכת או תוצר של משתתף.</figcaption>
  </figure>;
}

function SeminarStage({ seminar, index, date }: { seminar: Seminar; index: number; date?: SeminarDate }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useMotionCapability() === 'static';
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const visualY = useTransform(scrollYProgress, [0, 1], [35, 0]);
  return <article ref={ref} className={`academy-premium-stage academy-premium-stage--${index + 1}`} style={{ top: `${118 + index * 12}px` }}>
    <div className="academy-stage-meta"><span className="academy-stage-number">0{index + 1}</span><span>{seminar.accentLabel}</span><span>{ACADEMY_CONFIG.durationHours} שעות · פרונטלי · קבוצה קטנה</span><ArrowUpLeft size={23} aria-hidden="true" /></div>
    <div className="academy-stage-layout"><div className="academy-stage-copy"><h3><Link to={`/courses/${seminar.slug}`}>{seminar.title}</Link></h3><p className="academy-stage-tagline">{seminar.tagline}</p><p className="academy-stage-description">{seminar.description}</p><div className="academy-stage-tags">{seminar.example.steps.slice(0, 3).map(step => <span key={step}>{step}</span>)}</div><p className="academy-stage-date">{date ? `המועד הקרוב: ${formatSeminarDate(date.date)}` : 'מועדים חדשים יפורסמו לאחר אישורם'}</p><div className="academy-stage-actions"><Link to={`/courses/${seminar.slug}`} className="academy-button">לפרטים ולהרשמה <ArrowUpLeft size={20} aria-hidden="true" /></Link><SeminarPrice compact /></div></div><motion.div className="academy-stage-media" style={reduced ? undefined : { y: visualY }}><SeminarVisual seminar={seminar} /></motion.div></div>
  </article>;
}

export default function PremiumSeminarShowcase() {
  const [dates, setDates] = useState<SeminarDate[]>([]);
  useEffect(() => {
    let alive = true;
    academyRequest<Catalog>('/catalog').then(catalog => { if (alive) setDates(catalog.dates.filter(date => date.published && date.approvalStatus === 'approved' && date.status === 'open_for_registration').sort((a,b) => a.date.localeCompare(b.date))); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return <div className="academy-premium-stack">{SEMINARS.map((seminar, index) => <SeminarStage key={seminar.slug} seminar={seminar} index={index} date={dates.find(date => date.seminarId === seminar.slug)} />)}</div>;
}
