/**
 * שכבת הניטור של שליחת הלידים.
 *
 * הקובץ מתחיל בקו תחתון בכוונה: Vercel לא הופכת קבצים כאלה בתיקיית
 * api/ לפונקציה, ולכן זו ספרייה פנימית ולא נתיב שאפשר לקרוא לו מבחוץ.
 *
 * ── למה לא ה-SDK הרשמי של Sentry ──────────────────────────────────
 * @sentry/node בגרסה 10 מושך את כל מחסנית OpenTelemetry: 65MB של
 * תלויות, מתוכן 21MB אצל @opentelemetry, ועוד import-in-the-middle
 * שרושם hook לטעינת מודולים. כל זה כדי לדווח על קומץ שגיאות בחודש,
 * בפונקציה שכל תפקידה הוא POST מהיר של טופס. המחיר האמיתי הוא
 * cold start ארוך יותר בדיוק בבקשה שהגולש ממתין לה.
 *
 * במקום זה אנחנו שולחים ל-Sentry ישירות, דרך ה-envelope API הציבורי
 * שלה. אותו חשבון, אותו dashboard, אותו קיבוץ ל-issues ואותן התראות,
 * בלי אף תלות חדשה. מה שמוותרים עליו הוא איסוף אוטומטי (breadcrumbs,
 * tracing, תפיסת חריגות שלא טופלו), ואת זה ממילא לא רצינו כאן.
 *
 * ── למה גם מייל ישיר וגם Sentry ───────────────────────────────────
 * Sentry מקבצת שגיאות ל-issue, וברירת המחדל שלה היא להתריע על issue
 * חדש בלבד. אם פיירברי נופלת לשלוש שעות, זו שגיאה אחת מבחינתה ולכן
 * מייל אחד, בזמן שבפועל נפלו עשרים לידים נפרדים. Sentry עונה על
 * "מה נשבר", המייל עונה על "למי לחזור עכשיו", ואלה שתי שאלות שונות.
 *
 * ── מה יוצא החוצה ─────────────────────────────────────────────────
 * במייל, שהולך לתיבה של בעל האתר: פרטי הליד המלאים, כדי שאפשר יהיה
 * להרים טלפון מיד. ב-Sentry, שהוא צד שלישי: רק גרסה ממוסכת. שני
 * הערוצים נושאים את אותו leadRef, ולכן אפשר לחבר ביניהם בלי שפרטי
 * אדם יאוחסנו אצל ספק חיצוני.
 *
 * ── משתני סביבה ───────────────────────────────────────────────────
 *   SENTRY_DSN         ה-DSN מ-Sentry. בלעדיו הדיווח ל-Sentry מדולג.
 *   RESEND_API_KEY     מפתח של Resend. בלעדיו המייל מדולג.
 *   ALERT_EMAIL_TO     נמען ההתראות. אפשר כמה, מופרדים בפסיק.
 *   ALERT_EMAIL_FROM   כתובת השולח, על דומיין מאומת ב-Resend.
 *   LEAD_TIMEOUT_MS    תקרת זמן לקריאה לפיירברי. ברירת מחדל 10000.
 *
 * כל אחד מהם אופציונלי. מה שלא מוגדר פשוט לא פועל, והכשל עדיין נרשם
 * ליומן. ניטור שמפיל את הבקשה שהוא אמור לנטר הוא גרוע מאין ניטור,
 * ולכן שום דבר כאן לא זורק החוצה ושום דבר כאן לא משנה את התשובה.
 */

import { createHash } from "node:crypto";

/* ────────────────────────────────────────────────────────────────
 *  תקרת זמן לקריאות לפיירברי
 * ──────────────────────────────────────────────────────────────── */

/*
 * בלי תקרה, קריאה תקועה נבלעת ב-timeout של Vercel עצמה. הפונקציה
 * נהרגת מבחוץ, הקוד כאן לא מגיע לשום catch, ולכן אין לוג, אין דיווח
 * ואין מייל: הליד נעלם בשקט מוחלט. עשר שניות מותירות מרווח נוח מתחת
 * לתקרת הפונקציה, ומספיקות בהרבה לקריאה שבדרך כלל לוקחת פחות משנייה.
 */
