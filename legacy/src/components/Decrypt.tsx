import { useEffect, useRef, useState } from "react";

// טקסט שמתפענח: תווים מוצפנים מתחלפים ואז מתייצבים, כמו בטיזר.
// נכנס לפעולה כשהאלמנט נגלל לתצוגה. ב-prefers-reduced-motion מוצג הטקסט מיד.

const SCRAMBLE_CHARS = "אבגדהוזחטיכלמנסעפצקרשת01✦#%&";

const rand = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

type Props = {
  text: string;
  /** ms לכל תו; ברירת מחדל 28 */
  speed?: number;
  className?: string;
};

const Decrypt = ({ text, speed = 28, className }: Props) => {
  const [shown, setShown] = useState(0);
  const [scramble, setScramble] = useState("");
  const [started, setStarted] = useState(false);
  const [instant, setInstant] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setInstant(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started || instant) return;
    let i = 0;
    const iv = window.setInterval(() => {
      i++;
      setShown(i);
      const left = Math.min(3, text.length - i);
      setScramble(Array.from({ length: Math.max(0, left) }, rand).join(""));
      if (i >= text.length) {
        window.clearInterval(iv);
        setScramble("");
      }
    }, speed);
    return () => window.clearInterval(iv);
  }, [started, instant, text, speed]);

  const done = instant || shown >= text.length;

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        {instant ? text : text.slice(0, shown)}
        {!done && <span className="decrypt-scramble">{scramble}</span>}
        {!done && started && <span className="decrypt-caret" />}
      </span>
    </span>
  );
};

export default Decrypt;
