import { ArrowLeft, ArrowUpLeft, Check, ChevronDown, Play } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACADEMY_CONTENT, ACADEMY_FAQ, type Seminar } from '../../data/seminars';
import { TESTIMONIALS, getTestimonialsForCourse } from '../../data/testimonialsData';
import { STUDENT_WORKS } from '../../data/studentWorksData';
import PremiumSeminarShowcase from './PremiumSeminarShowcase';
import { motion } from 'framer-motion';
import { useMotionCapability } from '../../lib/motion/useMotionCapability';

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  const reduced = useMotionCapability() === 'static';
  return <motion.div className="academy-section-heading" initial={reduced ? false : { y: 18 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.75, ease: [0.22,1,0.36,1] }}><p className="academy-eyebrow">{eyebrow}</p><h2>{title.split('\n').map((line,index) => <span key={line} className={index > 0 ? 'academy-heading-accent' : undefined}>{line}</span>)}</h2>{description && <p className="academy-description">{description}</p>}</motion.div>;
}

export function SeminarCards() {
  return <PremiumSeminarShowcase />;
}

export function FAQ({ items = ACADEMY_FAQ }: { items?: { question: string; answer: string }[] }) {
  return <div className="academy-faq">{items.map(item => <details key={item.question}><summary><span>{item.question}</span><ChevronDown size={20} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>;
}

function WorkVideo({ work }: { work: (typeof STUDENT_WORKS)[number] }) {
  const [show, setShow] = useState(false);
  return <figure className="academy-work">
    <div className="academy-work-frame">{show ? <video controls playsInline preload="metadata" poster={work.poster} aria-label={work.title}><source src={work.video} type="video/mp4" /><p>הדפדפן אינו תומך בניגון וידאו. <a href={work.video}>לפתיחת הסרטון</a></p></video> : <button className="academy-work-play" type="button" onClick={() => setShow(true)} aria-label={`פתיחת נגן: ${work.title}`}><img src={work.poster} alt={work.title} loading="lazy" width="720" height="1280" /><span className="academy-play-icon"><Play size={22} aria-hidden="true" /></span><span className="academy-play-label">לצפייה בתוצר</span></button>}</div>
    <figcaption><h3>{work.title}</h3><p>{work.author} · מסלול קודם</p></figcaption>
  </figure>;
}

export function Examples({ videoOnly = false }: { videoOnly?: boolean }) {
  const examples = [STUDENT_WORKS[4], STUDENT_WORKS[6], STUDENT_WORKS[8]];
  return <section className="academy-section academy-examples"><div className="academy-container">
    <div className="academy-heading-row"><SectionHeading eyebrow="מהרעיון למסך" title={"כשמתחילים ליצור,\nרואים את האפשרויות."} description="סרטונים שנוצרו במסלולי וידאו קודמים באקדמיה. תוצרים אמיתיים, עם סגנונות ורעיונות שונים." /><p className="academy-source-note">הדוגמאות הן ממסלולים קודמים, ואינן מבטיחות תוצאה זהה בסמינר של חמש שעות.</p></div>
    <div className="academy-work-grid">{examples.map(work => <WorkVideo key={work.id} work={work} />)}</div>
    {!videoOnly && <div className="academy-example-links"><p>היצירה מתחילה גם מחוץ למסך.</p><Link to="/courses/social-media-ai">סביבת עבודה לתוכן <ArrowLeft size={17} aria-hidden="true" /></Link><Link to="/courses/ai-business-owners">תהליך עבודה לעסק <ArrowLeft size={17} aria-hidden="true" /></Link></div>}
  </div></section>;
}

export function Proof({ seminarSlug }: { seminarSlug?: string }) {
  const testimonials = seminarSlug ? getTestimonialsForCourse(seminarSlug, 2) : [TESTIMONIALS[3], TESTIMONIALS[5], TESTIMONIALS[7]];
  return <section className="academy-section academy-proof" id="testimonials"><div className="academy-container"><div className="academy-heading-row"><SectionHeading eyebrow="מהמשתתפים שלנו" title={"הכי טוב לשמוע\nממי שכבר היה כאן."} /><p className="academy-source-note">עדויות מקוריות מסדנאות ומסלולים קודמים של האקדמיה. אינן עדויות על הסמינרים החדשים.</p></div>
    <div className={`academy-proof-grid ${testimonials.length === 2 ? 'academy-proof-grid--two' : ''}`}>{testimonials.map(item => <figure key={item.id}><span className="academy-quote-mark" aria-hidden="true">״</span><blockquote><h3>{item.quote}</h3><p>{item.text}</p></blockquote><figcaption><span>{item.author || 'משתתף/ת באקדמיה'}<small>סדנה או מסלול קודם</small></span><a href={item.image} target="_blank" rel="noreferrer">הודעת המקור <ArrowUpLeft size={15} aria-hidden="true" /></a></figcaption></figure>)}</div>
  </div></section>;
}

export function Founder({ compact = false }: { compact?: boolean }) {
  const founder = ACADEMY_CONTENT.founder;
  return <section className={`academy-section academy-founder ${compact ? 'academy-founder--compact' : ''}`} id="ron"><div className="academy-container academy-founder-grid"><div className="academy-founder-image"><img src="/images/ron-portrait.jpg" width="1000" height="1250" alt="רון גוטמן, מייסד האקדמיה ומנחה הסמינרים" loading="lazy" /><span className="academy-photo-caption">רון גוטמן / {founder.title}</span></div><div><p className="academy-eyebrow">ניסיון מהשטח. ליווי בגובה העיניים.</p><h2>נעים להכיר,<br /><span>רון גוטמן.</span></h2><p className="academy-founder-title">{founder.title} · מנחה הסמינרים</p><p className="academy-description">{founder.bio}</p><p className="academy-description">את הדרך הזו בניתי לתוך הסמינרים: אני מלמד, אתם בונים על העבודה שלכם. לא רק לראות מה AI יכול לעשות — לדעת לעשות את זה בעצמכם, עם ליווי לאורך הדרך.</p><Link className="academy-text-link" to="/about">לסיפור ולדרך שלי <ArrowLeft size={20} aria-hidden="true" /></Link></div></div></section>;
}

export function Deliverable({ seminar }: { seminar: Seminar }) {
  return <div className="academy-deliverable"><div className="academy-deliverable-top"><span className="academy-eyebrow">{seminar.example.label}</span><span aria-hidden="true">↗</span></div><h3>{seminar.example.title}</h3><ol>{seminar.example.steps.map((step, index) => <li key={step}><span className="academy-step-index" aria-hidden="true">0{index + 1}</span><span>{step}</span><Check size={17} aria-hidden="true" /></li>)}</ol><p>{seminar.example.note}</p></div>;
}

export function Closing({ title = ACADEMY_CONTENT.closing.title, description = ACADEMY_CONTENT.closing.description }: { title?: string; description?: string }) {
  return <section className="academy-section academy-closing"><div className="academy-container"><p className="academy-eyebrow">הצעד הבא שלכם</p><h2>{title}</h2><p className="academy-description">{description}</p><Link className="academy-button" to="/courses">לבחירת הסמינר שלי <ArrowLeft size={21} aria-hidden="true" /></Link></div></section>;
}
