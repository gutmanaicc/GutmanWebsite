import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import CinematicHero from '../components/academy/CinematicHero';
import { ACADEMY_CONTENT } from '../data/seminars';
import { orgSchema, useSeo } from '../lib/seo';
const HomeSections = lazy(() => import('./HomeSections'));

export default function Home() {
  const sentinel = useRef<HTMLDivElement>(null);
  const [showSections, setShowSections] = useState(() => Boolean(window.location.hash));
  useSeo({ title: 'מכללת גוטמן | סמינרים מעשיים ב-AI, ביום אחד', description: ACADEMY_CONTENT.hero.description, path: '/', schema: [orgSchema()] });
  useEffect(() => {
    if (showSections || !sentinel.current) return;
    /* כל החוויה נשמרת; האזור שמתחת לפתיחה נבנה עם תחילת הגלילה, כדי
       שחישוב מאות אלמנטים לא יעכב את התמונה והטיפוגרפיה הראשונות. */
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShowSections(true); observer.disconnect(); }
    });
    observer.observe(sentinel.current);
    const showAnchoredContent = () => setShowSections(true);
    window.addEventListener('hashchange', showAnchoredContent);
    return () => { observer.disconnect(); window.removeEventListener('hashchange', showAnchoredContent); };
  }, [showSections]);
  return <div className="academy-page academy-home">
    <CinematicHero />
    <div ref={sentinel} className="academy-home-sections" data-academy-sections={showSections ? 'loaded' : 'pending'}>
      {showSections && <Suspense fallback={<p className="academy-route-loading" role="status">טוענים את המשך העמוד…</p>}><HomeSections /></Suspense>}
    </div>
  </div>;
}
