type Props = {
  items: string[];
  className?: string;
};

/**
 * רצועת טקסט נעה בין קווי שיער, בסגנון סטודיו. התוכן מוכפל פעמיים
 * כדי שהלולאה תהיה חלקה; ‎prefers-reduced-motion מקבל פריסה סטטית.
 */
const Marquee = ({ items, className = "" }: Props) => {
  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center gap-14" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="flex items-center gap-14 whitespace-nowrap text-sm font-medium tracking-wide text-ink/70"
        >
          {item}
          <span className="text-brand" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`marquee ${className}`} dir="ltr">
      <div className="marquee-track" dir="rtl">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
};

export default Marquee;
