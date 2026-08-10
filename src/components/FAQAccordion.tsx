import { useId, useState } from "react";

type Item = { q?: string; a?: string; question?: string; answer?: string };

const FAQAccordion = ({ items, compact }: { items: Item[]; compact?: boolean }) => {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div
      className={`divide-y divide-line/80 overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-card backdrop-blur-xl ${
        compact ? "faq-compact" : "rounded-3xl"
      }`}
    >
      {items.map((item, i) => {
        const question = item.question ?? item.q ?? "";
        const answer = item.answer ?? item.a ?? "";
        const isOpen = open === i;
        return (
          <div className={`faq-item ${compact ? "px-3 sm:px-4" : "px-4 sm:px-6"}`} key={`${question}-${i}`} data-open={isOpen}>
            <button
              type="button"
              className="faq-q"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-a-${i}`}
              id={`${baseId}-q-${i}`}
            >
              {question}
              <span className="faq-icon" aria-hidden="true">
                +
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
