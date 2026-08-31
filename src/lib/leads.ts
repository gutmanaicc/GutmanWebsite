import { LEAD_TRACKS } from "../data/courses";
import { track, trackStandard } from "../pixel";

export type LeadPayload = {
  fullName: string;
  phone: string;
  email: string;
  occupation?: string;
  courseInterest: string;
  /** שם המסלול בעברית. אם לא נשלח, נגזר מהסלאג */
  courseInterestLabel?: string;
  goal?: string;
  experienceLevel?: string;
  experienceLevelLabel?: string;
  /** האם סומנה תיבת ההסכמה בטופס */
  consent?: boolean;
  /** איזה טופס נשלח: הרשמה או רשימת המתנה */
  formType?: string;
  leadSource: string;
  pageUrl: string;
  referrer: string;
  utm: Record<string, string>;
  submittedAt: string;
};

/**
 * מה שמחזירה שליחת ליד.
 *
 * לא רק "הצליח". השלב השני של הטופס יושב בעמוד התודה וצריך לעדכן את
 * אותה רשומה ב-CRM ולא לפתוח חדשה, ולכן המזהה שחוזר מהשרת הוא החלק
 * החשוב כאן. בלעדיו כל השלמת פרטים הייתה יוצרת כפילות ברשומות.
 */
export type LeadResult = {
  ok: boolean;
  /** מזהה הרשומה שנפתחה בפיירברי, כשהשרת הצליח לזהות אותו */
  leadId?: string;
};

/** הפרטים שנאספים בשלב השני, בעמוד התודה */
export type LeadEnrichment = {
  leadId?: string;
  fullName: string;
  email: string;
  occupation?: string;
  courseInterest?: string;
  courseInterestLabel?: string;
  goal?: string;
  experienceLevel?: string;
  experienceLevelLabel?: string;
  leadSource: string;
};

/**
 * רמות הניסיון. יושבות כאן ולא בתוך הטופס כדי שגם השליחה ל-CRM
 * תוכל לתרגם את הערך לתווית העברית שלו, מאותו מקור אחד.
 */
export const EXPERIENCE_OPTIONS = [
  { value: "none", label: "עוד לא התנסיתי" },
  { value: "basic", label: "משתמש/ת מדי פעם" },
  { value: "regular", label: "משתמש/ת באופן קבוע" },
  { value: "advanced", label: "מתקדם/ת, בונה תהליכים בעצמי" },
] as const;

/**
 * התווית של "עדיין מתלבט/ת".
 *
 * מיוצאת כדי שגם הטופס וגם השליחה ל-CRM ישתמשו באותו מחרוזת אחת.
 * הערך הזה חייב להיות זהה לתו לערך שברשימת "מסלול" בפיירברי, אחרת
 * ההתאמה נכשלת והשדה נשמט בשקט.
 */
export const UNSURE_LABEL = "עדיין מתלבט/ת, אשמח להכוונה";

/**
 * הופך סלאג של מסלול לשם קריא.
 * בפיירברי רוצים לראות "אופנה", לא "ai-fashion".
 *
 * הסלאג הוא מקור האמת ולא התווית שהקומפוננטה העבירה. WaitlistModal
 * שלח את כותרת הסדנה המלאה ("בינה מלאכותית באופנה. מהשראה לקמפיין
 * מוגמר"), ולערך כזה אין מקבילה ברשימת "מסלול" בפיירברי, ולכן כל ליד
 * מרשימת המתנה היה נשמט בשקט. תווית מפורשת נשארת רק כגיבוי לסלאג
 * שלא מופיע ברשימת המסלולים.
 */
/**
 * אפשרויות בורר המסלול, כולל "עדיין מתלבט/ת".
 *
 * כאן ולא בתוך הטופס, כי מאז שהטופס פוצל לשני שלבים הבורר מופיע גם
 * בטופס ההרשמה (כשהמסלול ידוע מראש) וגם בהשלמת הפרטים בעמוד התודה.
 */
