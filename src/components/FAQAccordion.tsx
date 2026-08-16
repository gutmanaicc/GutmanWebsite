import { useId, useState } from "react";

type Item = { q?: string; a?: string; question?: string; answer?: string };

/**
 * אקורדיון שאלות: קווי שיער בלבד, שאלה בסריף תצוגה, ומעגל ורוד שמסתובב
 * לסגירה. אין מסגרת חיצונית - הרשימה נושמת על המשטח שמאחוריה.
 */
const FAQAccordion = ({ items, compact }: { items: Item[]; compact?: boolean }) => {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className={`mx-auto w-full ${compact ? "faq-compact" : "max-w-3xl"}`}>
      {items.map((item, i) => {
        const question = item.question ?? item.q ?? "";
        const answer = item.answer ?? item.a ?? "";
        const isOpen = open === i;
        return (
          <div className="faq-item" key={`${question}-${i}`} data-open={isOpen}>
            <button
              type="button"
              className="faq-q"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-a-${i}`}
              id={`${baseId}-q-${i}`}
            >
              <span className="faq-q-text">{question}</span>
              <span className="faq-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6.5 1.5v10M1.5 6.5h10" />
                </svg>
              </span>
            </button>
            <div className="faq-a" id={`${baseId}-a-${i}`} role="region" aria-labelledby={`${baseId}-q-${i}`}>
              <div className="faq-a-inner">
                <p>{answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
