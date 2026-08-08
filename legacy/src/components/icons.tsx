// אייקוני SVG קטנים במקום גליפים טקסטואליים (✓ ✕ ←) — חדים בכל רזולוציה ועקביים בין דפדפנים

type IconProps = { size?: number };

export const CheckIcon = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const XIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// חץ "המשך" בכיוון RTL (מצביע שמאלה)
export const ArrowIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
