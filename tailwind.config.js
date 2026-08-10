/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f4f2",
        ink: "#191919",
        brand: "#ff5f9e",
        muted: "#6b6b6b",
        line: "#e3e3df",
      },
      fontFamily: {
        sans: ["Tahoma", "Arial", "sans-serif"],
        heading: ["Tahoma", "Arial", "sans-serif"],
        serif: ["Tahoma", "Arial", "sans-serif"],
      },
      boxShadow: {
        pill: "0 12px 40px -12px rgba(25, 25, 25, 0.35)",
        card: "0 1px 0 rgba(25, 25, 25, 0.06), 0 8px 32px -8px rgba(25, 25, 25, 0.08)",
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