export const FIREBERRY_TIMEOUT_MS = Number(process.env.LEAD_TIMEOUT_MS ?? 10_000);

/** נזרקת כשפיירברי לא ענתה בזמן, כדי שהמדווח ידע להפריד תקיעה מנפילה */
export class FireberryTimeoutError extends Error {
  readonly ms: number;
  constructor(ms: number) {
    super(`Fireberry did not respond within ${ms}ms`);
    this.name = "FireberryTimeoutError";
    this.ms = ms;
  }
}

/**
 * fetch לפיירברי עם תקרת זמן.
 *
 * מחזיר בדיוק את מה ש-fetch מחזיר ולא נוגע בפרמטרים, כדי שאפשר יהיה
 * להחליף קריאה קיימת בקריאה הזאת בלי לשנות את ההתנהגות שלה.
 */
export async function fetchFireberry(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(FIREBERRY_TIMEOUT_MS) });
  } catch (error) {
    /* AbortSignal.timeout זורק DOMException בשם TimeoutError, לא Error רגיל */
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new FireberryTimeoutError(FIREBERRY_TIMEOUT_MS);
    }
    throw error;
  }
}

/* ────────────────────────────────────────────────────────────────
 *  זיהוי כישלון לוגי בתוך תשובה שנראית תקינה
 * ──────────────────────────────────────────────────────────────── */

/**
 * מוצא הכרזת כישלון בגוף תשובה שחזרה עם status תקין.
 *
 * פיירברי לא תמיד מתרגמת כישלון ל-status: יש מסלולים שבהם היא מחזירה
 * 200 עם גוף שאומר success: false. הקוד סביב בודק response.ok בלבד,
 * ולכן תשובה כזאת נספרת כהצלחה והליד לא קיים בשום מקום.
 *
 * הבדיקה מכוונת בכוונה צר, רק לדגל בוליאני מפורש. זיהוי לפי "יש מילה
 * error בטקסט" היה מייצר התראות שווא על כל תשובה שמזכירה שדה בשם
 * כזה, והתראה שקורית לשווא מפסיקים לקרוא אחרי שבוע.
 */
const SUCCESS_KEYS = new Set(["success", "issuccess", "ok", "isvalid"]);
const MESSAGE_KEYS = new Set(["message", "errormessage", "error", "errors", "description"]);

export function readLogicalFailure(text: string): string | null {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    /* גוף שאינו JSON הוא כבר תשובה חריגה, אבל לא הכרזת כישלון מפורשת */
    return null;
  }
  return findFailureDeclaration(payload, 0);
}

function findFailureDeclaration(node: unknown, depth: number): string | null {
  if (!node || typeof node !== "object" || depth > 3) return null;

  const entries = Object.entries(node as Record<string, unknown>);
  const declaresFailure = entries.some(
    ([key, value]) => SUCCESS_KEYS.has(key.toLowerCase()) && value === false,
  );

  if (declaresFailure) {
    const message = entries.find(
      ([key, value]) => MESSAGE_KEYS.has(key.toLowerCase()) && value,
    );
    return message ? `${message[0]}: ${stringifyShort(message[1])}` : "success: false";
  }

  for (const [, value] of entries) {
    const found = findFailureDeclaration(value, depth + 1);
    if (found) return found;
  }
  return null;
}

function stringifyShort(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return (text ?? "").slice(0, 300);
}

/* ────────────────────────────────────────────────────────────────
 *  מיסוך פרטי הליד
 * ──────────────────────────────────────────────────────────────── */

export type LeadSnapshot = Record<string, unknown> & {
  fullName?: string;
  phone?: string;
  email?: string;
};

/**
 * מזהה קצר ויציב לליד, שנגזר מהאימייל.
 *
 * זה הקישור בין המייל, שבו הפרטים מלאים, לבין Sentry, שבו הם ממוסכים.
 * בלעדיו אי אפשר לדעת שהתראה במייל ו-issue ב-Sentry מדברים על אותו
 * אדם, ואיתו אין צורך להוציא את הפרטים עצמם החוצה.
 */
