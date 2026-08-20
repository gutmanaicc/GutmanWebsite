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
 *   FIREBERRY_FIELD_MAP     JSON אופציונלי שכופה שיוך שדות ידני, למשל
 *                           {"courseInterest":"pcfXXXX","goal":"pcfYYYY"}
 *   LEAD_DIAG_KEY           סיסמה לדוח שיוך השדות, דרך
 *                           GET /api/lead?meta=1&key=...
 *
 * בלי FIREBERRY_TOKEN הפונקציה מחזירה 503, והאתר מציג למשתמש את מסלולי
 * הגיבוי (טלפון ומייל) במקום לומר לו שקיבלנו את הפרטים. כדי לקבל את
 * ההתנהגות הסלחנית הישנה, בתצוגה מקדימה למשל, מגדירים במפורש:
 *
 *   ALLOW_UNCONFIGURED_LEADS=1
 *
 * ── איך שדות הטופס מגיעים לפיירברי ────────────────────────────────
 * שם, טלפון ואימייל נכנסים לשדות הסטנדרטיים. כל שאר שדות הטופס
 * (מסלול, עיסוק, מטרה, רמת ניסיון, מקור, UTM, הסכמה, תאריך) מחפשים
 * לעצמם שדה מתאים בפיירברי לפי השם שלו: הפונקציה קוראת את מבנה
 * האובייקט מ-API המטא-דאטה ומשייכת לפי שם השדה בעברית.
 *
 * המשמעות: כדי שהשדות יתמלאו, יוצרים אותם פעם אחת בפיירברי באחד
 * השמות שברשימת FIELD_ALIASES למטה. אין צורך לגעת בקוד.
 *
 * שדה שלא נמצא לו מקום לא הולך לאיבוד - הוא נשאר בהערה שנכנסת
 * ל-description, בדיוק כמו קודם.
 */

const FIREBERRY_BASE = "https://api.fireberry.com";

type LeadBody = {
  fullName?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  courseInterest?: string;
  courseInterestLabel?: string;
  goal?: string;
  experienceLevel?: string;
  experienceLevelLabel?: string;
  audienceType?: string;
  consent?: boolean;
  formType?: string;
  leadSource?: string;
  pageUrl?: string;
  referrer?: string;
  utm?: Record<string, string>;
  submittedAt?: string;
};

/**
 * לכל שדה בטופס - השמות שהוא מוכן להיקשר אליהם בפיירברי.
 * הראשון ברשימה הוא השם המומלץ ליצירת השדה.
 */
const FIELD_ALIASES: Record<string, string[]> = {
  courseInterest: ["מסלול מבוקש", "מסלול", "סדנה", "סדנה מבוקשת", "קורס", "מסלול מעניין"],
  occupation: ["תחום עיסוק", "עיסוק", "תחום עיסוק או לימודים", "מקצוע", "occupation"],
  goal: ["מה רוצים להשיג", "מטרה", "יעד", "מה הייתם רוצים להשיג", "goal"],
  experienceLevel: ["רמת ניסיון", "רמת ניסיון ב-AI", "ניסיון", "experience"],
  leadSource: ["מקור הליד", "מקור", "מקור פנייה", "מקור פניה", "lead source", "source"],
  formType: ["סוג טופס", "טופס", "form type"],
  consent: ["אישור דיוור", "הסכמה", "אישור יצירת קשר", "consent"],
  pageUrl: ["עמוד מקור", "כתובת עמוד", "עמוד", "page url"],
  referrer: ["הפניה", "מאיפה הגיע", "referrer"],
  utm_source: ["utm source", "מקור קמפיין"],
  utm_medium: ["utm medium", "מדיום קמפיין"],
  utm_campaign: ["utm campaign", "קמפיין"],
  utm_term: ["utm term"],
  utm_content: ["utm content"],
  submittedAt: ["תאריך פנייה", "תאריך פניה", "נשלח ב", "תאריך שליחה"],
};

/** השוואת שמות סלחנית: בלי רווחים, מקפים, ניקוד או אותיות רישיות */
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

type FbField = { name: string; label: string };

