import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SeminarPrice from '../components/academy/SeminarPrice';
import { FAQ, SectionHeading, SeminarCards } from '../components/academy/Content';
import { ACADEMY_FAQ } from '../data/seminars';
import { ACADEMY_CONFIG } from '../lib/academy';
import { useSeo } from '../lib/seo';

export default function Courses() {
  useSeo({ title: 'הסמינרים | מכללת גוטמן', description: 'שלושה סמינרים מעשיים ב-AI: סושיאל, יצירת וידאו ובעלי עסקים. חמש שעות בקבוצה של 8-12, עם רון גוטמן ותוצר משלכם.', path: '/courses' });
  return <div className="academy-page academy-catalog-page"><section className="academy-catalog-hero"><div className="academy-container"><Link to="/" className="academy-breadcrumb">מכללת גוטמן / הסמינרים</Link><p className="academy-eyebrow">יום אחד. נקודת התחלה חדשה.</p><h1>בוחרים את המטרה.<br /><span>בונים את הדרך.</span></h1><div className="academy-catalog-hero-bottom"><p className="academy-description">שלושה סמינרים מעשיים. בכל אחד מהם עובדים על מקרה משלכם, עם ליווי אישי ותוצר ראשוני שאפשר להמשיך לפתח.</p><div className="academy-catalog-facts"><span>{ACADEMY_CONFIG.durationHours} שעות</span><span>{ACADEMY_CONFIG.minimumParticipants}-{ACADEMY_CONFIG.maximumParticipants} משתתפים</span><SeminarPrice compact /></div></div></div></section>
    <section className="academy-section academy-catalog-list"><div className="academy-container"><SeminarCards /><p className="academy-catalog-note">המועדים ופרטי המקום יוצגו בעמוד כל סמינר לאחר אישורם. המחירים מוצגים למשתתף; המחיר הסופי מופיע לפני התשלום.</p></div></section>
    <section className="academy-section academy-catalog-help"><div className="academy-container"><SectionHeading eyebrow="איך בוחרים?" title={"לפי מה שחוזר אצלכם\nביום העבודה."} /><div className="academy-choice-grid"><p><strong>כותבים ומנהלים תוכן ללקוחות?</strong>סמינר הסושיאל מתמקד בידע על לקוח ובתהליך תוכן.</p><p><strong>רוצים לחבר רעיון לסרטון?</strong>סמינר הווידאו מתמקד בשפה חזותית, תנועה ועריכה.</p><p><strong>מנהלים את העבודה של העסק?</strong>סמינר בעלי העסקים מתמקד בידע ובמשימות חוזרות.</p></div><a className="academy-text-link" href="mailto:gutmanaicc@gmail.com">יש שאלה על ההתאמה? כתבו לנו <ArrowLeft size={20} aria-hidden="true" /></a></div></section>
    <section className="academy-section academy-faq-section"><div className="academy-container academy-faq-layout"><SectionHeading eyebrow="הפרטים הקטנים" title="לפני שבוחרים." /><FAQ items={ACADEMY_FAQ.slice(0, 5)} /></div></section>
  </div>;
}
