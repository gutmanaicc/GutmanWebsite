import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "../assets/academy-logo.png";
import { CONSENT_KEY, loadPixel, track } from "../pixel";
import AccessibilityWidget from "../AccessibilityWidget";

// 9.8.2026, 10:00 שעון ישראל (IDT = UTC+3)
const LAUNCH_TS = Date.UTC(2026, 7, 9, 7, 0, 0);

const EVENT_TITLE = "🎓 ההשקה של האקדמיה הרשמית ל-AI · Gutman";
const EVENT_DETAILS =
  "זה קורה. האתר עולה, ההרשמה נפתחת, והמסלולים נחשפים.\nהדמיון הוא הגבול היחיד.\n\nhttps://gutmanai.com";

const googleCalUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(EVENT_TITLE)}` +
  "&dates=20260809T070000Z/20260809T100000Z" +
  `&details=${encodeURIComponent(EVENT_DETAILS)}` +
  `&location=${encodeURIComponent("gutmanai.com")}`;

const HINTS = [
  { id: "01", text: "לא יוצאים עם ידע. יוצאים עם תוצר ביד." },
  { id: "02", text: "מסלולים מקצועיים. יותר מזה לא נגלה." },
];

/* ---------------- countdown ---------------- */

type TimeLeft = { d: number; h: number; m: number; s: number; over: boolean };

function getTimeLeft(): TimeLeft {
  const diff = LAUNCH_TS - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor(diff / 3_600_000) % 24,
    m: Math.floor(diff / 60_000) % 60,
    s: Math.floor(diff / 1_000) % 60,
    over: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------------- split-flap digit ---------------- */

const FlipDigit = ({ value }: { value: string }) => {
  const [curr, setCurr] = useState(value);
  const [prev, setPrev] = useState<string | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    if (value === curr) return;
    setPrev(curr);
    setCurr(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPrev(null), 600);
    return () => window.clearTimeout(timer.current);
  }, [value, curr]);

  const flipping = prev !== null;

  return (
    <div className="flip">
      {/* static top shows the incoming value */}
      <div className="half top">
        <div className="digit-inner">{curr}</div>
      </div>
      {/* static bottom shows the outgoing value until the flap lands */}
      <div className="half bottom">
        <div className="digit-inner">{flipping ? prev : curr}</div>
      </div>
      {flipping && (
        <>
          <div className="half top flap flap-top" key={`t${curr}`}>
            <div className="digit-inner">{prev}</div>
          </div>
          <div className="half bottom flap flap-bottom" key={`b${curr}`}>
            <div className="digit-inner">{curr}</div>
          </div>
        </>
      )}
    </div>
  );
};

const FlipUnit = ({ value, label }: { value: string; label: string }) => (
  <div className="unit">
    <div className="digits">
      {value.split("").map((d, i) => (
        <FlipDigit key={i} value={d} />
      ))}
    </div>
    <div className="unit-label">{label}</div>
  </div>
);

/* ---------------- AI hint decryption ---------------- */

const SCRAMBLE_CHARS = "אבגדהוזחטיכלמנסעפצקרשת01☆✦#%&";

const HintSlot = ({ id, text }: { id: string; text: string }) => {
  const [state, setState] = useState<"sealed" | "typing" | "done">("sealed");
  const [shown, setShown] = useState(0);
  const [scramble, setScramble] = useState("");

  const start = useCallback(() => setState("typing"), []);

  useEffect(() => {
    if (state !== "typing") return;
    let i = 0;
    let iv = 0;
    const randScramble = (len: number) => {
      let s = "";
      for (let k = 0; k < len; k++) {
        s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      return s;
    };
    // שלב 1: "חושב", תווים מוצפנים מתחלפים לפני שההקלדה מתחילה
    const warmup = window.setInterval(() => setScramble(randScramble(4)), 70);
    const startTyping = window.setTimeout(() => {
      window.clearInterval(warmup);
      iv = window.setInterval(() => {
        i++;
        setShown(i);
        setScramble(randScramble(Math.min(3, text.length - i)));
        if (i >= text.length) {
          window.clearInterval(iv);
          setScramble("");
          setState("done");
        }
      }, 50);
    }, 800);
    return () => {
      window.clearInterval(warmup);
      window.clearTimeout(startTyping);
      window.clearInterval(iv);
    };
  }, [state, text]);

  if (state === "sealed") {
    return (
      <div className="hint-slot">
        <button className="hint-btn" onClick={start}>
          <span className="q">?</span>
          רמז {id}
        </button>
      </div>
    );
  }

  return (
    <div className="hint-slot">
      <div className="hint-console">
        <div className="meta">
          <span className="dot-live" />
          {state === "typing" ? `GUTMAN.AI · מפענח רמז ${id}...` : `GUTMAN.AI · רמז ${id} פוענח ✦`}
        </div>
        <div className="line" dir="rtl">
          {text.slice(0, shown)}
          {state === "typing" && <span className="scramble">{scramble}</span>}
          {state === "typing" && <span className="caret" />}
        </div>
      </div>
    </div>
  );
};

/* ---------------- blueprint layer ---------------- */

const BlueprintLayer = () => (
  <div className="blueprint" aria-hidden="true">
    <span className="blueprint-item big" style={{ top: "14%", right: "8%" }}>9.8</span>
    <span className="blueprint-item" style={{ top: "22%", left: "12%" }}>מסווג · GUTMAN ACADEMY</span>
    <span className="blueprint-item dim" style={{ top: "38%", right: "18%" }}>שלב 01: נחשף בקרוב</span>
    <span className="blueprint-item" style={{ top: "55%", left: "7%" }}>10:00 AM</span>
    <span className="blueprint-item dim" style={{ top: "66%", right: "10%" }}>הדמיון ← המציאות</span>
    <span className="blueprint-item" style={{ bottom: "18%", left: "16%" }}>ACCESS: PENDING</span>
    <span className="blueprint-item big" style={{ bottom: "8%", right: "30%" }}>✦</span>
    <span className="blueprint-item dim" style={{ top: "8%", left: "38%" }}>גרסה 1.0 · בבנייה</span>
    <div className="blueprint-circle" style={{ top: "12%", right: "5%", width: 130, height: 130 }} />
    <div className="blueprint-circle" style={{ bottom: "12%", left: "9%", width: 90, height: 90 }} />
    <span className="blueprint-cross" style={{ top: "30%", left: "30%" }}>+</span>
    <span className="blueprint-cross" style={{ top: "72%", right: "26%" }}>+</span>
    <span className="blueprint-cross" style={{ bottom: "30%", left: "48%" }}>+</span>
  </div>
);

/* ---------------- ambient dust ---------------- */

const Dust = () => {
  const motes = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        left: Math.random() * 100,
        top: 20 + Math.random() * 80,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 12,
        dur: 9 + Math.random() * 14,
        pink: Math.random() < 0.5,
      })),
    []
  );
  return (
    <div className="dust" aria-hidden="true">
      {motes.map((m, i) => (
        <span
          key={i}
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            background: m.pink ? "rgba(245,87,138,.6)" : "rgba(255,255,255,.35)",
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.dur}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ---------------- cookie consent (loads the pixel) ---------------- */

const Consent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted") loadPixel();
    else if (v !== "declined") setVisible(true);
  }, []);

  const choose = (v: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, v);
    setVisible(false);
    if (v === "accepted") loadPixel();
  };

  if (!visible) return null;
  return (
    <div className="consent" role="dialog" aria-label="הסכמת עוגיות">
      <span className="consent-text">רוצים לשמוע על זה ראשונים כשזה ייפתח? 🍪</span>
      <div className="consent-actions">
        <button className="consent-yes" onClick={() => choose("accepted")}>אני בפנים</button>
        <button className="consent-no" onClick={() => choose("declined")}>אוותר</button>
      </div>
    </div>
  );
};

/* ---------------- app ---------------- */

const ComingSoon = () => {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    document.title = "Gutman | האקדמיה הרשמית ל-AI | בקרוב";
  }, []);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  // spotlight: follows the pointer, drifts on its own when idle / on touch
  useEffect(() => {
    const root = document.documentElement;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.4;
    let x = tx;
    let y = ty;
    let lastMove = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
    };

    const tick = (now: number) => {
      // idle for 3s (or touch device) → the light roams by itself
      if (now - lastMove > 3000) {
        const t = now / 1000;
        tx = window.innerWidth * (0.5 + 0.33 * Math.sin(t * 0.35));
        ty = window.innerHeight * (0.42 + 0.28 * Math.sin(t * 0.23 + 1.7));
      }
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [bellOpen]);

  const headline = [
    { w: "הדמיון", accent: false },
    { w: "הוא", accent: false },
    { w: "הגבול", accent: true },
    { w: "היחיד.", accent: true },
  ];

  return (
    <div className="stage" dir="rtl" lang="he">
      <div className="beam" aria-hidden="true" />
      <BlueprintLayer />
      <Dust />
      <div className="sweep" aria-hidden="true" />
      <div className="torch" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <main className="content">
        <header className="logo-wrap enter" style={{ animationDelay: "0.1s" }}>
          <img src={logo} alt="Gutman" className="logo" width={320} height={75} />
          <div className="tagline">
            האקדמיה הרשמית <span className="ai">ל-AI</span>
          </div>
        </header>

        <h1 className="headline">
          {headline.map((p, i) => (
            <span key={i} className={`word${p.accent ? " accent" : ""}`} style={{ animationDelay: `${0.5 + i * 0.18}s` }}>
              {p.w}
              {i < headline.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>

        {time.over ? (
          <div className="live enter" style={{ animationDelay: "0.6s" }}>
            <span className="dot-live" />
            זה קורה עכשיו. תרעננו את העמוד.
          </div>
        ) : (
          <>
            <p className="sub enter" style={{ animationDelay: "1.25s" }}>
              האתר עולה, ההרשמה נפתחת, והמסלולים נחשפים.
              <b className="sub-date">9.8 בשעה 10:00</b>
            </p>

            <div className="clock enter" style={{ animationDelay: "1.45s" }} role="timer" aria-label="ספירה לאחור להשקה">
              <FlipUnit value={pad(time.d)} label="ימים" />
              <FlipUnit value={pad(time.h)} label="שעות" />
              <FlipUnit value={pad(time.m)} label="דקות" />
              <FlipUnit value={pad(time.s)} label="שניות" />
            </div>
          </>
        )}

        <div className="hints enter" style={{ animationDelay: "1.7s" }}>
          {HINTS.map((h) => (
            <HintSlot key={h.id} id={h.id} text={h.text} />
          ))}
        </div>

        <div className="bell-wrap enter" style={{ animationDelay: "1.9s" }} ref={bellRef}>
          <button
            className="bell"
            onClick={() => {
              setBellOpen((o) => !o);
              if (!bellOpen) track("ReminderOpen");
            }}
            aria-expanded={bellOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            תזכירו לי ב־9.8
          </button>
          <div className="bell-note">בלי להשאיר פרטים. רק תזכורת ליומן.</div>
          {bellOpen && (
            <div className="pop">
              <a href={googleCalUrl} target="_blank" rel="noreferrer" onClick={() => track("ReminderSet", { method: "google" })}>Google Calendar</a>
              <a href="/gutman-academy-launch.ics" download onClick={() => track("ReminderSet", { method: "apple_outlook" })}>Apple / Outlook</a>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">© GutmanAI {new Date().getFullYear()} · gutmanai.com</footer>
      <Consent />
      <AccessibilityWidget />
    </div>
  );
};

export default ComingSoon;
