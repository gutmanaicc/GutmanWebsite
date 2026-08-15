import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
};

const Counter = ({ value, suffix }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className="inline-flex items-baseline" dir="ltr">
      <span className="tabular-nums">{display}</span>
      {suffix && <span className="text-brand">{suffix}</span>}
    </span>
  );
};

/**
 * רצועת מספרים ענקיים בסגנון orbix. כל הנתונים אמיתיים ומגיעים
 * מאותם מקורות שכבר מוצגים באתר - אין המצאות.
 */
const StatsBand = ({ stats }: { stats: Stat[] }) => (
  <section className="border-y border-line bg-white/60">
    <div className="container-site">
      <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-x-reverse">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 px-6 py-10 text-center sm:py-14">
            <dd className="order-1 text-[clamp(3.25rem,7vw,5.5rem)] font-semibold leading-none tracking-tightest text-ink">
              <Counter value={stat.value} suffix={stat.suffix} />
            </dd>
            <dt className="order-2 mt-3 text-sm font-medium text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

export default StatsBand;
