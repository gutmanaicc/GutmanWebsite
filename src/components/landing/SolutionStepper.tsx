import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Images, LayoutGrid, User, Video } from "lucide-react";
import { Reveal } from "../motion";
import type { Outcome, SolutionStep } from "../../data/fashionLanding";

const OUTCOME_ICONS = {
  layout: LayoutGrid,
  images: Images,
  user: User,
  video: Video,
} as const;

/**
 * חמשת המפגשים כסטפר אינטראקטיבי, במקום חמישה כרטיסים עם פסקה כל אחד.
 *
 * זה רגע החתימה של הדף: על הפס מופיעים רק מספר וכותרת של 2-4 מילים,
 * והקשה על שלב פותחת שורת תיאור אחת מתחת. שלב אחד פתוח בכל רגע, שלב 1
 * פתוח כברירת מחדל. מי שרק סורקת רואה חמש כותרות; מי שרוצה, פותחת.
 *
 * הקו האנכי סטטי (לא scroll-driven כמו קודם): תחושת ההתקדמות באה מהשלב
 * הפתוח, לא מהגלילה, וזה חוסך scroll listener על מכשיר חלש.
 *
 * prefers-reduced-motion: התיאור מופיע מיד בלי אנימציית כניסה. הפתיחה
 * עצמה תמיד עובדת (זו הקשה, לא תנועה).
 */
const SolutionStepper = ({
  steps,
  outcomes,
  outcomesTitle,
}: {
  steps: readonly SolutionStep[];
  outcomes: readonly Outcome[];
  outcomesTitle: string;
}) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(0);

  return (
    <>
      <ol className="relative mx-auto mt-8 max-w-2xl">
        {/* הקו האנכי שעליו יושבים המספרים. start ולא left, לשמירה ב-RTL */}
        <span
          className="pointer-events-none absolute inset-y-4 start-[18px] w-px bg-gradient-to-b from-[#FF2D85]/10 via-[#FF2D85]/40 to-[#FF2D85]/10 sm:start-[19px]"
          aria-hidden
        />

        {steps.map((step, i) => {
          const isOpen = i === open;
          return (
            <Reveal key={step.step} variant="scale" delay={i * 0.05} as="li">
              <div className="relative flex gap-4 pb-2.5">
                {/*
                  הנקודה מלאה רק כשהשלב פתוח - כמו כל שאר השלבים. אין
                  יותר חריג ל"אחרון תמיד מלא": זה היה נקרא כאילו שלב 5
                  פתוח כברירת מחדל.
                */}
                <span
                  className={`relative z-[1] mt-1 flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border font-display text-sm font-bold tracking-tight transition-colors ${
                    isOpen
                      ? "border-[#FF2D85]/50 bg-[#FF2D85] text-white"
                      : "border-[#FF2D85]/30 bg-canvas text-[#FF2D85]"
                  }`}
                  dir="ltr"
                >
                  {step.step}
                </span>

                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-surface-1 shadow-card">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50 sm:px-5"
                  >
                    <h3 className="font-display text-[17px] font-bold tracking-tight text-bone">
                      {step.title}
                    </h3>
                    <ChevronDown
                      size={18}
                      className={`flex-none text-bone/40 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  {isOpen && (
                    <motion.p
                      initial={reduced ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="px-4 pb-4 text-[15px] leading-relaxed text-bone/65 sm:px-5"
                    >
                      {step.body}
                    </motion.p>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </ol>

      {/* עם מה יוצאים: רשת אייקונים 2x2, בלי זנבות טקסט */}
      <Reveal className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-[#FF2D85]/25 bg-[#FF2D85]/[0.05] p-4 sm:p-5">
          <h3 className="text-center font-display text-[17px] font-bold tracking-tight text-bone">
            {outcomesTitle}
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            {outcomes.map((item) => {
              const Icon = OUTCOME_ICONS[item.icon];
              return (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-canvas/40 p-3 text-[15px] font-medium text-bone/85"
                >
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#FF2D85]/15 text-[#FF2D85]"
                    aria-hidden
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </>
  );
};

export default SolutionStepper;
