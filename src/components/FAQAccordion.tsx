import { useId, useState } from "react";

type Item = { q: string; a: string };

const FAQAccordion = ({ items }: { items: Item[] }) => {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className="faq-item" key={i} data-open={isOpen} data-reveal>
            <button
              className="faq-q"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-a-${i}`}
              id={`${baseId}-q-${i}`}
            >
              {item.q}
              <span className="faq-icon" aria-hidden="true">+</span>
            </button>
            <div className="faq-a" id={`${baseId}-a-${i}`} role="region" aria-labelledby={`${baseId}-q-${i}`}>
              <div className="faq-a-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
