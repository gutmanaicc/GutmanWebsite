import { useEffect } from "react";

/**
 * חושף אלמנטים עם data-reveal כשהם נכנסים למסך.
 *
 * הסריקה לא נעשית פעם אחת בלבד, וזה מכוון.
 *
 * הכלל [data-reveal]:not(.revealed) הוא opacity-0, כלומר מצב הבסיס של
 * כל אלמנט כזה הוא בלתי נראה, ורק ההוק הזה מוציא אותו משם. לכן אלמנט
 * שנולד אחרי הסריקה נשאר בלתי נראה לתמיד - לא באג ויזואלי קטן אלא
 * תוכן שנעלם. בדיוק זה קרה לכותרת "איך אנחנו מלמדים" בנייד, כשהיא
 * הורכבה בעקבות החלפת ענף שקרתה מיד אחרי הסריקה.
 *
 * הסיבה השורשית תוקנה במקום אחר (useMediaQuery מחזיר תשובה נכונה כבר
 * ברינדור הראשון), אבל המשמר הזה נשאר: כל עוד המחיר של פספוס הוא
 * תוכן בלתי נראה, עדיף שההוק יתפוס גם אלמנטים שיצוצו מאוחר יותר.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsIO = "IntersectionObserver" in window;

    const revealAll = (els: HTMLElement[]) => els.forEach((el) => el.classList.add("revealed"));

    const collect = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.revealed)"));

    if (reduced || !supportsIO) {
      revealAll(collect());
      /* גם כאן צריך משמר: ענף שיוחלף אחר כך יביא אלמנטים חדשים */
      const mo = new MutationObserver(() => revealAll(collect()));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("revealed");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    const observed = new WeakSet<HTMLElement>();
    const observeNew = () => {
      for (const el of collect()) {
        if (observed.has(el)) continue;
        observed.add(el);
        io.observe(el);
      }
    };

    observeNew();

    /*
     * childList בלבד ובלי attributes: מעניין אותנו רק שנוספו צמתים.
     * מעקב אחרי attributes היה מפעיל את הקולבק גם על הוספת revealed
     * שאנחנו עצמנו כותבים, כלומר לולאה.
     */
    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
