import { useEffect, useRef, useState } from "react";
import { getCourse } from "../data/courses";
import { useRegisterModal } from "../context/RegisterModalContext";
import Pressable from "./Pressable";

type AudienceKey = "pro" | "business" | "student";

const Q1: { key: AudienceKey; label: string }[] = [
  { key: "pro", label: "איש/אשת מקצוע. סושיאל, וידאו, קריאייטיב או שיווק" },
  { key: "business", label: "בעל/ת עסק או עצמאי/ת" },
  { key: "student", label: "סטודנט/ית" },
];

const Q2: Record<AudienceKey, { label: string; slug: string }[]> = {
  pro: [
    { label: "לנהל יותר לקוחות סושיאל בפחות זמן", slug: "social-media-ai" },
    { label: "לשלב AI בהפקת וידאו ותוכן", slug: "ai-video-content" },
    { label: "לבנות דפי נחיתה ללקוחות או לעצמי", slug: "ai-landing-page" },
    { label: "מערכת מסודרת ללקוחות ותשלומים", slug: "ai-business-systems" },
  ],
  business: [
    { label: "סדר בלקוחות, בחשבוניות ובתשלומים", slug: "ai-business-systems" },
    { label: "דף נחיתה לעסק או לשירות שלי", slug: "ai-landing-page" },
    { label: "תוכן וסושיאל לעסק, בשיטה", slug: "social-media-ai" },
    { label: "סרטונים ותוכן ויזואלי לעסק", slug: "ai-video-content" },
  ],
  student: [
    { label: "ללמוד למבחנים ולנהל את הלימודים עם AI", slug: "ai-for-students" },
    { label: "ליצור תוכן וסרטונים ברמה גבוהה", slug: "ai-video-content" },
    { label: "לבנות דף נחיתה לפרויקט או רעיון", slug: "ai-landing-page" },
  ],
};

type Msg = { kind: "bot"; text: string } | { kind: "user"; text: string } | { kind: "typing" };
type Step = "q1" | "q2" | "result" | null;

const TYPING_MS = 700;

type Props = {
  onResult?: (slug: string, goal?: string) => void;
};

const ChatFinder = ({ onResult }: Props) => {
  const { scrollToRegisterForm, openRegisterModal } = useRegisterModal();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>(null);
  const [audience, setAudience] = useState<AudienceKey | null>(null);
  const [resultSlug, setResultSlug] = useState<string | null>(null);
  const [lastGoal, setLastGoal] = useState("");
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
    setStep(null);
    setAudience(opt.key);
    setMessages((m) => [...m, { kind: "user", text: opt.label }]);
    botSay("מעולה. ומה הכי חשוב לך להשיג עכשיו?", () => setStep("q2"));
  };

  const answerQ2 = (opt: { label: string; slug: string }) => {
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
        <span className="chat-dots" aria-hidden="true"><span /><span /><span /></span>
        <span className="chat-bar-title">GUTMAN.AI · המנחה</span>
      </div>
      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {messages.map((m, i) =>
          m.kind === "typing" ? (
            <div className="chat-msg bot" key={`t-${i}`} aria-label="המנחה מקליד">
              <span className="chat-typing" aria-hidden="true"><span /><span /><span /></span>
            </div>
          ) : (
            <div className={`chat-msg ${m.kind}`} key={i}>{m.text}</div>
          )
        )}

        {step === "q1" && (
          <div className="chat-choices">
            {Q1.map((opt) => (
              <button key={opt.key} type="button" className="chat-choice" onClick={() => answerQ1(opt)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === "q2" && audience && (
          <div className="chat-choices">
            {Q2[audience].map((opt) => (
              <button key={opt.slug + opt.label} type="button" className="chat-choice" onClick={() => answerQ2(opt)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === "result" && result && (
          <>
            <div className="chat-result-card">
              <h3>{result.title}</h3>
              <p>{result.tagline}</p>
              <div className="chat-result-actions">
                <Pressable type="button" className="btn-primary btn-small" onClick={goToLead}>
                  השאירו פרטים למסלול הזה
                </Pressable>
                <Pressable as="link" to={`/courses/${result.slug}`} className="btn-ghost btn-small" rippleTone="pink">
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
            </div>
            <button type="button" className="chat-restart" onClick={start}>לא מדויק? נתחיל מחדש</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatFinder;
