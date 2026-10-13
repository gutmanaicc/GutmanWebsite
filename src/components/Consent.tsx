import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { grantClarity, loadClarity, revokeClarity } from '../clarity';
import { CONSENT_KEY, COOKIE_PREFERENCES_EVENT, cookieChoice, hasAnalyticsConsent } from '../consent';
import { grantGa, loadGa, revokeGa } from '../ga';
import { grantTracking, loadPixel, revokeTracking } from '../pixel';
import { captureUtm } from '../lib/leads';

/** Explicit opt-in. Old v1 acknowledgment is not tracking consent. */
export const Consent = ({ enabled = true }: { enabled?: boolean }) => {
  const [visible, setVisible] = useState(false); const reduced = useReducedMotion();
  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener(COOKIE_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, open);
  }, []);
  useEffect(() => {
    if (!enabled) { revokeTracking(); revokeClarity(); revokeGa(); return; }
    if (hasAnalyticsConsent()) { loadPixel(); loadClarity(); loadGa(); grantTracking(); grantClarity(); grantGa(); captureUtm(); return; }
    if (!cookieChoice()) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [enabled]);
  function choose(choice: 'accepted' | 'declined') {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 2, choice, decidedAt: new Date().toISOString() })); }
    catch { /* Without stored consent, measurement stays off. */ }
    setVisible(false);
    if (choice === 'accepted' && enabled && hasAnalyticsConsent()) {
      loadPixel(); loadClarity(); loadGa(); grantTracking(); grantClarity(); grantGa(); captureUtm();
    } else {
      const scriptsLoaded = Boolean(window.fbq || window.clarity || window.gtag);
      revokeTracking(); revokeClarity(); revokeGa();
      // Already loaded vendors can retain anonymous collection after revocation.
      // A fresh document removes them; session-scoped order access is retained.
      if (scriptsLoaded) window.location.reload();
    }
  }
  return <AnimatePresence>{visible && <motion.div role="dialog" aria-label="העדפות עוגיות ומדידה" aria-describedby="cookie-description" dir="rtl" className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-canvas/95 backdrop-blur-md" initial={reduced ? false : { y: '100%' }} animate={{ y: 0 }} exit={reduced ? undefined : { y: '100%' }} transition={{ duration: .25 }}><div className="container-site flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"><p id="cookie-description" className="text-[13px] leading-relaxed text-bone/75">מדידה ופרסום הם לבחירתכם ומופעלים רק לאחר הסכמה. {enabled ? 'הבחירה אינה תנאי לשימוש באתר או להרשמה.' : 'בעמוד הזה אין מדידה אופציונלית.'} אפשר לשנות את הבחירה בתחתית האתר. <Link reloadDocument to="/privacy" className="underline">מידע על פרטיות ועוגיות</Link></p><div className="flex shrink-0 flex-wrap items-center gap-3"><button type="button" onClick={() => choose('declined')} className="min-h-11 rounded-full border border-bone/40 px-5 text-[13px] font-medium text-bone">ללא מדידה אופציונלית</button><button type="button" onClick={() => choose('accepted')} className="min-h-11 rounded-full border border-bone/40 px-5 text-[13px] font-medium text-bone">מאשרים מדידה ופרסום</button></div></div></motion.div>}</AnimatePresence>;
};
