/**
 * עץ הניווט של הסדנאות הפעילות. סדנאות שבקרוב אינן מופיעות כאן, הן
 * מוצגות רק בעמוד הסדנאות עם כפתור רשימת המתנה.
 */
export type NavTrackChild = {
  slug: string;
  label: string;
  href: string;
};

export type NavTrack = {
  slug: string;
  label: string;
  href: string;
  children?: NavTrackChild[];
};

export const NAV_TRACKS: NavTrack[] = [
  {
    slug: "ai-for-therapists",
    label: "מטפלים ופסיכולוגים",
    href: "/courses/ai-for-therapists",
  },
  {
    slug: "ai-fashion",
    label: "אופנה",
    href: "/courses/ai-fashion",
  },
  {
    slug: "social-media-ai",
    label: "מנהלי סושיאל",
    href: "/courses/social-media-ai",
  },
  {
    slug: "ai-video-content",
    label: "עורכי וידאו ויוצרי תוכן",
    href: "/courses/ai-video-content",
  },
  {
    slug: "ai-for-students",
    label: "סטודנטים",
    href: "/courses/ai-for-students",
  },
];

/** Legacy slug → canonical slug redirects for course pages. */
export const COURSE_SLUG_ALIASES: Record<string, string> = {};