export function leadRef(lead: LeadSnapshot): string {
  const seed = String(lead.email ?? lead.phone ?? lead.fullName ?? "unknown").trim().toLowerCase();
  return createHash("sha256").update(seed).digest("hex").slice(0, 8);
}

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${digits.slice(0, 3)}${"*".repeat(digits.length - 6)}${digits.slice(-3)}`;
};

const maskEmail = (value: string) => {
  const at = value.indexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  return `${local.slice(0, Math.min(3, local.length))}***${value.slice(at)}`;
};

const maskName = (value: string) => {
  const parts = value.trim().split(/\s+/);
  return parts.length === 1 ? `${parts[0].slice(0, 1)}.` : `${parts[0]} ${parts[1].slice(0, 1)}.`;
};

/**
 * הגרסה שמותר לשלוח לצד שלישי.
 *
 * שם, טלפון ואימייל ממוסכים. כל שאר השדות (מסלול, מטרה, UTM, מקור)
 * עוברים כמו שהם: הם מתארים כוונת רכישה ולא מזהים אדם, והם בדיוק
 * המידע שעוזר להבין למה השדה הזה נדחה.
 */
export function maskLead(lead: LeadSnapshot): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...lead };
  if (typeof lead.fullName === "string") masked.fullName = maskName(lead.fullName);
  if (typeof lead.phone === "string") masked.phone = maskPhone(lead.phone);
  if (typeof lead.email === "string") masked.email = maskEmail(lead.email);
  return masked;
}

/* ────────────────────────────────────────────────────────────────
 *  שליחה ל-Sentry דרך ה-envelope API
 * ──────────────────────────────────────────────────────────────── */

type Dsn = { envelopeUrl: string; publicKey: string };

let dsnCache: Dsn | null | undefined;

function parseDsn(): Dsn | null {
  if (dsnCache !== undefined) return dsnCache;
  const raw = process.env.SENTRY_DSN;
  if (!raw) return (dsnCache = null);
  try {
    /* צורת ה-DSN: https://<publicKey>@<host>/<projectId> */
    const url = new URL(raw);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) throw new Error("missing key or project id");
    dsnCache = {
      envelopeUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch (error) {
    console.warn("SENTRY_DSN is malformed - skipping Sentry reporting", error);
    dsnCache = null;
  }
  return dsnCache;
}

/**
 * ממיר stack של JavaScript למסגרות בפורמט של Sentry.
 *
 * בלי זה ה-issue מגיע בלי שורת קוד ואי אפשר לדעת מאיפה הוא נזרק.
 * Sentry מצפה לסדר הפוך מזה של JavaScript: הישנה ביותר ראשונה.
 */
const STACK_LINE = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/;

function toFrames(stack: string | undefined) {
  if (!stack) return undefined;
  const frames = stack
    .split("\n")
    .slice(1)
    .map((line) => STACK_LINE.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({
      function: match[1] ?? "<anonymous>",
      filename: match[2],
      abs_path: match[2],
      lineno: Number(match[3]),
      colno: Number(match[4]),
      in_app: !match[2].includes("node_modules"),
    }))
    .reverse();
  return frames.length ? { frames } : undefined;
}

type SentryEvent = {
  level: "error" | "warning";
  message: string;
  fingerprint: string[];
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  error?: unknown;
};

async function sendToSentry(event: SentryEvent): Promise<void> {
  const dsn = parseDsn();
  if (!dsn) return;

  const eventId = createHash("sha256")
    .update(`${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 32);

  const error = event.error instanceof Error ? event.error : undefined;

  const payload = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: event.level,
    logger: "api/lead",
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    server_name: process.env.VERCEL_REGION,
    /*
     * fingerprint מפורש לפי שלב הכשל, כדי שכל סוג תקלה יהיה issue
     * נפרד. בלעדיו Sentry מקבצת לפי ה-stack, וכל הכשלים היו נערמים
     * ל-issue אחד ענק כי כולם נזרקים מאותה שורה.
     */
    fingerprint: event.fingerprint,
    tags: event.tags,
    extra: event.extra,
    ...(error
      ? {
          exception: {
            values: [
              {
                type: error.name || "Error",
                value: error.message,
                stacktrace: toFrames(error.stack),
              },
            ],
          },
        }
      : {}),
    message: { formatted: event.message },
  };

  const body = JSON.stringify(payload);
  const envelope =
    `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() })}\n` +
    `${JSON.stringify({ type: "event", content_type: "application/json", length: Buffer.byteLength(body) })}\n` +
    `${body}\n`;

  const response = await fetch(dsn.envelopeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=gutman-lead-monitor/1.0, sentry_key=${dsn.publicKey}`,
    },
    body: envelope,
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    console.warn("Sentry rejected the event", response.status, (await response.text()).slice(0, 300));
  }
}

/* ────────────────────────────────────────────────────────────────
 *  מייל ההתראה
 * ──────────────────────────────────────────────────────────────── */

const escapeHtml = (value: unknown) =>
  String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

async function sendAlertEmail(subject: string, rows: Array<[string, unknown]>): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.ALERT_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.ALERT_EMAIL_FROM;
  if (!key || !to.length || !from) return;

  /* המייל נקרא בעברית, ולכן הוא RTL. טבלה פשוטה, בלי תלות בתמונות */
  const html = `<div dir="rtl" style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:15px;color:#191919">
<h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(subject)}</h2>
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">
${rows
  .filter(([, value]) => value !== undefined && value !== null && value !== "")
  .map(
    ([label, value], i) =>
      `<tr style="background:${i % 2 ? "#fff" : "#f6f6f4"}"><td style="border:1px solid #e5e5e2;font-weight:600;width:34%">${escapeHtml(label)}</td><td style="border:1px solid #e5e5e2"><pre style="margin:0;white-space:pre-wrap;word-break:break-word;font-family:inherit">${escapeHtml(value)}</pre></td></tr>`,
  )
  .join("\n")}