export const TRACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  ...LEAD_TRACKS.map((t) => ({ value: t.slug, label: t.label })),
  { value: "unsure", label: UNSURE_LABEL },
];

export function courseLabel(slug: string, provided?: string): string {
  if (!slug) return provided ?? "";
  if (slug === "unsure") return UNSURE_LABEL;
  return LEAD_TRACKS.find((t) => t.slug === slug)?.label ?? provided ?? slug;
}

export function experienceLabel(value: string): string {
  if (!value) return "";
  return EXPERIENCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const STORAGE_KEY = "academy-leads-v1";

/** ברירת המחדל היא פונקציית השרת של האתר, שמעבירה את הליד לפיירברי. */
export function getLeadEndpoint(): string {
  return import.meta.env.VITE_LEAD_ENDPOINT?.trim() || "/api/lead";
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_STORAGE_KEY = "gutman-utm";

function utmFromUrl(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  return utm;
}

/**
 * תופס את ה-UTM בטעינה הראשונה ושומר אותו לאורך הביקור.
 *
 * בלי זה הייחוס נשבר: ה-SPA לא נושא את הפרמטרים בניווט פנימי, ו-
 * collectUtm רץ רק ברגע שליחת הטופס. גולשת שנחתה מהמודעה, לחצה על
 * לינק אחד באתר ואז נרשמה, הגיעה ל-CRM בלי שום UTM. מה שלא נתפס
 * ברגע הנחיתה לא ניתן לשחזור בדיעבד.
 *
 * sessionStorage ולא localStorage בכוונה: הייחוס תקף לביקור הזה
 * בלבד. ב-localStorage קליק על מודעה מלפני חודשיים היה נדבק להרשמה
 * אורגנית לגמרי ומנפח את ביצועי הקמפיין.
 *
 * כתובת שנושאת UTM דורסת את מה שנשמר, כי היא קליק חדש על מודעה.
 * כתובת בלי UTM לא מוחקת, כי היא בדרך כלל ניווט פנימי.
 */
export function captureUtm() {
  try {
    const fromUrl = utmFromUrl();
    if (Object.keys(fromUrl).length > 0) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    }
  } catch {
    /* אחסון חסום או מלא. עדיף ייחוס חלקי מאשר להפיל את טעינת האתר */
  }
}

export function collectUtm(): Record<string, string> {
  const fromUrl = utmFromUrl();
  if (Object.keys(fromUrl).length > 0) return fromUrl;

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveLocally(lead: LeadPayload) {
  const existing: LeadPayload[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  existing.push(lead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

async function postOnce(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`lead endpoint returned ${res.status}`);
  /* גוף התשובה נושא את מזהה הרשומה. תשובה שלא נקראת כ-JSON היא עדיין הצלחה */
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

/**
 * שולח ליד לשרת, ומדווח בכנות אם הוא הגיע.
 *
 * הגרסה הקודמת החזירה "הצלחה" גם כשהשליחה נכשלה, אחרי ששמרה עותק
 * ב-localStorage של הגולש. זה נראה תקין למשתמש אבל הליד נשאר תקוע
 * בדפדפן שלו ולא הגיע לאף אחד. עכשיו מנסים פעמיים, ואם באמת לא
 * הצלחנו - הטופס אומר את זה ומציע דרך יצירת קשר חלופית.
 *
 * הגיבוי המקומי נשמר בכל מקרה, כדי שאפשר יהיה לשחזר ליד שאבד.
 */
export async function submitLead(lead: LeadPayload): Promise<LeadResult> {
  const endpoint = getLeadEndpoint();

  /*
   * משלימים את התוויות בעברית לפני השליחה, כדי שכל שדה בפיירברי
   * יגיע כבר קריא ולא כקוד פנימי של האתר.
   */
  const payload: LeadPayload = {
    ...lead,
    courseInterestLabel: courseLabel(lead.courseInterest, lead.courseInterestLabel),
    experienceLevelLabel:
      lead.experienceLevelLabel || experienceLabel(lead.experienceLevel ?? ""),
  };

  try {
    saveLocally(payload);
  } catch {
    /* אחסון מלא או חסום - לא סיבה להפיל את השליחה */
  }

  if (!endpoint) return { ok: false };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const body = await postOnce(endpoint, payload);
      trackStandard("Lead", {
        content_name: payload.courseInterestLabel || payload.courseInterest,
        content_category: payload.leadSource,
      });
      const leadId = typeof body.leadId === "string" ? body.leadId : undefined;
      return { ok: true, leadId };
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return { ok: false };
}

/* ── השלב השני: השלמת פרטים בעמוד התודה ───────────────────────────── */

/**
 * הכרטיס שעובר מהטופס לעמוד התודה.
 *
 * הוא נשמר גם ב-sessionStorage וגם ב-state של הניווט, כי אף אחד
 * מהשניים לא מספיק לבדו: ה-state נמחק ברענון של עמוד התודה, ו-
 * sessionStorage לבדו לא יודע להבחין בין מי שהרגע נרשם לבין מי
 * שהקליד /thank-you בכתובת. שניהם יחד נותנים טופס השלמה שמופיע רק
 * למי שבאמת השאיר פרטים, וששורד רענון.
 *
 * sessionStorage ולא localStorage, מאותה סיבה כמו ב-UTM: הכרטיס תקף
 * לביקור הזה. אימייל נשמר כדי שאפשר יהיה לזהות השלמה שהגיעה בלי
 * מזהה רשומה ולחבר אותה ידנית לליד הנכון.
 */
export type LeadTicket = {
  leadId?: string;
  fullName: string;
  email: string;
  courseInterest: string;
  /** מה שכבר נמסר בשלב הראשון, כדי שלא נבקש אותו שוב */
  goal?: string;
  leadSource: string;
  at: number;
};

const TICKET_KEY = "gutman-lead-ticket";

/*
 * חצי שעה. אחריה הכרטיס כבר לא מייצג "הרגע נרשמתי", והצגת טופס
 * השלמה למי שחזר לעמוד התודה מאוחר יותר רק מבלבלת.
 */
const TICKET_TTL = 30 * 60 * 1000;

export function saveLeadTicket(ticket: Omit<LeadTicket, "at">) {
  try {
    sessionStorage.setItem(TICKET_KEY, JSON.stringify({ ...ticket, at: Date.now() }));
  } catch {
    /* אחסון חסום. השלב השני פשוט לא ישרוד רענון */
  }
}

export function readLeadTicket(): LeadTicket | null {
  try {
    const raw = sessionStorage.getItem(TICKET_KEY);
    if (!raw) return null;
    const ticket = JSON.parse(raw) as LeadTicket;
    if (!ticket?.fullName || Date.now() - ticket.at > TICKET_TTL) return null;
    return ticket;
  } catch {
    return null;
  }
}

export function clearLeadTicket() {
  try {
    sessionStorage.removeItem(TICKET_KEY);
  } catch {
    /* אחסון חסום */
  }
}

/**
 * שולח את הפרטים הנוספים שנאספו בעמוד התודה.
 *
 * זו לא שליחת ליד חדש אלא עדכון של הרשומה שכבר נפתחה, ולכן היא
 * נושאת את leadId. בלי המזהה השרת רושם את הפרטים ליומן במקום לפתוח
 * רשומה שנייה: כפילות ב-CRM יקרה יותר מהשלמה שמחכה לחיבור ידני.
 */
export async function submitLeadEnrichment(details: LeadEnrichment): Promise<boolean> {
  const endpoint = getLeadEndpoint();
  if (!endpoint) return false;

  const payload = {
    mode: "enrich" as const,
    ...details,
    courseInterestLabel: details.courseInterest
      ? courseLabel(details.courseInterest, details.courseInterestLabel)
      : details.courseInterestLabel,
    experienceLevelLabel:
      details.experienceLevelLabel || experienceLabel(details.experienceLevel ?? ""),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await postOnce(endpoint, payload);
      track("LeadDetails", {
        content_name: payload.courseInterestLabel || payload.courseInterest,
        content_category: payload.leadSource,
      });
      return true;
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return false;
}
