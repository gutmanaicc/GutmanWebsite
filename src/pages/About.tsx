import { Link } from 'react-router-dom';
import { ArrowUpLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { SITE } from '../data/site';
import { ACADEMY_STORY } from '../data/academyStory';
import { orgSchema, useSeo } from '../lib/seo';
export default function About() {
  const reduced = useReducedMotion();
  useSeo({ title: 'על רון גוטמן והאקדמיה | Gutman Academy', description: 'הדרך מצילום ויצירת תוכן ללימודי AI מעשיים בקבוצות קטנות, בהנחיית רון גוטמן.', path: '/about', schema: [orgSchema()] });
  return <article className="academy-about-studio">
    <section className="academy-about-opening"><div className="academy-about-opening-type"><p className="academy-kicker">רון גוטמן / מייסד ומנחה</p><h1>הסיפור שמאחורי<br /><span>העשייה.</span></h1><p className="academy-about-deck">צילום. יצירה. טכנולוגיה.<br />ובעיקר, אנשים שמתחילים לעשות.</p><a href="#academy-story" className="academy-about-scroll">לסיפור של האקדמיה <span aria-hidden>↓</span></a></div><motion.div className="academy-about-opening-photo" initial={reduced ? false : { opacity: 0, y: 25, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: .8 }}><img src="/images/ron-portrait.jpg" alt="רון גוטמן, מייסד האקדמיה ומנחה הסמינרים" width="1000" height="1250" /><span>מחשבה טובה היא רק ההתחלה.</span></motion.div></section>
    <div className="academy-about-manifesto"><p>״ידע הוא בעל ערך<br />כשהוא <span>משנה משהו</span> בחיים שלכם.״</p><span>רון גוטמן</span></div>
    <div className="academy-story-layout" id="academy-story"><aside><div className="academy-kicker">הדרך לכאן</div><h2>מניסיון אישי.<br />למקום של<br /><span>אפשרויות.</span></h2><p>{SITE.founder.bio}</p></aside><div>{ACADEMY_STORY.map(chapter => <motion.section key={chapter.title} className="academy-story-chapter" initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .65 }}><p className="academy-kicker">{chapter.label}</p><h3>{chapter.title}</h3>{chapter.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</motion.section>)}</div></div>
    <section className="academy-about-closing"><p className="academy-kicker">בואו ליצור את הפרק הבא</p><h2>רעיון שלכם.<br /><span>עבודה שלנו, ביחד.</span></h2><Link className="academy-button" to="/courses">לסמינרים הקרובים <ArrowUpLeft size={22} aria-hidden /></Link></section>
  </article>;
}
