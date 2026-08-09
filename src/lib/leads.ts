// שכבת שליחת לידים.
// כרגע אין Backend מחובר, ולכן הלידים נשמרים מקומית (localStorage) ונרשמים לפיקסל.
// כדי לחבר יעד אמיתי (CRM / Google Sheets / אימייל / אוטומציה):
//   1. הגדירו את LEAD_ENDPOINT לכתובת Webhook או API (למשל Make / Zapier / Google Apps Script).
//   2. הפונקציה תשלח לשם POST עם JSON של הליד ותפסיק להסתמך על השמירה המקומית בלבד.
// עד שאין Endpoint, הטופס מציג למשתמש הודעה כנה: "הפרטים נקלטו ונחזור אליכם" רק אחרי שמירה שהצליחה.

import { track } from "../pixel";

// Webhook של Make (חשבון GutmanAI): תרחיש "Gutman Academy: ליד מהאתר אל Fireberry".
// ה-webhook קולט את הליד ושומר אותו בתור; התרחיש דוחף ל-Fireberry.
export const LEAD_ENDPOINT = "https://hook.us2.make.com/dpq1djvtml118alux9q4byalyjnrhzc4";

export type LeadPayload = {
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  courseInterest: string; // slug של מסלול או "unsure"
  goal: string;
  experienceLevel?: string;
  audienceType?: string; // סטודנט / בעל עסק / איש מקצוע
  // מידע סמוי
  leadSource: string;
  pageUrl: string;
  referrer: string;
  utm: Record<string, string>;
  submittedAt: string;
};

const STORAGE_KEY = "academy-leads-v1";

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

/**
 * שולח ליד. מחזיר true אם הליד נקלט (בשרת או מקומית), false אם נכשל.
 */
export async function submitLead(lead: LeadPayload): Promise<boolean> {
  try {
    if (LEAD_ENDPOINT) {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error(`lead endpoint returned ${res.status}`);
    } else {
      // אין יעד חיצוני עדיין: שמירה מקומית כדי שהליד לא יאבד בפיתוח
      saveLocally(lead);
    }
    track("Lead", { course: lead.courseInterest, source: lead.leadSource });
    return true;
  } catch {
    // ניסיון גיבוי מקומי גם אם השרת נכשל
    try {
      saveLocally(lead);
      return true;
    } catch {
      return false;
    }
  }
}
