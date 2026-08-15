import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_SINGLE_FILE=1 בונה חבילה אחת בלי code-splitting, לתצוגה מקדימה עצמאית.
const single = process.env.VITE_SINGLE_FILE === "1";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: single
    ? { cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } }
    : {},
});
