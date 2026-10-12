import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACADEMY_CONTENT } from '../data/seminars';
import { ACADEMY_CONFIG } from '../lib/academy';
import IntroVideo from '../components/academy/IntroVideo';
import ClientLogos from '../components/academy/ClientLogos';
import SeminarPrice from '../components/academy/SeminarPrice';
import AcademyTestimonialVideo from '../components/academy/AcademyTestimonialVideo';
import { Closing, Examples, FAQ, Founder, Proof, SectionHeading, SeminarCards } from '../components/academy/Content';

import { useEffect } from 'react';

export default function HomeSections() {
  useEffect(() => {
    if (window.location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({behavior:'auto'}));
  }, []);
  return <>
    <section className="academy-strip" aria-label="פרטי הסמינרים"><div className="academy-container"><span>פרונטלי. אישי. מעשי.</span><span><bdi>{ACADEMY_CONFIG.startTime}-{ACADEMY_CONFIG.endTime}</bdi> · יום אחד</span><span>בהנחיית רון גוטמן</span><SeminarPrice compact /></div></section>
    <section className="academy-section academy-problem" id="how-it-works"><div className="academy-container"><div className="academy-problem-grid"><SectionHeading {...ACADEMY_CONTENT.problem} /><div className="academy-story-media"><IntroVideo /></div></div><div className="academy-method-grid">{ACADEMY_CONTENT.method.map(item => <article key={item.number}><span className="academy-method-number">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
    <section className="academy-section academy-catalog" id="seminars"><div className="academy-container"><div className="academy-heading-row"><SectionHeading eyebrow="שלושה סמינרים. מטרה ברורה." title="מה תרצו לבנות?" description="בחרו לפי העבודה שאתם עושים והתוצר שאתם רוצים להתחיל ממנו. בכל סמינר: יום אחד, קבוצה קטנה ותרגול על המקרה שלכם." /><Link to="/courses" className="academy-text-link">לכל הסמינרים <ArrowLeft size={20} aria-hidden="true" /></Link></div><SeminarCards /></div></section>
    <Examples videoOnly />
    <section className="academy-section academy-day"><div className="academy-container"><div className="academy-heading-row"><SectionHeading eyebrow="יום באקדמיה" title={"זמן ללמוד.\nובעיקר, זמן לעשות."} /><p className="academy-source-note">מסגרת היום, לדוגמה. התוכנית המפורטת וההפסקה מופיעות בעמוד כל סמינר.</p></div><ol className="academy-timeline">{ACADEMY_CONTENT.timeline.map(item => <li key={item.time}><time dir="ltr">{item.time}</time><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol></div></section>
    <Proof />
    {import.meta.env.VITE_ACADEMY_TESTIMONIAL_ENABLED === '1' && <AcademyTestimonialVideo />}
    <section className="academy-section academy-faq-section"><div className="academy-container academy-faq-layout"><SectionHeading eyebrow="לפני שמגיעים" title={"שאלות טובות.\nתשובות ברורות."} description="כל מה שכדאי לדעת לפני שבוחרים סמינר." /><FAQ /></div></section>
    <Founder />
    <ClientLogos />
    <Closing />
  </>;
}
