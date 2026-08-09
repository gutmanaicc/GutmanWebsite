import { chromium } from "playwright";
const BASE = "http://localhost:4173";
const ROUTES = ["/", "/courses", "/courses/social-media-ai", "/courses/ai-for-therapists",
  "/courses/fashion-ai-lab", "/courses/ai-crm", "/course-finder", "/about", "/results",
  "/faq", "/contact", "/thank-you", "/privacy", "/terms", "/coming-soon", "/xxx"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
let failures = 0;
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  await ctx.route("**fonts.googleapis.com**", r => r.abort());
  await ctx.route("**fonts.gstatic.com**", r => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(320);
    const h1s = await page.locator("h1").count();
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (h1s !== 1 || hscroll > 1) { failures++; console.log(`FAIL [${vp.w}] ${route}: h1=${h1s} hscroll=${hscroll}`); }
  }
  if (errors.length) { failures++; console.log(`JS [${vp.w}]:`, errors.slice(0, 3)); }
  await ctx.close();
}
await browser.close();
console.log(failures ? failures + " FAILURES" : "ALL OK");
