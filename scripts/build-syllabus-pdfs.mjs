#!/usr/bin/env node
/**
 * מייצר קובץ PDF מעוצב לכל סדנה מתוך עמוד הסילבוס באתר.
 *
 * למה קובץ ולא window.print():
 * הכפתור הקודם קרא ל-window.print(). בדפדפנים מוטמעים - אינסטגרם,
 * פייסבוק, ווטסאפ - הקריאה הזו פשוט לא עושה כלום, וזה בדיוק המקום
 * שממנו מגיעה רוב התנועה. עכשיו יש קובץ אמיתי שאפשר להוריד, לשמור
 * ולשלוח הלאה מכל מכשיר.
 *
 * הרצה (מצריכה שרת מקומי על 4173):
 *   npm run build && npx vite preview --port 4173 &
 *   node scripts/build-syllabus-pdfs.mjs
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PDF_BASE ?? "http://127.0.0.1:4173";
const OUT_DIR = path.resolve("public/syllabus");
const CHROME = process.env.PLAYWRIGHT_CHROMIUM ?? undefined;

/** חייב להישאר תואם ל-MARKETING_SYLLABI שב-src/data/syllabi.ts */
const SLUGS = [
  "ai-for-therapists",
  "ai-fashion",
  "social-media-ai",
  "ai-video-content",
  "ai-for-students",
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const page = await browser.newPage();

for (const slug of SLUGS) {
  const url = `${BASE}/syllabus/${slug}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  /* הכותרת מגיעה מהעמוד עצמו, כדי שהקובץ ייקרא כמו הסדנה */
  const title = (await page.locator("h1").first().textContent())?.trim() ?? slug;

  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);

  const file = path.join(OUT_DIR, `${slug}.pdf`);
  await page.pdf({
    path: file,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
  });

  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`${slug.padEnd(20)} ${String(kb).padStart(5)} KB   ${title}`);
}

await browser.close();
console.log(`\nנכתבו ${SLUGS.length} קבצים אל ${OUT_DIR}`);
