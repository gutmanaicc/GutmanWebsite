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
 * בלי FIREBERRY_TOKEN הפונקציה עדיין מחזירה הצלחה ורושמת אזהרה, כדי
 * שהטפסים באתר לא ייפלו לפני שהמפתח הוגדר.
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
  /*
   * בדיקת בריאות: GET /api/lead מחזיר האם ההגדרות במקום, בלי לחשוף
   * את המפתח עצמו. עוזר לענות על "הכנסתי את הטוקן, למה זה לא עובד"
   * בלי לנחש - רואים מיד אם המשתנה הגיע לפונקציה.
   */
  if (req.method === "GET") {
    const token = process.env.FIREBERRY_TOKEN ?? "";
    return res.status(200).json({
      ok: true,
      fireberryConfigured: token.length > 0,
      tokenLength: token.length,
      objectType: process.env.FIREBERRY_OBJECT_TYPE ?? "1 (ברירת מחדל)",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const lead: LeadBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};

  if (!lead.fullName || !lead.phone || !lead.email) {
    return res.status(400).json({ ok: false, error: "missing_required_fields" });
  }

  /*
   * ליד לא הולך לאיבוד, בשום מצב.
   *
   * גם כשאין מפתח וגם כשפיירברי נופלת, הליד המלא נרשם ביומן של Vercel
   * בשורה אחת שאפשר לחפש לפי LEAD_CAPTURE. זה לא תחליף ל-CRM, אבל זו
   * הרשת שמתחת: אפשר לשלוף ממנה כל פנייה ולהזין אותה ידנית.
   */
  const audit = (reason: string) =>
    console.log(`LEAD_CAPTURE ${reason} ${JSON.stringify(lead)}`);

  const token = process.env.FIREBERRY_TOKEN;
  if (!token) {
    console.warn("FIREBERRY_TOKEN is not set - lead accepted but not forwarded to Fireberry");
    audit("not_forwarded_no_token");
    return res.status(200).json({ ok: true, forwarded: false });
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
      console.error("Fireberry rejected the lead", response.status, text.slice(0, 500));
      audit("fireberry_rejected");
      return res.status(502).json({ ok: false, error: "fireberry_error", status: response.status });
    }

    return res.status(200).json({ ok: true, forwarded: true });
  } catch (error) {
    console.error("Fireberry request failed", error);
    audit("fireberry_unreachable");
    return res.status(502).json({ ok: false, error: "fireberry_unreachable" });
  }
}
