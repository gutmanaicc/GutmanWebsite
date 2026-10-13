import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ParallaxGridCanvas from './motion/ParallaxGridCanvas';
import { Menu, X, ArrowLeft, Instagram, Mail } from 'lucide-react';
import Logo from './Logo';
import ChunkReloadBoundary from './ChunkReloadBoundary';
import AccessibilityMenu from './AccessibilityMenu';
import { Consent } from './Consent';
import { SITE } from '../data/site';
import { trackAcademy } from '../lib/academy';
import { useSectionFade } from '../lib/motion/useSectionFade';
import { analyticsPathAllowed, canUseAnalytics, COOKIE_PREFERENCES_EVENT, MEASUREMENT_READY_EVENT, measurementEnvironmentEnabled } from '../consent';
import { trackPixelPage } from '../pixel';

const navigation = [
  { to: '/', label: 'ראשי' }, { to: '/courses', label: 'הסמינרים' },
  { to: '/#how-it-works', label: 'איך זה עובד' }, { to: '/reviews', label: 'המלצות' },
  { to: '/about', label: 'עלינו' },
];

export default function AcademyLayout() {
  useSectionFade();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const production = import.meta.env.VITE_ACADEMY_PRODUCTION_APPROVED === '1' && /^(www\.)?gutmanai\.com$/.test(window.location.hostname);
  useEffect(() => {
    let viewed = false;
    const measure = () => {
      trackPixelPage();
      const slug = location.pathname.match(/^\/(?:courses|syllabus)\/(social-media-ai|ai-video-content|ai-business-owners)$/)?.[1];
      if (!viewed && slug && window.gtag && canUseAnalytics()) { trackAcademy('seminar_view', { seminar_id: slug }); viewed = true; }
    };
    window.addEventListener(MEASUREMENT_READY_EVENT, measure); measure();
    return () => window.removeEventListener(MEASUREMENT_READY_EVENT, measure);
  }, [location.pathname]);
  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
    };
    if (open) document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [open]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'auto' });
      else window.scrollTo(0, 0);
    }, 70);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);
  return <div className={`academy-shell ${location.pathname === "/" ? "academy-shell--home" : ""}`}><ParallaxGridCanvas />
    {!production && <div className="academy-preview-bar">תצוגה מקדימה · רכישה זמינה רק במועדים המאושרים</div>}
    <a className="academy-skip" href="#main-content">דילוג לתוכן המרכזי</a>
    <header className={`academy-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="academy-header-inner">
        <Link to="/" className="academy-logo" aria-label="Gutman Academy, לעמוד הבית"><Logo height={42} /></Link>
        <nav className="academy-desktop-nav" aria-label="ניווט ראשי">{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive && (!item.to.includes('#') || location.hash === '#how-it-works') ? 'active' : undefined}>{item.label}</NavLink>)}</nav>
        <Link className="academy-header-cta" to="/courses" onClick={() => trackAcademy('homepage_cta_click', { placement: 'header' })}>לסמינרים הקרובים <ArrowLeft size={17} aria-hidden /></Link>
        <button ref={menuButton} className="academy-menu-toggle" type="button" aria-expanded={open} aria-controls="academy-mobile-nav" aria-label={open ? 'סגירת תפריט' : 'פתיחת תפריט'} onClick={() => setOpen(value => !value)}>{open ? <X aria-hidden /> : <Menu aria-hidden />}</button>
      </div>
      <AnimatePresence>{open && <motion.nav initial={reduced ? false : { opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduced ? 0 : 0.22 }} ref={menuRef} className="academy-mobile-nav" id="academy-mobile-nav" aria-label="ניווט בנייד">{navigation.map(item => <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}<ArrowLeft size={17} aria-hidden /></Link>)}</motion.nav>}</AnimatePresence>
    </header>
    <main id="main-content" tabIndex={-1}><ChunkReloadBoundary><Suspense fallback={<p className="academy-route-loading" role="status">טוענים את העמוד…</p>}><Outlet /></Suspense></ChunkReloadBoundary></main>
    <footer className="academy-footer"><div className="academy-footer-inner">
      <div><Link className="academy-logo" to="/"><Logo height={42} /></Link><p>חמש שעות. קבוצה קטנה. תוצר משלכם.</p></div>
      <nav aria-label="קישורים בתחתית העמוד"><Link to="/courses">הסמינרים</Link><Link to="/about">על האקדמיה</Link><Link to="/reviews">המלצות</Link><Link reloadDocument to="/booking-terms">תנאי הרשמה וביטול</Link><Link reloadDocument to="/terms">תקנון האתר</Link><Link reloadDocument to="/privacy">מדיניות פרטיות</Link><Link reloadDocument to="/privacy-requests">פניות פרטיות</Link><Link to="/accessibility">הצהרת נגישות</Link><button type="button" onClick={()=>window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}>העדפות עוגיות</button></nav>
      <div className="academy-footer-contact"><a href={`mailto:${SITE.contact.email}`}><Mail size={18} aria-hidden /><bdi>{SITE.contact.email}</bdi></a><a href={SITE.social.instagram} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden /> GutmanAI</a><span>© {new Date().getFullYear()} Gutman Academy</span></div>
    </div><div className="academy-container academy-cancellation-access"><Link reloadDocument to="/cancel">ביטול עסקה</Link><p>אפשר למסור הודעה בטופס המקוון, באימייל <a href={`mailto:${SITE.contact.email}`} dir="ltr">{SITE.contact.email}</a> או בטלפון <a href={`tel:${SITE.contact.phone.replace(/\D/g, '')}`} dir="ltr">{SITE.contact.phone}</a>. בהודעת ביטול יש לציין שם ומספר זהות בהתאם לדין; מספר הזמנה יסייע בזיהוי העסקה.</p></div></footer>
    <Consent enabled={measurementEnvironmentEnabled() && analyticsPathAllowed(location.pathname)} />
    <AccessibilityMenu />
  </div>;
}