</table>
<p style="margin-top:16px;color:#6b6b66;font-size:13px">
הפרטים המלאים של הליד שמורים גם ביומן של Vercel, בשורה שמתחילה ב-LEAD_CAPTURE.
</p></div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    console.warn("Resend rejected the alert", response.status, (await response.text()).slice(0, 300));
  }
}

/* ────────────────────────────────────────────────────────────────
 *  נקודת הכניסה
 * ──────────────────────────────────────────────────────────────── */

export type FailureStage =
  /** אין FIREBERRY_TOKEN, ולכן אין לאן להעביר את הליד בכלל */
  | "not_configured"
  /** פיירברי לא ענתה בתוך FIREBERRY_TIMEOUT_MS */
  | "timeout"
  /** הבקשה לא יצאה או לא חזרה: DNS, TLS, רשת */
  | "unreachable"
  /** פיירברי ענתה, עם status שאינו תקין */
  | "http_error"
  /** status תקין, אבל הגוף מכריז על כישלון */
  | "logical_error"
  /** הרשומה נוצרה, אבל לא הוחזר מזהה ולכן השלב השני לא יוכל לעדכן */
  | "no_record_id"
  /** השלמת הפרטים בעמוד התודה נדחתה */
  | "enrich_failed"
  /** מטא-דאטה של השדות לא נטענה, והליד נכנס עם שדות הבסיס בלבד */
  | "field_mapping_failed";

/* כותרת בעברית לכל שלב, לשורת הנושא של המייל */
const STAGE_TITLE: Record<FailureStage, string> = {
  not_configured: "אין מפתח API לפיירברי",
  timeout: "פיירברי לא ענתה בזמן",
  unreachable: "לא הצלחנו להגיע לפיירברי",
  http_error: "פיירברי דחתה את הליד",
  logical_error: "פיירברי החזירה הצלחה אבל הגוף מכריז על כישלון",
  no_record_id: "הליד נכנס אבל בלי מזהה רשומה",
  enrich_failed: "השלמת הפרטים בעמוד התודה נכשלה",
  field_mapping_failed: "מיפוי השדות נכשל, הליד נכנס חלקי",
};

/*
 * הליד עצמו נכנס ל-CRM, רק פחות שלם. נרשם ב-Sentry כדי שתהיה מגמה,
 * בלי מייל: התראה שמגיעה על משהו שלא דורש פעולה מיידית מאמנת את
 * הנמען להתעלם מהתיבה הזאת, ואז גם ההתראות האמיתיות נבלעות.
 */
const SILENT_STAGES = new Set<FailureStage>(["field_mapping_failed"]);

/*
 * שורת הנושא חייבת להיות מדויקת. "ליד לא נכנס" על מקרה שבו הליד כן
 * נכנס הוא בדיוק סוג ההתראה שמלמדת לא לסמוך על ההתראות.
 */
