/**
 * Primary navigation track tree - 4 main tracks; business expands to 3 sub-tracks.
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
    slug: "social-media-ai",
    label: "מנהלי סושיאל",
    href: "/courses/social-media-ai",
  },
  {
    slug: "ai-for-students",
    label: "סטודנטים",
    href: "/courses/ai-for-students",
  },
  {
    slug: "ai-video-content",
    label: "עורכי וידאו ויוצרי תוכן",
    href: "/courses/ai-video-content",
  },
  {
    slug: "ai-business-systems",
    label: "מסלול לבעלי עסקים",
    href: "/courses/ai-business-systems",
    children: BUSINESS_SUBTRACKS,
  },
];

/** Slugs that belong under the business owners parent track. */
export const BUSINESS_SUBTRACK_SLUGS = BUSINESS_SUBTRACKS.map((t) => t.slug);

/** Legacy slug → canonical slug redirects for course pages. */
export const COURSE_SLUG_ALIASES: Record<string, string> = {
  "ai-landing-page": "business-landing-page",
};
