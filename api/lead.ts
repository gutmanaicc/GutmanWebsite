/**
 * מקבל ליד מהאתר ופותח לקוח חדש בפיירברי.
 *
 * הפונקציה רצה בצד השרת בלבד, ולכן מפתח ה-API אף פעם לא מגיע לדפדפן.
 * מגדירים אותו במשתני הסביבה של Vercel:
 *
 *   FIREBERRY_TOKEN         מפתח ה-API מפיירברי (חובה)
 *   FIREBERRY_OBJECT_TYPE   סוג הרשומה שנוצרת. ברירת מחדל 1 = לקוחות
 *                           (accounts). אם רוצים לפתוח אנשי קשר במקום,
 *                           מגדירים 2.
 *
 * בלי FIREBERRY_TOKEN הפונקציה מחזירה 503, והאתר מציג למשתמש את מסלולי
 * הגיבוי (טלפון ומייל) במקום לומר לו שקיבלנו את הפרטים. כדי לקבל את
 * ההתנהגות הסלחנית הישנה, בתצוגה מקדימה למשל, מגדירים במפורש:
 *
 *   ALLOW_UNCONFIGURED_LEADS=1
 */

const FIREBERRY_URL = "https://api.fireberry.com/api/record";

type LeadBody = {
  fullName?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  courseInterest?: string;
  goal?: string;
  experienceLevel?: string;
  leadSource?: string;
  pageUrl?: string;
  referrer?: string;
  utm?: Record<string, string>;
  submittedAt?: string;
};

/** מרכז את כל מה שלא נכנס לשדה ייעודי לתוך הערה אחת קריאה */
function buildNote(lead: LeadBody): string {
  const lines = [
    lead.courseInterest && `סדנה: ${lead.courseInterest}`,
    lead.goal && `מטרה: ${lead.goal}`,
    lead.occupation && `עיסוק: ${lead.occupation}`,
    lead.experienceLevel && `רמת ניסיון: ${lead.experienceLevel}`,
    lead.leadSource && `מקור: ${lead.leadSource}`,
    lead.pageUrl && `עמוד: ${lead.pageUrl}`,
    lead.referrer && `הפניה: ${lead.referrer}`,
    lead.utm && Object.keys(lead.utm).length && `UTM: ${JSON.stringify(lead.utm)}`,
    lead.submittedAt && `נשלח: ${lead.submittedAt}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const lead: LeadBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};

  if (!lead.fullName || !lead.phone || !lead.email) {
    return res.status(400).json({ ok: false, error: "missing_required_fields" });
  }

  const token = process.env.FIREBERRY_TOKEN;
  if (!token) {
    /*
     * בלי טוקן אין לאן להעביר את הליד, ולכן זו כשלון ולא הצלחה.
     *
     * קודם הוחזר כאן 200, והאתר הציג "קיבלנו, נחזור אליכם" בזמן שהליד
     * נשאר רק ב-localStorage של הגולש ואף אחד לא ידע עליו. השתקה כזו
     * מותרת רק כשמכריזים עליה במפורש דרך ALLOW_UNCONFIGURED_LEADS,
     * למשל בסביבת תצוגה מקדימה.
     */
    if (process.env.ALLOW_UNCONFIGURED_LEADS === "1") {
      console.warn("FIREBERRY_TOKEN is not set - lead accepted but NOT forwarded (explicitly allowed)");
      return res.status(200).json({ ok: true, forwarded: false });
    }
    console.error("FIREBERRY_TOKEN is not set - refusing to silently drop a lead");
    return res.status(503).json({ ok: false, error: "crm_not_configured" });
  }

  const objectType = process.env.FIREBERRY_OBJECT_TYPE ?? "1";

  try {
    const response = await fetch(`${FIREBERRY_URL}/${objectType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        tokenid: token,
      },
      body: JSON.stringify({
        accountname: lead.fullName,
        telephone1: lead.phone,
        emailaddress1: lead.email,
        description: buildNote(lead),
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Fireberry rejected the lead", response.status, text);
      /* הליד לא אבד: מחזירים שגיאה כדי שהאתר יוכל לשמור גיבוי מקומי */
      return res.status(502).json({ ok: false, error: "fireberry_error", status: response.status });
    }

    return res.status(200).json({ ok: true, forwarded: true });
  } catch (error) {
    console.error("Fireberry request failed", error);
    return res.status(502).json({ ok: false, error: "fireberry_unreachable" });
  }
}
