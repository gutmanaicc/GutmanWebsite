import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { academySeoBuild } from "./scripts/academy-seo-build.mjs";

// VITE_SINGLE_FILE=1 בונה חבילה אחת בלי code-splitting, לתצוגה מקדימה עצמאית.
const single = process.env.VITE_SINGLE_FILE === "1";

export default defineConfig({
  plugins: [react(), academySeoBuild()],
  server: { host: "0.0.0.0", port: 5173, proxy: { "/api/academy": process.env.ACADEMY_API_ORIGIN || "http://127.0.0.1:5174" } },
  build: single
    ? { cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } }
    : {},
});
