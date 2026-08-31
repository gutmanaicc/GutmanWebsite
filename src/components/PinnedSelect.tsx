import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Pinned listbox - relative wrapper + absolute top-full menu so modal scroll
 * cannot detach the options list on mobile (430×932).
 *
 * יושב בקובץ נפרד כי הוא משרת שני טפסים: טופס ההרשמה והשלמת הפרטים
 * בעמוד התודה. שכפול היה מייצר שתי רשימות שנראות זהות ומתנהגות אחרת
 * ברגע שאחת מהן מתוקנת.
 */
export const PinnedSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  invalid?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;
  const selectedLabel = options.find((o) => o.value === value)?.label;
  const label = selectedLabel || placeholder;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={id}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right text-base text-bone outline-none transition-[border-color,box-shadow] focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/25"
        style={invalid ? { borderColor: "rgb(239 68 68)" } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-bone" : "text-bone/35"}>{label}</span>
        <span className="text-bone/45" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-surface-2 py-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]"
        >
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex min-h-11 w-full items-center px-3.5 py-2.5 text-right text-sm font-medium transition-colors ${
                    selected
                      ? "bg-brand/15 text-brand"
                      : "text-bone/80 hover:bg-white/[0.06] hover:text-bone focus-visible:bg-white/[0.08] focus-visible:text-bone"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PinnedSelect;
