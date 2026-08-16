import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, animate } from "framer-motion";

const SESSION_KEY = "gutman-intro-seen";

/**
 * מסך פתיחה בסגנון אתרי סטודיו: שחור מלא, הלוגו נחשף, מונה רץ ל-100,
 * והמסך מתרומם כמו וילון. פעם אחת לסשן; reduced-motion מדלג לגמרי.
 */
const Preloader = () => {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      setVisible(false);
      return;
    }
    document.body.style.overflow = "hidden";
    const counter = animate(0, 100, {
      duration: 1.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    });
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* private mode */
      }
      setVisible(false);
    }, 1850);
    return () => {
      counter.stop();
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [visible, reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="preloader fixed inset-0 z-[120] flex items-center justify-center bg-[#0a0a0b]"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <motion.img
            src="/brand/logo-cutout.png"
            alt=""
            className="h-12 w-auto sm:h-16"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            draggable={false}
          />
          <span
            className="absolute bottom-8 left-8 text-6xl font-semibold leading-none tracking-tightest text-bone/25 sm:bottom-10 sm:left-12 sm:text-8xl"
            dir="ltr"
          >
            {count}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
