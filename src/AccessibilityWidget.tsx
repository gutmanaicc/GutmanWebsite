import { useEffect, useState } from "react";

const STORAGE_KEY = "a11y-prefs-v1";

type Prefs = {
  fontStep: number; // -2..+4
  highContrast: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
};

const DEFAULT_PREFS: Prefs = {
  fontStep: 0,
  highContrast: false,
  highlightLinks: false,
  bigCursor: false,
};

const FONT_MIN = -2;
const FONT_MAX = 4;
const FONT_STEP_PCT = 10;

const applyPrefs = (p: Prefs) => {
  const root = document.documentElement;
  root.style.fontSize = `${100 + p.fontStep * FONT_STEP_PCT}%`;
  root.classList.toggle("a11y-high-contrast", p.highContrast);
  root.classList.toggle("a11y-highlight-links", p.highlightLinks);
  root.classList.toggle("a11y-big-cursor", p.bigCursor);
};

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
};

const savePrefs = (p: Prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

const A11yIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="4" r="2" />
    <path d="M19 7h-4.6l-.9-.3L8 5.1a1 1 0 0 0-.6 1.9l4.1 1.4V11l-2.2 6.6a1 1 0 0 0 1.9.7L13 13h.3l1.8 5.3a1 1 0 1 0 1.9-.6L15 11V8.9h4a1 1 0 0 0 0-2z" transform="translate(-1.5 1)" />
  </svg>
);

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    applyPrefs(loaded);
  }, []);

  const update = (patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      savePrefs(next);
      return next;
    });
  };

  const reset = () => {
    setPrefs(DEFAULT_PREFS);
    applyPrefs(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
  };

  return (
    <>
      <button
        type="button"
        className="a11y-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <A11yIcon />
      </button>

      {open && (
        <div id="a11y-panel" role="dialog" aria-label="תפריט נגישות" className="a11y-panel" dir="rtl">
          <div className="a11y-head">
            <h2>תפריט נגישות</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="סגור תפריט נגישות" className="a11y-x">✕</button>
          </div>

          <p className="a11y-label">גודל גופן</p>
          <div className="a11y-font-row">
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
            <ToggleRow label="ניגודיות גבוהה" pressed={prefs.highContrast} onClick={() => update({ highContrast: !prefs.highContrast })} />
            <ToggleRow label="הדגשת קישורים" pressed={prefs.highlightLinks} onClick={() => update({ highlightLinks: !prefs.highlightLinks })} />
            <ToggleRow label="סמן עכבר מוגדל" pressed={prefs.bigCursor} onClick={() => update({ bigCursor: !prefs.bigCursor })} />
          </div>

          <button type="button" className="a11y-reset" onClick={reset}>איפוס הגדרות</button>

          <button type="button" className="a11y-statement-link" onClick={() => setStatementOpen(true)}>
            הצהרת נגישות מלאה
          </button>
        </div>
      )}

      {statementOpen && (
        <div className="a11y-modal-backdrop" onClick={() => setStatementOpen(false)}>
          <div
            className="a11y-modal"
            role="dialog"
            aria-label="הצהרת נגישות"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="a11y-head">
              <h2>הצהרת נגישות</h2>
              <button type="button" onClick={() => setStatementOpen(false)} aria-label="סגור הצהרת נגישות" className="a11y-x">✕</button>
            </div>
            <div className="a11y-statement">
              <p>
                אתר gutmanai.com של Gutman, האקדמיה הרשמית ל-AI, שם דגש על הנגשת האתר לכלל
                הגולשים, לרבות אנשים עם מוגבלות. אנו פועלים להתאמת האתר לתקן הישראלי ת"י 5568
                ברמת AA, המבוסס על הנחיות WCAG 2.0 ברמת AA.
              </p>
              <p>
                באתר פועל תפריט נגישות המאפשר: הגדלה והקטנה של הגופן, מצב ניגודיות גבוהה,
                הדגשת קישורים וסמן עכבר מוגדל. ההעדפות נשמרות בין ביקורים. בנוסף, האתר תומך
                בניווט מקלדת ובקוראי מסך.
              </p>
              <h3>רכז הנגישות</h3>
              <p>
                לפניות בנושא נגישות, דיווח על ליקוי או בקשה להתאמה, ניתן ליצור קשר:
                <br />
                שם: רון גוטמן
                <br />
                טלפון: <a href="tel:+972508185107" dir="ltr">050-8185107</a>
                <br />
                אימייל: <a href="mailto:gutmanaicc@gmail.com">gutmanaicc@gmail.com</a>
              </p>
              <p>אנו מתחייבים לטפל בפניות נגישות תוך 14 ימי עסקים ולעדכן את הפונה בסטטוס הטיפול.</p>
              <p className="a11y-updated">ההצהרה עודכנה לאחרונה: יולי 2026</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ToggleRow = ({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) => (
  <button type="button" className={`a11y-toggle${pressed ? " on" : ""}`} onClick={onClick} aria-pressed={pressed} aria-label={label}>
    <span className="a11y-toggle-label">{label}</span>
    <span className="a11y-switch" aria-hidden="true"><span className="a11y-knob" /></span>
  </button>
);

export default AccessibilityWidget;
