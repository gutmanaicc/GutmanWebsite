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

export async function submitLead(lead: LeadPayload): Promise<boolean> {
  const endpoint = getLeadEndpoint();

  try {
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error(`lead endpoint returned ${res.status}`);
    } else {
      saveLocally(lead);
    }
    trackStandard("Lead", { content_name: lead.courseInterest, content_category: lead.leadSource });
    return true;
  } catch {
    try {
      saveLocally(lead);
      return true;
    } catch {
      return false;
    }
  }
}
