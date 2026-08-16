/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0d0c11",
        bone: "#f2f1ec",
        paper: "#f4f4f2",
        ink: "#191919",
        brand: "#ff5f9e",
        muted: "#6b6b6b",
        dust: "#a5a49c",
        line: "#e3e3df",
      },
      fontFamily: {
        sans: ["Assistant", "Helvetica Neue", "Arial", "sans-serif"],
        heading: ["Assistant", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Rubik", "Assistant", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        pill: "0 1px 2px rgba(25, 25, 25, 0.28), 0 18px 38px -12px rgba(25, 25, 25, 0.42)",
        "pill-lg": "0 2px 4px rgba(25, 25, 25, 0.22), 0 30px 60px -16px rgba(25, 25, 25, 0.5)",
        card: "0 1px 0 rgba(25, 25, 25, 0.04), 0 14px 44px -18px rgba(25, 25, 25, 0.14)",
        "card-hover": "0 2px 0 rgba(25, 25, 25, 0.03), 0 36px 72px -28px rgba(25, 25, 25, 0.28)",
        float: "0 -4px 24px rgba(25, 25, 25, 0.08)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
