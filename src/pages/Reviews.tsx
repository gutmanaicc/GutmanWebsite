import { Link } from 'react-router-dom';
import { ArrowUpLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { TESTIMONIALS } from '../data/testimonialsData';
import { useSeo } from '../lib/seo';
export default function Reviews() {
  const reduced = useReducedMotion();
  useSeo({ title: 'המלצות ממשתתפי האקדמיה | Gutman Academy', description: 'הודעות מקוריות ממשתתפי הסדנאות והמסלולים הקודמים באקדמיה, עם צילומי המקור.', path: '/reviews' });
  return <section className="academy-reviews-studio"><header><p className="academy-kicker">ההודעות שנשארות אחרי המפגש</p><h1>יש רגע שבו<br /><span>משהו מתחבר.</span></h1><div className="academy-reviews-deck"><p>שומעים אותו הכי טוב<br />במילים של מי שהיה כאן.</p><small>עדויות מקוריות מסדנאות ומסלולים קודמים באקדמיה. הן מתארות את הפורמטים הקודמים, ולא את הסמינרים החדשים בני חמש השעות.</small></div></header><div className="academy-proof-wall">{TESTIMONIALS.map((item,index) => <motion.article key={item.id} initial={reduced ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .55, delay: index % 3 * .07 }}><span className="academy-proof-quote" aria-hidden>״</span><blockquote>{item.quote}</blockquote><p>{item.text}</p><footer><span>{item.author || 'משתתף או משתתפת באקדמיה'}<small>לימודים קודמים באקדמיה</small></span><span aria-hidden>↗</span></footer><details><summary>לצפייה בהודעה המקורית</summary><img src={item.image} alt={`צילום ההודעה המקורית: ${item.quote}`} loading="lazy" /></details></motion.article>)}</div><div className="academy-reviews-closing"><h2>עכשיו, <span>התור שלכם ליצור.</span></h2><Link to="/courses" className="academy-button">לבחירת הסמינר שלי <ArrowUpLeft size={22} aria-hidden /></Link></div></section>;
}
