import { useEffect, useState } from "react";

/**
 * מנוי לשאילתת מדיה, עם תשובה נכונה כבר ברינדור הראשון.
 *
 * קודם הערך התחיל תמיד false והתעדכן רק ב-useEffect, וזה ייצר באג
 * שהתסמין שלו הוא תוכן שנעלם: MethodJourney בוחר ענף לפי coarse, ולכן
 * בנייד הוא רינדר קודם את ענף הדסקטופ ורק אז החליף לענף הרשימה. בין
 * שני הרינדורים רץ useReveal של עמוד אודות, שסורק פעם אחת את ה-DOM
 * ומוצא רק את מה שקיים באותו רגע. הכותרת "איך אנחנו מלמדים" נולדה
 * אחרי הסריקה, אף אחד לא הוסיף לה revealed, והכלל
 * [data-reveal]:not(.revealed) השאיר אותה על opacity 0 לתמיד.
 *
 * אין SSR בפרויקט (useSeo מזריק ל-document.head בדיוק בגלל זה), ולכן
 * קריאה סינכרונית ב-initializer בטוחה. הבדיקה על window נשארת כדי
 * שהוק לא יתפוצץ אם ירוץ אי פעם מחוץ לדפדפן.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}
