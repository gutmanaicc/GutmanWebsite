import { Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { SITE } from "../data/site";

const iconBadgeClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-[background-color,border-color,transform,color] duration-200 hover:border-brand/50 hover:bg-brand/15 hover:text-brand active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const legalLinkClass =
  "inline-flex min-h-11 items-center justify-center px-2 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * פוטר מותג ממורכז: לוגו, שורת תיאור, ואייקוני קשר.
 *
 * בלי טלפון ובלי קישור tel:, בכוונה עסקית. כל פנייה עוברת דרך טופס
 * הלידים כדי שכל ליד ייספר, ולכן חיוג ישיר לא מוצע כאן בכלל.
 *
 * הפוטר הודק: מטרות המגע נשארו 44px, אבל המרווחים האנכיים והשורות
 * המיותרות ירדו. שורת הדומיין הוסרה - היא חזרה על מה שכתוב בשורת
 * הזכויות מיד מעליה.
 */
const Footer = () => (
  <footer className="site-footer bg-ink text-white">
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-5 py-8 text-center sm:py-9">
      <Logo height={28} className="max-h-7 w-auto sm:max-h-8" />

      <p className="mt-3 text-[13px] leading-relaxed text-white/70">
        האקדמיה הפרונטלית ללימודי בינה מלאכותית
      </p>

      <nav
        className="mt-4 flex items-center justify-center gap-2.5"
        aria-label="יצירת קשר ורשתות חברתיות"
      >
        <a
          href={SITE.social.instagram}
          target="_blank"
          rel="noreferrer"
          className={iconBadgeClass}
          aria-label="Instagram"
        >
          <Instagram size={18} strokeWidth={2} aria-hidden />
        </a>
        <a
          href={`mailto:${SITE.contact.email}`}
          className={iconBadgeClass}
          aria-label={`שלחו מייל ל-${SITE.contact.email}`}
        >
          <Mail size={18} strokeWidth={2} aria-hidden />
        </a>
      </nav>

      {/* שורה אחת: זכויות ולינקים משפטיים יחד, במקום שלוש שורות נפרדות */}
      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-x-1 border-t border-white/10 pt-4 text-xs text-white/45">
        <span className="px-1">© GutmanAI {new Date().getFullYear()}</span>
        <span className="text-white/20" aria-hidden>
          ·
        </span>
        <Link to="/privacy" className={legalLinkClass}>
          תנאי שימוש ופרטיות
        </Link>
        <span className="text-white/20" aria-hidden>
          ·
        </span>
        <Link to="/accessibility" className={legalLinkClass}>
          הצהרת נגישות
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
