import { trackStandard } from "../pixel";

export type LeadPayload = {
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  courseInterest: string;
  goal: string;
  experienceLevel?: string;
  audienceType?: string;
  leadSource: string;
  pageUrl: string;
  referrer: string;
  utm: Record<string, string>;
  submittedAt: string;
};

const STORAGE_KEY = "academy-leads-v1";

/** ברירת המחדל היא פונקציית השרת של האתר, שמעבירה את הליד לפיירברי. */
export function getLeadEndpoint(): string {
  return import.meta.env.VITE_LEAD_ENDPOINT?.trim() || "/api/lead";
}

export function collectUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  return utm;
}

function saveLocally(lead: LeadPayload) {
  const existing: LeadPayload[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  existing.push(lead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

async function postOnce(endpoint: string, lead: LeadPayload): Promise<boolean> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`lead endpoint returned ${res.status}`);
  return true;
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
export async function submitLead(lead: LeadPayload): Promise<boolean> {
  const endpoint = getLeadEndpoint();

  try {
    saveLocally(lead);
  } catch {
    /* אחסון מלא או חסום - לא סיבה להפיל את השליחה */
  }

  if (!endpoint) return false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await postOnce(endpoint, lead);
      trackStandard("Lead", {
        content_name: lead.courseInterest,
        content_category: lead.leadSource,
      });
      return true;
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return false;
}
