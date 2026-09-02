import { motion, useScroll, useTransform } from "framer-motion";
import { useMotionCapability } from "../../lib/motion";

type Props = {
  /** מיקום הרמז נקבע מבחוץ, למשל absolute inset-x-0 bottom-8 על הירו relative */
  className?: string;
};

/*
 * המרחק שבו הרמז נגמר.
 *
 * 80px זה פחות מתנועת גלגלת אחת: ברגע שהגולשת גללה היא כבר יודעת שיש
 * המשך, והרמז הופך מהזמנה למכשול שמרחף מעל התוכן. רמז גלילה ששורד את
 * הגלילה הוא רמז שמפספס את מה שהוא בא לומר.
 */
const FADE_DISTANCE_PX = 80;

/** אורך המסילה והמקטע שנוסע בה, בפיקסלים */
const TRACK_H = 40;
const DASH_H = 12;

/**
 * רמז גלילה בתחתית ההירו.
 *
 * בהירו במסך מלא הקיפול נראה כמו סוף הדף, ובלי סימן שיש המשך חלק
 * מהגולשות פשוט לא גוללות. אלמנט קטן שנע כלפי מטה פותר את זה בלי להוסיף
 * טקסט שמתחרה בכותרת.
 *
 * pointer-events-none ו-aria-hidden: זו קישוטיות ולא פעולה. אם ירצו כאן
 * כפתור שמגלגל לסקשן הבא, הוא חייב להיות button אמיתי עם aria-label
 * ומטרת מגע 44px, לא הרחבה של הרכיב הזה.
 */
const HeroScrollCue = ({ className = "" }: Props) => {
  const still = useMotionCapability() === "static";
  const { scrollY } = useScroll();

  /*
   * ההיעלמות נגזרת ישירות מערך הגלילה ולא ממצב ריאקט.
   *
   * מאזין scroll שמעדכן useState היה מרנדר מחדש את כל ההירו בכל פריים
   * של גלילה, בדיוק ברגע היקר ביותר בעמוד. useScroll כבר מנוי לגלילה
   * (ועובד עם Lenis, כי Lenis מניע גלילה אמיתית), ו-useTransform מזרים
   * את הערך ל-DOM בלי לעבור דרך ריאקט בכלל.
   */
  const opacity = useTransform(scrollY, [0, FADE_DISTANCE_PX], [1, 0]);
  const y = useTransform(scrollY, [0, FADE_DISTANCE_PX], [0, 12]);

  return (
    /*
     * הרכיב יושב בזרימה עם mx-auto ולא ב-translate של חצי רוחב, כדי
     * שמיקום אבסולוטי מבחוץ לא יוכל לדחוף אותו אל מחוץ למסך וליצור
     * גלילה אופקית ברוחבים צרים.
     */
    <motion.div
      className={`pointer-events-none mx-auto flex w-fit flex-col items-center gap-3 ${className}`}
      style={{ opacity, y, willChange: "transform, opacity" }}
      aria-hidden
    >
      <span className="text-[11px] font-medium tracking-[0.2em] text-bone/45">גללו</span>
      <span
        className="relative block w-px overflow-hidden bg-bone/15"
        style={{ height: TRACK_H }}
      >
        {still ? (
          /*
           * בלי תנועה: אותו מקטע, עומד בראש המסילה. הצורה נשארת מובנת
           * (קו עם התחלה שמצביעה מטה) בלי שום דבר שזז מעצמו על המסך.
           */
          <span className="absolute top-0 start-0 block w-full bg-brand" style={{ height: DASH_H }} />
        ) : (
          <motion.span
            className="absolute top-0 start-0 block w-full bg-brand"
            style={{ height: DASH_H, willChange: "transform, opacity" }}
            /* transform ואופסיטי בלבד. המסילה חותכת (overflow-hidden) ולכן
               אין צורך לחשב את הקצוות, רק לחצות אותה מקצה לקצה. */
            animate={{ y: [-DASH_H, TRACK_H], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.3, ease: "easeInOut" }}
          />
        )}
      </span>
    </motion.div>
  );
};

export default HeroScrollCue;