/* המטא-דאטה כמעט לא משתנה, ולכן נשמרת בזיכרון הפונקציה לרבע שעה */
let schemaCache: { at: number; map: Record<string, string> } | null = null;
const SCHEMA_TTL = 15 * 60 * 1000;
const optionCache = new Map<string, Array<{ label: string; value: unknown }> | null>();

async function fbGet(path: string, token: string): Promise<any | null> {
  try {
    const res = await fetch(`${FIREBERRY_BASE}${path}`, {
      headers: { Accept: "application/json", tokenid: token },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** מוציא מערך שדות מכל אחת מהצורות שה-API מחזיר */
function readFields(payload: any): FbField[] {
  const raw =
    payload?.data?.fields ??
    payload?.data?.Fields ??
    payload?.fields ??
    (Array.isArray(payload?.data) ? payload.data : null) ??
    (Array.isArray(payload) ? payload : []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f: any) => ({
      name: String(f?.fieldName ?? f?.systemName ?? f?.name ?? ""),
      label: String(f?.label ?? f?.fieldLabel ?? f?.displayName ?? f?.name ?? ""),
    }))
    .filter((f) => f.name);
}

function readOptions(payload: any): Array<{ label: string; value: unknown }> {
  const raw =
    payload?.data?.values ??
    payload?.data?.Values ??
    payload?.values ??
    (Array.isArray(payload?.data) ? payload.data : []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v: any) => ({
      label: String(v?.name ?? v?.label ?? v?.value ?? ""),
      value: v?.valueId ?? v?.value ?? v?.id ?? v?.name,
    }))
    .filter((v) => v.label);
}

function parseOverrides(): Record<string, string> {
  try {
    const parsed = JSON.parse(process.env.FIREBERRY_FIELD_MAP ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    console.warn("FIREBERRY_FIELD_MAP is not valid JSON - ignoring it");
    return {};
  }
}

/**
 * בונה שיוך בין שדות הטופס לשדות האמיתיים בפיירברי.
 * קודם התאמה מדויקת של השם, ורק אחר כך התאמה חלקית, כדי ש"מקור הליד"
 * לא ייחטף בטעות על ידי שדה אחר שהמילה "מקור" מופיעה בתוכו.
 */
async function resolveFieldMap(token: string, objectType: string): Promise<Record<string, string>> {
  const now = Date.now();
  if (schemaCache && now - schemaCache.at < SCHEMA_TTL) return schemaCache.map;

  const payload = await fbGet(`/metadata/records/${objectType}/fields`, token);
  const fields = readFields(payload);
  const map: Record<string, string> = { ...parseOverrides() };

  if (fields.length) {
    const taken = new Set(Object.values(map).map(norm));
    const free = () => fields.filter((f) => !taken.has(norm(f.name)));

    for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
      if (map[key]) continue;
      const wanted = aliases.map(norm);
      const hit = free().find((f) => wanted.includes(norm(f.label)) || wanted.includes(norm(f.name)));
      if (hit) {
        map[key] = hit.name;
        taken.add(norm(hit.name));
      }
    }
    for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
      if (map[key]) continue;
      const wanted = aliases.map(norm).filter((a) => a.length >= 4);
      const hit = free().find((f) => wanted.some((a) => norm(f.label).includes(a)));
      if (hit) {
        map[key] = hit.name;
        taken.add(norm(hit.name));
      }
    }
    schemaCache = { at: now, map };
  } else {
    console.warn("Fireberry field metadata unavailable - falling back to the core fields only");
    /* בלי מטא-דאטה לא שומרים במטמון, כדי שהניסיון הבא ינסה שוב */
  }

  return map;
}

/**
 * שדה בחירה בפיירברי מקבל מזהה ערך ולא טקסט חופשי. אין דגל שאומר
 * מראש אם שדה הוא כזה, ולכן פשוט מנסים למשוך את רשימת הערכים שלו:
 * רשימה ריקה משמעה שדה טקסט רגיל.
 */
async function coerceValue(
  token: string,
  objectType: string,
  fieldName: string,
  value: string,
): Promise<unknown | undefined> {
  const cacheKey = `${objectType}:${fieldName}`;
  if (!optionCache.has(cacheKey)) {
    const payload = await fbGet(
      `/metadata/records/${objectType}/fields/${encodeURIComponent(fieldName)}/values`,
      token,
    );
    const options = readOptions(payload);
    optionCache.set(cacheKey, options.length ? options : null);
  }
  const options = optionCache.get(cacheKey);
  if (!options) return value;

  const hit = options.find((o) => norm(o.label) === norm(value));
  /* אין ערך תואם ברשימה: מוותרים על השדה, הפירוט נשאר בהערה */
  return hit ? hit.value : undefined;
}

/** הערכים של הטופס לפי המפתחות הלוגיים, כפי שהם צריכים להיראות ב-CRM */
function leadValues(lead: LeadBody): Record<string, string> {
  const utm = lead.utm ?? {};
  const values: Record<string, string> = {
    courseInterest: lead.courseInterestLabel || lead.courseInterest || "",
    occupation: lead.occupation ?? "",
    goal: lead.goal ?? "",
    experienceLevel: lead.experienceLevelLabel || lead.experienceLevel || "",
    leadSource: lead.leadSource ?? "",
    formType: lead.formType ?? "",
    consent: lead.consent === undefined ? "" : lead.consent ? "כן" : "לא",
    pageUrl: lead.pageUrl ?? "",
    referrer: lead.referrer ?? "",
    submittedAt: lead.submittedAt ?? "",
    utm_source: utm.utm_source ?? "",
    utm_medium: utm.utm_medium ?? "",
    utm_campaign: utm.utm_campaign ?? "",
    utm_term: utm.utm_term ?? "",
    utm_content: utm.utm_content ?? "",
  };
  for (const key of Object.keys(values)) if (!values[key]) delete values[key];
  return values;
}

/** מרכז את כל מה שלא נכנס לשדה ייעודי לתוך הערה אחת קריאה */
function buildNote(lead: LeadBody): string {
  const utm = lead.utm ?? {};
  const lines = [
    (lead.courseInterestLabel || lead.courseInterest) &&
      `סדנה: ${lead.courseInterestLabel || lead.courseInterest}`,
    lead.goal && `מטרה: ${lead.goal}`,
    lead.occupation && `עיסוק: ${lead.occupation}`,
    (lead.experienceLevelLabel || lead.experienceLevel) &&
      `רמת ניסיון: ${lead.experienceLevelLabel || lead.experienceLevel}`,
    lead.consent !== undefined && `אישור דיוור: ${lead.consent ? "כן" : "לא"}`,
    lead.formType && `סוג טופס: ${lead.formType}`,
    lead.leadSource && `מקור: ${lead.leadSource}`,
    lead.pageUrl && `עמוד: ${lead.pageUrl}`,
    lead.referrer && `הפניה: ${lead.referrer}`,
    Object.keys(utm).length && `UTM: ${JSON.stringify(utm)}`,
    lead.submittedAt && `נשלח: ${lead.submittedAt}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function createRecord(token: string, objectType: string, body: Record<string, unknown>) {
  const response = await fetch(`${FIREBERRY_BASE}/api/record/${objectType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", tokenid: token },
    body: JSON.stringify(body),
  });
  return { ok: response.ok, status: response.status, text: await response.text() };
}

export default async function handler(req: any, res: any) {
  const objectType = process.env.FIREBERRY_OBJECT_TYPE ?? "1";
  const token = process.env.FIREBERRY_TOKEN;

  /*
   * דוח שיוך השדות: מראה איזה שדה בטופס נקשר לאיזה שדה בפיירברי ומה
   * עדיין חסר. הדוח חושף את מבנה ה-CRM, ולכן קיים רק כשמוגדר
   * LEAD_DIAG_KEY ורק עם המפתח הנכון. בלעדיו הנתיב מתנהג כרגיל,
   * כלומר GET הוא פשוט מתודה לא נתמכת.
   */
  if (req.method === "GET" && req.query?.meta) {
    const key = process.env.LEAD_DIAG_KEY;
    if (key && req.query.key === key) {
      if (!token) return res.status(200).json({ ok: false, error: "crm_not_configured" });
      schemaCache = null;
      const map = await resolveFieldMap(token, objectType);
      return res.status(200).json({
        ok: true,
        objectType,
        mapped: map,
        missing: Object.keys(FIELD_ALIASES).filter((k) => !map[k]),
        /* השם המומלץ ליצירת כל שדה שעדיין חסר */
        createAs: Object.fromEntries(Object.entries(FIELD_ALIASES).map(([k, a]) => [k, a[0]])),
      });
    }
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
   * בכל מסלול שבו הליד לא הגיע ל-CRM, הפרטים המלאים נרשמים ליומן של
   * Vercel בשורה אחת שאפשר לחפש לפי LEAD_CAPTURE. זה לא תחליף ל-CRM,
   * אבל זו הרשת שמתחת: אפשר לשלוף ממנה כל פנייה ולהזין אותה ידנית.
   *
   * החזרת שגיאה למשתמש והרישום כאן הם שני דברים נפרדים. השגיאה קיימת
   * כדי לא לשקר לגולש; הרישום קיים כדי שהעסק לא יאבד את הפנייה. בלי
   * הרישום, השבתה של פיירברי הייתה מוחקת כל ליד שהתקבל בזמנה.
   */
  const audit = (reason: string) =>
    console.log(`LEAD_CAPTURE ${reason} ${JSON.stringify(lead)}`);

  if (!token) {
    /*
     * בלי טוקן אין לאן להעביר את הליד, ולכן זו כשלון ולא הצלחה.
     *
     * קודם הוחזר כאן 200, והאתר הציג "קיבלנו, נחזור אליכם" בזמן שהליד
     * נשאר רק ב-localStorage של הגולש ואף אחד לא ידע עליו. השתקה כזו
     * מותרת רק כשמכריזים עליה במפורש דרך ALLOW_UNCONFIGURED_LEADS,
     * למשל בסביבת תצוגה מקדימה.
     */
    audit("not_forwarded_no_token");
    if (process.env.ALLOW_UNCONFIGURED_LEADS === "1") {
      console.warn("FIREBERRY_TOKEN is not set - lead accepted but NOT forwarded (explicitly allowed)");
      return res.status(200).json({ ok: true, forwarded: false });
    }
    console.error("FIREBERRY_TOKEN is not set - refusing to silently drop a lead");
    return res.status(503).json({ ok: false, error: "crm_not_configured" });
  }

  /* שם, טלפון ואימייל תמיד נכנסים. אלה השדות שהרשומה לא שווה בלעדיהם */
  const core: Record<string, unknown> = {
    accountname: lead.fullName,
    telephone1: lead.phone,
    emailaddress1: lead.email,
    description: buildNote(lead),
  };

  const body: Record<string, unknown> = { ...core };
  let extras = 0;

  try {
    const map = await resolveFieldMap(token, objectType);
    for (const [key, value] of Object.entries(leadValues(lead))) {
      const fieldName = map[key];
      if (!fieldName || fieldName in body) continue;
      const coerced = await coerceValue(token, objectType, fieldName, value);
      if (coerced === undefined) continue;
      body[fieldName] = coerced;
      extras += 1;
    }
  } catch (error) {
    console.warn("Field mapping failed - sending the core fields only", error);
  }

  try {
    let result = await createRecord(token, objectType, body);

    /*
     * שדה מותאם אחד שנפסל לא יפיל פנייה אמיתית: מנסים שוב עם השדות
     * הבסיסיים בלבד, שם המידע המלא ממילא נשמר בהערה.
     */
    if (!result.ok && extras > 0) {
      /* מקוצץ: התשובה של פיירברי עלולה להחזיר את הרשומה כולה */
      console.error("Fireberry rejected the mapped record", result.status, result.text.slice(0, 500));
      schemaCache = null;
      optionCache.clear();
      result = await createRecord(token, objectType, core);
      if (result.ok) {
        audit("forwarded_core_only");
        return res.status(200).json({ ok: true, forwarded: true, fields: "core" });
      }
    }

    if (!result.ok) {
      console.error("Fireberry rejected the lead", result.status, result.text.slice(0, 500));
      audit("fireberry_rejected");
      return res.status(502).json({ ok: false, error: "fireberry_error", status: result.status });
    }

    return res.status(200).json({ ok: true, forwarded: true, fields: extras ? "full" : "core" });
  } catch (error) {
    console.error("Fireberry request failed", error);
    audit("fireberry_unreachable");
    return res.status(502).json({ ok: false, error: "fireberry_unreachable" });
  }
}
