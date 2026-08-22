import { Component, type ReactNode } from "react";

/**
 * מציל את האתר כשעולה גרסה חדשה בזמן שגולש נמצא בתוכו.
 *
 * הראוטים נטענים ב-lazy, כלומר כל עמוד הוא קובץ נפרד עם חתימה בשם.
 * דיפלוי חדש מחליף את הקבצים בשרת, ומהרגע הזה הדפדפן של מי שכבר נמצא
 * באתר מבקש קבצים של הגרסה הקודמת ומקבל 404. ה-import הדינמי נדחה,
 * React מפרק את העץ, והגולש נשאר מול מסך ריק.
 *
 * זה נצפה בפועל: טופס נשלח בהצלחה, ובאותה דקה בדיוק הסתיים דיפלוי.
 * הליד נכנס ל-CRM, אבל עמוד התודה לא נטען והמסך נשאר שחור.
 *
 * הפתרון היחיד לשגיאה כזאת הוא רענון, כי הקוד שהדפדפן מחזיק כבר לא
 * תואם לשרת. הרענון קורה פעם אחת בלבד, מסומן ב-sessionStorage, כדי
 * ששגיאת טעינה מסיבה אחרת (רשת שנפלה, חוסם פרסומות) לא תיצור לולאת
 * רענונים אינסופית. בפעם השנייה מוצג מסך עם הסבר וכפתור.
 */

const RELOAD_FLAG = "gutman:chunk-reloaded";

/* ההודעות שהדפדפנים מחזירים כשקובץ של ראוט עצל לא נטען */
const isChunkError = (error: unknown) => {
  const message = error instanceof Error ? `${error.message} ${error.name}` : String(error);
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|error loading dynamically imported/i.test(
    message,
  );
};

type Props = { children: ReactNode };
type State = { failed: boolean };

class ChunkReloadBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(error: unknown): State {
    /*
     * שגיאה שאינה שגיאת טעינת קובץ מקבלת גם היא את מסך ההסבר, ולא
     * מסך ריק. אבל רק שגיאת טעינה מצדיקה רענון אוטומטי.
     */
    if (isChunkError(error)) {
      let alreadyTried = false;
      try {
        alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === "1";
        if (!alreadyTried) sessionStorage.setItem(RELOAD_FLAG, "1");
      } catch {
        /* אחסון חסום: מוותרים על הרענון האוטומטי ומציגים את המסך */
        alreadyTried = true;
      }
      if (!alreadyTried) {
        window.location.reload();
        return { failed: false };
      }
    }
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Route failed to load", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="container-site flex min-h-[60svh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-bone sm:text-3xl">
          העמוד לא נטען
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-bone/60">
          כנראה עלתה גרסה חדשה של האתר בזמן שהייתם כאן. רענון יפתור את זה.
        </p>
        <button
          type="button"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-medium text-white transition-opacity hover:opacity-90"
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_FLAG);
            } catch {
              /* לא קריטי: הרענון עצמו הוא מה שחשוב */
            }
            window.location.reload();
          }}
        >
          רענון העמוד
        </button>
      </div>
    );
  }
}

export default ChunkReloadBoundary;
