#!/usr/bin/env node
/**
 * בדיקת חיבור לפיירברי - מריצים פעם אחת לפני העלייה לאוויר.
 *
 * הסקריפט לא שומר את המפתח בשום מקום ולא שולח אותו לאף אחד חוץ
 * מפיירברי עצמה. הוא עונה על שלוש שאלות:
 *
 *   1. המפתח תקף?
 *   2. אילו סוגי רשומות קיימים בחשבון, ומה המספר של כל אחד?
 *   3. אילו שדות יש ברשומה שאליה נכתוב, ואיך הם נקראים בדיוק?
 *
 * ואז, אם מבקשים, הוא פותח ליד בדיקה אמיתי כדי לוודא שהכתיבה עובדת.
 *
 * שימוש:
 *   FIREBERRY_TOKEN=xxxx node scripts/fireberry-check.mjs
 *   FIREBERRY_TOKEN=xxxx node scripts/fireberry-check.mjs --object 1
 *   FIREBERRY_TOKEN=xxxx node scripts/fireberry-check.mjs --object 1 --create-test-lead
 */

const BASE = "https://api.fireberry.com";
const token = process.env.FIREBERRY_TOKEN;

if (!token) {
  console.error("חסר FIREBERRY_TOKEN.\n  FIREBERRY_TOKEN=xxxx node scripts/fireberry-check.mjs");
  process.exit(1);
}

const args = process.argv.slice(2);
const objectType = (() => {
  const i = args.indexOf("--object");
  return i >= 0 ? args[i + 1] : null;
})();
const createTestLead = args.includes("--create-test-lead");

const headers = { "Content-Type": "application/json", Accept: "application/json", tokenid: token };

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 400);
  }
  return { ok: res.ok, status: res.status, data };
}

const line = (s = "") => console.log(s);
const head = (s) => line(`\n${"=".repeat(60)}\n${s}\n${"=".repeat(60)}`);

/* --- 1. האם המפתח תקף, ואילו אובייקטים קיימים --------------------- */
head("1. סוגי הרשומות בחשבון");

/* פיירברי שינתה נתיבי מטא-דאטה לאורך השנים, ולכן מנסים כמה */
const OBJECT_PATHS = ["/metadata/records", "/api/metadata/records", "/metadata/objects"];
let objects = null;
for (const path of OBJECT_PATHS) {
  const res = await call("GET", path);
  if (res.ok) {
    objects = res.data;
    line(`נמצא ב-${path}`);
    break;
  }
  line(`  ${path} -> ${res.status}`);
}

if (!objects) {
  line("\nלא הצלחנו לקרוא את רשימת האובייקטים.");
  line("אם הסטטוס היה 401, המפתח לא תקף. אם 403, אין לו הרשאת מטא-דאטה.");
} else {
  const rows = Array.isArray(objects) ? objects : (objects.data ?? objects.value ?? []);
  if (Array.isArray(rows) && rows.length) {
    for (const o of rows) {
      const num = o.objectType ?? o.objecttype ?? o.id;
      const name = o.name ?? o.systemName ?? o.label ?? "";
      const label = o.displayName ?? o.collectionName ?? "";
      line(`  ${String(num).padStart(4)}  ${String(name).padEnd(24)} ${label}`);
    }
  } else {
    line(JSON.stringify(objects, null, 1).slice(0, 2000));
  }
}

/* --- 2. שדות האובייקט שאליו נכתוב --------------------------------- */
if (objectType) {
  head(`2. השדות של אובייקט ${objectType}`);
  const FIELD_PATHS = [
    `/metadata/records/${objectType}/fields`,
    `/api/metadata/records/${objectType}/fields`,
  ];
  let fields = null;
  for (const path of FIELD_PATHS) {
    const res = await call("GET", path);
    if (res.ok) {
      fields = res.data;
      line(`נמצא ב-${path}`);
      break;
    }
    line(`  ${path} -> ${res.status}`);
  }
  if (fields) {
    const rows = Array.isArray(fields) ? fields : (fields.data ?? fields.value ?? []);
    for (const f of rows) {
      const name = f.fieldName ?? f.systemName ?? f.name;
      const label = f.label ?? f.displayName ?? "";
      const required = f.isRequired ?? f.required ? "  ** חובה **" : "";
      line(`  ${String(name).padEnd(28)} ${String(label).padEnd(28)}${required}`);
    }
  }
} else {
  line("\nכדי לראות את השדות, הריצו שוב עם --object <מספר>");
}

/* --- 3. כתיבת ליד בדיקה ------------------------------------------- */
if (createTestLead && objectType) {
  head("3. פתיחת ליד בדיקה");
  const stamp = new Date().toISOString();
  const body = {
    accountname: `בדיקת חיבור מהאתר ${stamp}`,
    telephone1: "050-0000000",
    emailaddress1: "test@gutmanai.com",
    description: `רשומת בדיקה אוטומטית שנוצרה על ידי scripts/fireberry-check.mjs בתאריך ${stamp}. אפשר למחוק.`,
  };
  line("שולחים:");
  line(JSON.stringify(body, null, 1));
  const res = await call("POST", `/api/record/${objectType}`, body);
  line(`\nסטטוס: ${res.status}`);
  line(JSON.stringify(res.data, null, 1).slice(0, 1200));
  if (res.ok) {
    line("\nהצליח. בדקו בפיירברי שהרשומה נפתחה, ואז מחקו אותה.");
  } else {
    line("\nנכשל. השדות למעלה הם המקור לאמת - נעדכן את api/lead.ts לפיהם.");
  }
} else if (objectType) {
  line("\nכדי לוודא גם כתיבה, הריצו שוב עם --create-test-lead");
}

line();
