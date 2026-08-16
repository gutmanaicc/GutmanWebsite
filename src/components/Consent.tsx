import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CONSENT_KEY, grantTracking, loadPixel, revokeTracking } from "../pixel";

/**
 * רצועת יידוע על מדידה: קו שיער בתחתית המסך, טקסט אחד, ושתי מילות
 * פעולה. בלי קופסה, בלי אימוג'י, בלי לחסום את האתר.
 *
 * המדידה פועלת בברירת מחדל ומי שלוחץ "לא תודה" מכבה אותה. הבחירה
 * נשמרת, ולכן הבאנר לא חוזר בביקורים הבאים.
 */
export const Consent = () => {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const v = localStorage.getItem(CONSENT_KEY);

    /* מי שסירב פעם - לא נטען לו כלום, וגם הבאנר לא חוזר */
    if (v === "declined") return;

    loadPixel();

    if (v !== "accepted") {
      // לא קופץ על המבקר בשנייה הראשונה
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  const choose = (v: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, v);
    setVisible(false);
    if (v === "declined") revokeTracking();
    else grantTracking();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="הסכמת עוגיות"
          dir="rtl"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-canvas/92 backdrop-blur-md"
          initial={reduced ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={reduced ? undefined : { y: "100%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="container-site flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="text-[13px] leading-relaxed text-bone/60">
              אנחנו מודדים תנועה באתר כדי לשפר אותו ולהתאים פרסום. אפשר לכבות בכל רגע.
            </p>
            <div className="flex shrink-0 items-center gap-5">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="inline-flex min-h-11 items-center text-[13px] font-medium text-bone/45 underline-offset-4 transition-colors hover:text-bone hover:underline"
              >
                לכבות מדידה
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-bone px-5 text-[13px] font-medium text-ink transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                הבנתי
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
