import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpLeft, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACADEMY_CONTENT } from '../../data/seminars';
import { ACADEMY_CONFIG } from '../../lib/academy';
import { useMediaQuery } from '../../lib/motion/useMediaQuery';
import { useMotionCapability } from '../../lib/motion/useMotionCapability';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CinematicHero() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
  const motionLevel = useMotionCapability();
  const coarse = useMediaQuery('(pointer: coarse)');
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [pathIndex, setPathIndex] = useState(0);
  const path = ACADEMY_CONTENT.heroPaths[pathIndex];
  const saveData = typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const animate = motionLevel !== 'static' && !saveData;
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -65]);

  useEffect(() => {
    if (!animate || !section.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !paused) video.current?.play().catch(() => undefined);
      else video.current?.pause();
    }, { rootMargin: '100px' });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, [animate, paused]);

  return <section ref={section} className="academy-cinematic-hero">
    <motion.div className="academy-cinematic-scene" style={animate && !coarse ? { y: backgroundY } : undefined} aria-hidden="true">
      <img src={ACADEMY_CONTENT.heroScene.image} srcSet={`${ACADEMY_CONTENT.heroScene.smallImage} 1024w, ${ACADEMY_CONTENT.heroScene.image} 1672w`} sizes="100vw" alt="" width={ACADEMY_CONTENT.heroScene.width} height={ACADEMY_CONTENT.heroScene.height} {...({ fetchpriority: 'high' } as Record<string, string>)} />
      {animate && ACADEMY_CONTENT.heroScene.motionVideo && <video ref={element => { video.current = element; if (element) { element.muted = true; element.setAttribute('muted', ''); } }} className="hero-loop" poster="/images/hero-night.jpg" muted loop autoPlay={!paused} playsInline preload="metadata" tabIndex={-1} style={{ opacity: ready ? 1 : 0 }} onLoadedData={() => { setReady(true); if (paused) video.current?.pause(); }}><source src="/videos/hero-night-loop.webm" type="video/webm" /><source src="/videos/hero-night-loop.mp4" type="video/mp4" /></video>}
    </motion.div>
    <div className="academy-cinematic-portal" aria-hidden="true" /><div className="academy-cinematic-shade" aria-hidden="true" />
    <motion.div className="academy-cinematic-content" style={animate && !coarse ? { y: titleY } : undefined} initial={reduced ? false : { y: 24 }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE }}>
      <p className="academy-eyebrow"><span className="academy-dot" />{ACADEMY_CONTENT.hero.eyebrow}</p>
      <h1 className="hero-title">מגיעים עם רעיון.<br />יוצאים עם משהו <span className="hero-title-accent">אמיתי.</span></h1>
      <p className="academy-cinematic-promise"><strong>חמש שעות. קבוצה קטנה.</strong> משהו שבניתם בעצמכם.</p>
      <p className="academy-cinematic-description">סמינרים פרונטליים עם רון גוטמן. עובדים על הלקוח, העסק או הפרויקט שלכם, ומקבלים הכוונה אישית בדרך לתוצר.</p>
      <div className="academy-cinematic-actions"><Link to="/courses" className="academy-button">לבחירת הסמינר שלי <ArrowUpLeft size={20} aria-hidden="true" /></Link><a href="#how-it-works" className="academy-button academy-button--outline">איך זה עובד? <ArrowDown size={17} aria-hidden="true" /></a></div>
      <div className="academy-hero-pathfinder">
        <div className="academy-pathfinder-top"><span>מה תרצו לבנות?</span><div>{ACADEMY_CONTENT.heroPaths.map((item,index) => <button key={item.slug} type="button" aria-pressed={index === pathIndex} onClick={() => setPathIndex(index)}>{item.label}</button>)}</div></div>
        <Link to={`/courses/${path.slug}`} className="academy-pathfinder-outcome"><span className="academy-pathfinder-index" aria-hidden="true">0{pathIndex + 1}</span><span><strong>{path.title}</strong><small>{path.text}</small></span><span className="academy-pathfinder-go"><ArrowUpLeft size={21} aria-hidden="true" /><span className="sr-only">לפרטי הסמינר</span></span></Link>
        <div className="academy-pathfinder-trace" aria-hidden="true"><span>רעיון</span><i /><span>תרגול</span><i /><span>תוצר משלכם</span></div>
      </div>
    </motion.div>
    <div className="academy-cinematic-bottom"><span>{ACADEMY_CONFIG.durationHours} שעות של עבודה</span><span>{ACADEMY_CONFIG.minimumParticipants}–{ACADEMY_CONFIG.maximumParticipants} משתתפים</span><span><bdi>{ACADEMY_CONFIG.startTime}–{ACADEMY_CONFIG.endTime}</bdi></span><a href="#seminars">שלושה סמינרים. התחלה אחת. <ArrowDown size={16} aria-hidden="true" /></a></div>
    {animate && ACADEMY_CONTENT.heroScene.motionVideo && <button className="academy-background-control" type="button" aria-label={paused ? 'הפעלת תנועת הרקע' : 'עצירת תנועת הרקע'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>}
  </section>;
}
