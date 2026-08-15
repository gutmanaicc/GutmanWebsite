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

export const BUSINESS_SUBTRACKS: NavTrackChild[] = [
  {
    slug: "business-crm",
    label: "בניית מערכת CRM",
    href: "/courses/business-crm",
  },
  {
    slug: "business-payments",
    label: "מערכת למעקב תשלומים",
    href: "/courses/business-payments",
  },
  {
    slug: "business-landing-page",
    label: "בניית דף נחיתה",
    href: "/courses/business-landing-page",
  },
];

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

/** Slugs that belong under the business owners parent track. */
export const BUSINESS_SUBTRACK_SLUGS = BUSINESS_SUBTRACKS.map((t) => t.slug);

/** Legacy slug → canonical slug redirects for course pages. */
export const COURSE_SLUG_ALIASES: Record<string, string> = {
  "ai-landing-page": "business-landing-page",
};
