import { useState } from "react";
import SectionHeader from "./SectionHeader";
import ImageLightbox from "./ImageLightbox";
import Pressable from "./Pressable";
import { Reveal } from "./motion";
import { useRegisterModal } from "../context/RegisterModalContext";
import { popupJustClosed } from "../lib/scrollLock";
import type { FashionStill } from "../data/fashionWorks";

type Props = {
  stills: FashionStill[];
  /*
   * כותרת ותקציר עם ברירת מחדל, לפי אותו דפוס שכבר קיים ב-
   * StudentWorksCarousel: הקורא מקבל טקסט שנכון בכל עמוד שהרכיב
   * מוצג בו, ומעביר override רק כשיש סיבה אמיתית לסטות ממנו.
   */
  title?: string;
  sub?: string;
  note?: string;
  ctaLabel?: string;
  /* ראו הערה מקבילה ב-StudentWorksCarousel: משמש את דף הנחיתה, ששם
     הבקשה יורדת מכאן ומצטרפת לבקשה המשותפת שאחרי קרוסלת הסרטונים */
  hideCta?: boolean;
  onCta?: () => void;
  /* compact כברירת מחדל (עמוד המסלול). דף הנחיתה מעביר false כדי
     שכותרת הסקשן תהיה באותו גודל בולט כמו שאר הסקשנים בו */
  compactHeader?: boolean;
};

/**
 * סדרת שלוש התמונות: אותה דוגמנית, אותו חדר, שלושה שוטים.
 *
 * רכיב עצמאי ולא JSX מוטמע בדף הנחיתה, כי הבקשה הייתה להציג את אותם
 * נכסים גם בעמוד המסלול הרגיל (/courses/ai-fashion). שני העמודים
 * צריכים בדיוק את אותה רשת תמונות ואת אותו לייטבוקס, ועותק שני היה
 * נסחף מהמקור בשקט בדיוק כמו שקורה לכל עותק כפול בפרויקט הזה.
 *
 * מנהל את מצב הלייטבוקס בפנים ולא מקבל אותו כפרופ, כדי שקריאה יחידה
 * <FashionStillsShowcase stills={...} /> תספיק בכל עמוד שמשתמש בו.
 */
const FashionStillsShowcase = ({
  stills,
  title = "אותה דוגמנית. שלושה שוטים.",
  sub = "לא שלוש תמונות שיצא שהן דומות. דמות אחת שנשמרת זהה בין שוט לשוט, וזה מה שהופך סט תמונות לקמפיין.",
  note = "כל שוט כאן נבנה מאותה תמונת בסיס, בלי סטודיו ובלי יום צילום.",
  ctaLabel = "רוצה לבנות כאלה",
  hideCta = false,
  onCta,
  compactHeader = true,
}: Props) => {
  const [still, setStill] = useState<string | null>(null);
  const { openRegisterModal } = useRegisterModal();

  if (stills.length === 0) return null;

  return (
    <section className="pb-10 sm:pb-14">
      <div className="container-site">
        <Reveal>
          <SectionHeader compact={compactHeader} title={title} sub={sub} />
        </Reveal>

        {/*
          שלוש עמודות גם בנייד ולא ערימה.
          הטענה כאן היא "אותה דמות", והיא נקראת רק כששלוש התמונות
          נראות במבט אחד. תמונה אחת מתחת לשנייה הופכת אותן לשלוש
          תמונות נפרדות, כלומר בדיוק לא ההוכחה.
        */}
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
          {stills.map((item, i) => (
            <Reveal key={item.id} variant="scale" delay={i * 0.09}>
              <button
                type="button"
                /* popupJustClosed חוסם פתיחה מחדש כשסגירת הלייטבוקס
                   בלחיצה בחוץ נוחתת על התמונה שמתחתיה */
                onClick={() => !popupJustClosed() && setStill(item.src)}
                className="group block w-full overflow-hidden rounded-xl border border-white/10 bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                aria-label={`הגדלת התמונה: ${item.alt}`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </button>
            </Reveal>
          ))}
        </div>

        {!hideCta && (
          <Reveal className="mt-8 flex flex-col items-center text-center">
            <p className="max-w-md text-[15px] leading-relaxed text-bone/55">{note}</p>
            <Pressable
              type="button"
              className="btn btn-brand mt-5 w-full max-w-xs cursor-pointer sm:w-auto sm:max-w-none sm:px-8"
              rippleTone="pink"
              onClick={onCta ?? (() => openRegisterModal({ leadSource: "fashion-stills" }))}
            >
              {ctaLabel}
            </Pressable>
          </Reveal>
        )}
      </div>

      {/* בלי כותרת: "ההודעה המקורית" נכון לצילומי הודעות ולא לתמונת קמפיין */}
      <ImageLightbox
        src={still}
        alt={stills.find((item) => item.src === still)?.alt ?? ""}
        onClose={() => setStill(null)}
        label={null}
      />
    </section>
  );
};

export default FashionStillsShowcase;
