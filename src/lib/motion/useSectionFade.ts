import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMotionCapability } from './useMotionCapability';

/** One observer for all route/lazy sections, with no per-frame React updates.
 * Reveals repeat when a section leaves the viewport and comes back into view.
 */
export function useSectionFade() {
  const still = useMotionCapability() === 'static';
  const { pathname } = useLocation();
  useEffect(() => {
    const root = document.getElementById('main-content');
    if (!root || still || !('IntersectionObserver' in window)) return;
    const observed = new Set<HTMLElement>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const section = entry.target as HTMLElement;
        section.classList.toggle('is-revealed', entry.isIntersecting);
      }
    }, { threshold: 0, rootMargin: '0px 0px -35px 0px' });
    const scan = () => {
      for (const section of root.querySelectorAll<HTMLElement>('.academy-page section')) {
        if (observed.has(section) || section.parentElement?.closest('section') || section.classList.contains('academy-cinematic-hero')) continue;
        observed.add(section);
        section.classList.add('academy-scroll-fade');
        const bounds = section.getBoundingClientRect();
        section.classList.toggle('is-revealed', bounds.top < window.innerHeight - 35 && bounds.bottom > 0);
        observer.observe(section);
      }
      for (const section of observed) if (!section.isConnected) { observer.unobserve(section); observed.delete(section); }
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect(); mutations.disconnect();
      for (const section of observed) section.classList.remove('academy-scroll-fade', 'is-revealed');
    };
  }, [still, pathname]);
}
