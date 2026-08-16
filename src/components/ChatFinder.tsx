import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getCourse } from "../data/courses";
import { useRegisterModal } from "../context/RegisterModalContext";
import { springPress, springSoft } from "../lib/motion";
import Pressable from "./Pressable";

/**
 * המנחה מפנה אך ורק לסדנאות שפתוחות להרשמה עכשיו. אין כאן אפשרות
 * שמובילה לסדנה שלא רצה, כדי שאף אחד לא יגיע לעמוד של סדנה שאי אפשר
 * להירשם אליה.
 */
type AudienceKey = "pro" | "therapy" | "student";

const Q1: { key: AudienceKey; label: string }[] = [
  { key: "pro", label: "איש/אשת מקצוע. סושיאל, וידאו, אופנה או קריאייטיב" },
  { key: "therapy", label: "מטפל/ת, פסיכולוג/ית או איש/אשת מקצוע בתחום הטיפול" },
  { key: "student", label: "סטודנט/ית" },
];

const Q2: Record<AudienceKey, { label: string; slug: string }[]> = {
  pro: [
    { label: "לנהל יותר לקוחות סושיאל בפחות זמן", slug: "social-media-ai" },
    { label: "לשלב AI בהפקת וידאו ובעריכה", slug: "ai-video-content" },
    { label: "ליצור ויזואלים ואופנה עם AI", slug: "ai-fashion" },
  ],
  therapy: [
    { label: "לחסוך זמן בתיעוד ובעבודה השוטפת", slug: "ai-for-therapists" },
    { label: "לבנות נוכחות ותוכן לקליניקה", slug: "social-media-ai" },
  ],
  student: [
    { label: "ללמוד למבחנים ולנהל את הלימודים עם AI", slug: "ai-for-students" },
    { label: "ליצור תוכן וסרטונים ברמה גבוהה", slug: "ai-video-content" },
  ],
};

type Msg = { kind: "bot"; text: string } | { kind: "user"; text: string } | { kind: "typing" };
type Step = "q1" | "q2" | "result" | null;

const TYPING_MS = 700;

const hapticTap = () => {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* unsupported */
  }
};

type Props = {
  onResult?: (slug: string, goal?: string) => void;
};

const stepIndex = (step: Step, hasStarted: boolean): number => {
  if (step === "result") return 3;
  if (step === "q2") return 2;
  if (step === "q1") return 1;
  return hasStarted ? 0 : 0;
};

const ChatFinder = ({ onResult }: Props) => {
  const { scrollToRegisterForm, openRegisterModal } = useRegisterModal();
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>(null);
  const [audience, setAudience] = useState<AudienceKey | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);
  const [lastGoal, setLastGoal] = useState("");
  const [started, setStarted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const botSay = (text: string, then?: () => void, delay = TYPING_MS) => {
    setMessages((m) => [...m, { kind: "typing" }]);
    later(() => {
      setMessages((m) => [...m.filter((x) => x.kind !== "typing"), { kind: "bot", text }]);
      then?.();
    }, delay);
  };

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages([]);
    setStep(null);
    setAudience(null);
    setResultSlug(null);
    setLastGoal("");
    setStarted(true);
    later(() => {
      botSay("היי! אני המנחה של האקדמיה 👋", () => {
        botSay("שתי שאלות קצרות ואגיד לך בדיוק איזה מסלול נבנה בשבילך. מוכנים?", () => {
          botSay("קודם כול, מה הכי מתאר אותך היום?", () => setStep("q1"));
        });
      });
    }, 350);
  };

  useEffect(() => {
    start();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, step]);

  const answerQ1 = (opt: { key: AudienceKey; label: string }) => {
    hapticTap();
    setStep(null);
    setAudience(opt.key);
    setMessages((m) => [...m, { kind: "user", text: opt.label }]);
    botSay("מעולה. ומה הכי חשוב לך להשיג עכשיו?", () => setStep("q2"));
  };

  const answerQ2 = (opt: { label: string; slug: string }) => {
    hapticTap();
    setStep(null);
    setLastGoal(opt.label);
    setMessages((m) => [...m, { kind: "user", text: opt.label }]);
    botSay("יש! זה בדיוק המסלול שנבנה בשביל זה:", () => {
      setResultSlug(opt.slug);
      setStep("result");
      onResult?.(opt.slug, opt.label);
    });
  };

  const result = resultSlug ? getCourse(resultSlug) : null;
  const progress = stepIndex(step, started);

  const goToLead = () => {
    if (!resultSlug) return;
    scrollToRegisterForm({
      courseId: resultSlug,
      initialGoal: lastGoal,
      leadSource: "chat-finder",
    });
  };

  return (
    <div className="chat-shell" data-reveal>
      <div className="chat-bar">
        <span className="chat-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="chat-bar-title">GUTMAN.AI · המנחה</span>
        <div className="chat-progress" aria-label={`שלב ${Math.min(progress, 2)} מתוך 2`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`chat-progress-dot ${progress >= n ? "is-active" : ""} ${
                progress === n ? "is-current" : ""
              }`}
            />
          ))}
        </div>
      </div>
      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {messages.map((m, i) =>
          m.kind === "typing" ? (
            <div className="chat-msg bot" key={`t-${i}`} aria-label="המנחה מקליד">
              <span className="chat-typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : (
            <div className={`chat-msg ${m.kind}`} key={i}>
              {m.text}
            </div>
          ),
        )}

        {step === "q1" && (
          <div className="chat-choices">
            {Q1.map((opt) => (
              <motion.button
                key={opt.key}
                type="button"
                className="chat-choice"
                onClick={() => answerQ1(opt)}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                transition={springPress}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        )}

        {step === "q2" && audience && (
          <div className="chat-choices">
            {Q2[audience].map((opt) => (
              <motion.button
                key={opt.slug + opt.label}
                type="button"
                className="chat-choice"
                onClick={() => answerQ2(opt)}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                transition={springPress}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        )}

        {step === "result" && result && (
          <>
            <motion.div
              className="chat-result-card"
              initial={reduced ? false : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springSoft}
            >
              {!reduced && (
                <motion.span
                  className="chat-celebrate"
                  aria-hidden
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: [0.6, 1.15, 1], opacity: [0, 1, 1] }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                >
                  ✦
                </motion.span>
              )}
              <h3>{result.title}</h3>
              <p>{result.tagline}</p>
              <div className="chat-result-actions">
                <Pressable type="button" className="btn-primary btn-small" onClick={goToLead}>
                  השאירו פרטים למסלול הזה
                </Pressable>
                <Pressable
                  as="link"
                  to={`/courses/${result.slug}`}
                  className="btn-ghost btn-small"
                  rippleTone="pink"
                >
                  לפרטי המסלול
                </Pressable>
                <Pressable
                  type="button"
                  className="btn-ghost btn-small"
                  rippleTone="pink"
                  onClick={() =>
                    openRegisterModal({
                      courseId: result.slug,
                      initialGoal: lastGoal,
                      leadSource: "chat-finder-modal",
                    })
                  }
                >
                  טופס מהיר
                </Pressable>
              </div>
            </motion.div>
            <button type="button" className="chat-restart" onClick={start}>
              לא מדויק? נתחיל מחדש
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatFinder;
