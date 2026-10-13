import { useEffect } from 'react';
import { useMotionCapability } from './useMotionCapability';

/** One observer for all route/lazy sections, with no per-frame React updates.
 * Current content stays visible; only sections below the fold fade in once.
 */
export function useSectionFade() {
  const still = useMotionCapability() === 'static';
  useEffect(() => {
    const root = document.getElementById('main-content');
    if (!root || still || !('IntersectionObserver' in window)) return;
    const observed = new Set<HTMLElement>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const section = entry.target as HTMLElement;
        section.classList.add('is-revealed'); observer.unobserve(section);
      }
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
    const scan = () => {
      for (const section of root.querySelectorAll<HTMLElement>('.academy-page section')) {
        if (observed.has(section) || section.parentElement?.closest('section')) continue;
        observed.add(section);
        if (section.getBoundingClientRect().top < window.innerHeight * .95) continue;
        section.classList.add('academy-scroll-fade'); observer.observe(section);
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
  }, [still]);
}