const PARTIAL_STAGES = new Set<FailureStage>(["no_record_id", "enrich_failed"]);

const subjectFor = (stage: FailureStage, title: string) =>
  PARTIAL_STAGES.has(stage)
    ? `ליד נכנס חלקית לפיירברי: ${title}`
    : `ליד לא נכנס לפיירברי: ${title}`;

export type FailureReport = {
  stage: FailureStage;
  lead: LeadSnapshot;
  /** ה-status ש-Fireberry החזירה, אם בכלל הגיעה תשובה */
  status?: number;
  /** גוף התשובה של Fireberry, כפי שהוא */
  responseBody?: string;
  /** החריגה שנתפסה, אם הכשל היה בזריקה ולא בתשובה */
  error?: unknown;
  /** מה בדיוק נשלח לפיירברי, בלי הטוקן שנמצא בכותרות ולא בגוף */
  sentFields?: Record<string, unknown>;
  /** הערות נוספות לשלב הספציפי */
  note?: string;
};

/**
 * מדווח על כשל בשליחת ליד ל-Sentry ובמייל.
 *
 * לא זורק לעולם, ולא משנה שום ערך שחוזר לגולש. אם הניטור עצמו נופל,
 * זה נרשם ליומן והבקשה ממשיכה בדיוק כמו קודם. חייבים להמתין לו לפני
 * שמחזירים תשובה, כי בסביבה serverless המכונה קופאת מיד אחרי
 * ה-response וכל בקשה שלא הספיקה לצאת נעלמת.
 */
export async function reportLeadFailure(report: FailureReport): Promise<void> {
  const { stage, lead, status, responseBody, error, sentFields, note } = report;
  const ref = leadRef(lead);
  const title = STAGE_TITLE[stage];

  try {
    const body = responseBody?.slice(0, 2000);
    const tags: Record<string, string> = {
      stage,
      lead_ref: ref,
      lead_source: String(lead.leadSource ?? "unknown"),
      ...(status !== undefined ? { fireberry_status: String(status) } : {}),
    };

    await Promise.allSettled([
      sendToSentry({
        level: SILENT_STAGES.has(stage) || stage === "no_record_id" ? "warning" : "error",
        message: `Fireberry lead failed at "${stage}": ${title}`,
        /* השלב וה-status מגדירים את ה-issue. אותה תקלה מתקבצת, תקלה אחרת נפרדת */
        fingerprint: ["fireberry-lead", stage, status !== undefined ? String(status) : "no-status"],
        tags,
        extra: {
          note,
          fireberry_status: status,
          fireberry_response: body,
          sent_fields: sentFields ? Object.keys(sentFields) : undefined,
          /* ממוסך. הפרטים המלאים נמצאים במייל וביומן, לא כאן */
          lead: maskLead(lead),
          vercel_deployment: process.env.VERCEL_URL,
        },
        error,
      }),

      SILENT_STAGES.has(stage)
        ? Promise.resolve()
        : sendAlertEmail(subjectFor(stage, title), [
            ["שלב הכשל", `${stage} (${title})`],
            ["הערה", note],
            ["שם", lead.fullName],
            ["טלפון", lead.phone],
            ["אימייל", lead.email],
            ["מסלול", lead.courseInterest],
            ["מקור", lead.leadSource],
            ["status מפיירברי", status],
            ["תשובת פיירברי", body],
            ["שגיאה", error instanceof Error ? `${error.name}: ${error.message}` : error],
            ["שדות שנשלחו", sentFields ? Object.keys(sentFields).join(", ") : undefined],
            ["מזהה ליד לצורך הצלבה מול Sentry", ref],
            ["זמן", new Date().toISOString()],
            ["פריסה", process.env.VERCEL_URL],
          ]),
    ]);
  } catch (monitoringError) {
    /* הניטור נכשל. זה מצער, אבל זו לא סיבה להפיל את הבקשה עצמה */
    console.error("Lead monitoring failed", monitoringError);
  }
}

/** ממיר חריגה שנתפסה לשלב הכשל המתאים לה */
export function stageForThrown(error: unknown): FailureStage {
  return error instanceof FireberryTimeoutError ? "timeout" : "unreachable";
}
