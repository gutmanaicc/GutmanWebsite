import { useEffect, useId, useRef, useState } from "react";

const STORAGE_KEY = "a11y-prefs-v2";
const A11Y_CHANGE_EVENT = "gutman:a11y-change";

export type A11yPrefs = {
  fontStep: number;
  highContrast: boolean;
  invertColors: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  stopMotion: boolean;
  bigCursor: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  fontStep: 0,
  highContrast: false,
  invertColors: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopMotion: false,
  bigCursor: false,
};

const FONT_MIN = -2;
const FONT_MAX = 4;
const FONT_STEP_PCT = 10;

export const applyA11yPrefs = (p: A11yPrefs) => {
  const root = document.documentElement;
  root.style.fontSize = `${100 + p.fontStep * FONT_STEP_PCT}%`;
  root.classList.toggle("a11y-high-contrast", p.highContrast);
  root.classList.toggle("a11y-invert", p.invertColors);
  root.classList.toggle("a11y-grayscale", p.grayscale);
  root.classList.toggle("a11y-highlight-links", p.highlightLinks);
  root.classList.toggle("a11y-readable-font", p.readableFont);
  root.classList.toggle("a11y-reduce-motion", p.stopMotion);
  root.classList.toggle("a11y-big-cursor", p.bigCursor);
  document.body.classList.toggle("a11y-reduce-motion", p.stopMotion);
  window.dispatchEvent(new CustomEvent(A11Y_CHANGE_EVENT, { detail: p }));
};

const loadPrefs = (): A11yPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate v1 if present
      const legacy = localStorage.getItem("a11y-prefs-v1");
      if (legacy) {
        const old = JSON.parse(legacy) as Partial<A11yPrefs>;
        return { ...DEFAULT_PREFS, ...old };
      }
      return DEFAULT_PREFS;
    }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
};

const savePrefs = (p: A11yPrefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / private mode */
  }
};

const ToggleRow = ({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`a11y-toggle${pressed ? " on" : ""}`}
    onClick={onClick}
    aria-pressed={pressed}
    aria-label={`${label}${pressed ? ", פעיל" : ", כבוי"}`}
  >
    <span className="a11y-toggle-label">{label}</span>
    <span className="a11y-switch" aria-hidden="true">
      <span className="a11y-knob" />
    </span>
  </button>
);

/** Original site accessibility glyph (pre-lucide). */
const A11yIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="4" r="2" />
    <path
      d="M19 7h-4.6l-.9-.3L8 5.1a1 1 0 0 0-.6 1.9l4.1 1.4V11l-2.2 6.6a1 1 0 0 0 1.9.7L13 13h.3l1.8 5.3a1 1 0 1 0 1.9-.6L15 11V8.9h4a1 1 0 0 0 0-2z"
      transform="translate(-1.5 1)"
    />
  </svg>
);

/**
 * Israeli IS 5568 / WCAG 2.1 AA accessibility menu.
 * Persists preferences in localStorage and applies global document classes.
 */
const AccessibilityMenu = () => {
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    applyA11yPrefs(loaded);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector<HTMLElement>("button");
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyA11yPrefs(next);
      savePrefs(next);
      return next;
    });
  };

  const reset = () => {
    setPrefs(DEFAULT_PREFS);
    applyA11yPrefs(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
  };

  return (
    <>
      <button
        type="button"
        tabIndex={0}
        className="a11y-launcher fixed bottom-6 left-6 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#141318] text-bone shadow-[0_6px_20px_-6px_rgba(0,0,0,0.6)] transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out hover:scale-105 hover:border-[#FF2D85]/50 hover:text-[#FF2D85] hover:shadow-[0_12px_28px_-8px_rgba(255,45,133,0.35)] focus:outline-none focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-[#FF2D85] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <A11yIcon />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-label="תפריט נגישות"
          className="a11y-panel"
          dir="rtl"
        >
          <div className="a11y-head">
            <h2 id={titleId}>תפריט נגישות</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור תפריט נגישות"
              className="a11y-x"
            >
              ✕
            </button>
          </div>

          <p className="a11y-label" id={`${panelId}-font`}>
            גודל גופן
          </p>
          <div className="a11y-font-row" role="group" aria-labelledby={`${panelId}-font`}>
            <button
              type="button"
              onClick={() => update({ fontStep: Math.max(FONT_MIN, prefs.fontStep - 1) })}
              disabled={prefs.fontStep <= FONT_MIN}
              aria-label="הקטן גופן"
            >
              −
            </button>
            <span aria-live="polite">{100 + prefs.fontStep * FONT_STEP_PCT}%</span>
            <button
              type="button"
              onClick={() => update({ fontStep: Math.min(FONT_MAX, prefs.fontStep + 1) })}
              disabled={prefs.fontStep >= FONT_MAX}
              aria-label="הגדל גופן"
            >
              +
            </button>
          </div>

          <div className="a11y-toggles">
            <ToggleRow
              label="ניגודיות גבוהה"
              pressed={prefs.highContrast}
              onClick={() => update({ highContrast: !prefs.highContrast })}
            />
            <ToggleRow
              label="היפוך צבעים"
              pressed={prefs.invertColors}
              onClick={() => update({ invertColors: !prefs.invertColors })}
            />
            <ToggleRow
              label="גווני אפור"
              pressed={prefs.grayscale}
              onClick={() => update({ grayscale: !prefs.grayscale })}
            />
            <ToggleRow
              label="הדגשת קישורים וכפתורים"
              pressed={prefs.highlightLinks}
              onClick={() => update({ highlightLinks: !prefs.highlightLinks })}
            />
            <ToggleRow
              label="גופן קריא"
              pressed={prefs.readableFont}
              onClick={() => update({ readableFont: !prefs.readableFont })}
            />
            <ToggleRow
              label="עצירת אנימציות"
              pressed={prefs.stopMotion}
              onClick={() => update({ stopMotion: !prefs.stopMotion })}
            />
            <ToggleRow
              label="סמן עכבר מוגדל"
              pressed={prefs.bigCursor}
              onClick={() => update({ bigCursor: !prefs.bigCursor })}
            />
          </div>

          <button type="button" className="a11y-reset" onClick={reset}>
            איפוס כל ההגדרות
          </button>
        </div>
      )}
    </>
  );
};

export default AccessibilityMenu;
export { A11Y_CHANGE_EVENT };
