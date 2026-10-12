import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const PREVIEW_ROBOTS = "User-agent: *\nDisallow: /\n";
const PRODUCTION_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: https://gutmanai.com/sitemap.xml
`;

/** Indexing is explicitly enabled only for an approved Vercel production build. */
export function academySeoBuild() {
  let approvedProduction = false;
  let outputDirectory;
  return {
    name: "academy-seo-build",
    configResolved(config) {
      approvedProduction = config.command === "build"
        && config.mode === "production"
        && config.env.VITE_ACADEMY_PRODUCTION_APPROVED === "1"
        && process.env.VERCEL_ENV === "production";
      if (config.command === "build") outputDirectory = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      // Source HTML is always safe for preview, including crawlers without JavaScript.
      return html.replace(
        /(<meta name="robots" content=")[^"]*("\s*\/?>)/,
        `$1${approvedProduction ? "index, follow" : "noindex, nofollow"}$2`,
      );
    },
    async closeBundle() {
      if (!outputDirectory) return;
      await writeFile(resolve(outputDirectory, "robots.txt"), approvedProduction ? PRODUCTION_ROBOTS : PREVIEW_ROBOTS);
    },
  };
}
