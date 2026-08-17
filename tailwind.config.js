/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0d0c11",
        /*
         * סולם משטחים כהים: ככל שהמספר עולה, המשטח מורם יותר מהקנבס.
         *
         * קודם כל קומפוננטה בחרה לעצמה הקס משלה - ‎#141317, ‎#131215,
         * ‎#141318, ‎#141416, ‎#141319 - הבדלים שאי אפשר לראות אבל שמנעו
         * כל אפשרות לשנות עומק במקום אחד.
         */
        surface: {
          1: "#131217",
          2: "#191820",
          3: "#211f29",
        },
        bone: "#f2f1ec",
        paper: "#f4f4f2",
        ink: "#191919",
        /* ורוד אחד לכל האתר. קודם היו שניים: הטוקן הזה היה #ff5f9e (ורד רך)
           בזמן ש-#FF2D85 (מגנטה חם) מקודד קשיח בעשרות מקומות, ושניהם הופיעו
           בתוך אותן קומפוננטות. המגנטה ניצח כי הוא היה הרוב המוחלט. */
        brand: "#FF2D85",
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
      /*
       * צללים מחושבים משחור ולא מ"דיו" (#191919).
       *
       * הערכים הקודמים נבנו לקנבס בהיר. על קנבס #0d0c11 צל של
       * rgba(25,25,25,0.14) פשוט לא נראה, ולכן לכרטיסים לא הייתה שום
       * תחושת הרמה מהרקע.
       */
      boxShadow: {
        pill: "0 1px 2px rgba(0, 0, 0, 0.5), 0 18px 38px -12px rgba(0, 0, 0, 0.65)",
        "pill-lg": "0 2px 4px rgba(0, 0, 0, 0.5), 0 30px 60px -16px rgba(0, 0, 0, 0.7)",
        card: "0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 18px 44px -18px rgba(0, 0, 0, 0.75)",
        "card-hover": "0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 36px 72px -24px rgba(0, 0, 0, 0.85)",
        float: "0 -4px 24px rgba(0, 0, 0, 0.5)",
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
