import { Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { SITE } from "../data/site";

const phoneHref = `tel:${SITE.contact.phone.replace(/-/g, "")}`;

const iconBadgeClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-[background-color,border-color,transform,color] duration-200 hover:border-[#FF2D85]/50 hover:bg-[#FF2D85]/15 hover:text-[#FF2D85] active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D85]";

/**
 * Centered brand footer - logo-cutout, tagline, icon contact badges.
 * No course list, no YouTube.
 */
const Footer = () => (
  <footer className="site-footer bg-ink text-white">
    {/* עמודה צרה וממורכזת: הפוטר סוגר את העמוד ולא נפרש לרוחב המסך */}
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-5 py-12 text-center sm:py-14">
      <Logo height={32} className="max-h-8 w-auto sm:max-h-9" />

      <p className="mt-4 text-sm leading-relaxed text-white/75">
        האקדמיה הפרונטלית ללימודי בינה מלאכותית
      </p>

      <nav
        className="mt-6 flex items-center justify-center gap-3"
        aria-label="יצירת קשר ורשתות חברתיות"
      >
        <a
          href={SITE.social.instagram}
          target="_blank"
          rel="noreferrer"
          className={iconBadgeClass}
          aria-label="Instagram"
        >
          <Instagram size={19} strokeWidth={2} aria-hidden />
        </a>
        <a
          href={phoneHref}
          dir="ltr"
          className={iconBadgeClass}
          aria-label={`התקשרו ${SITE.contact.phone}`}
        >
          <Phone size={19} strokeWidth={2} aria-hidden />
        </a>
        <a
          href={`mailto:${SITE.contact.email}`}
          className={iconBadgeClass}
          aria-label={`שלחו מייל ל-${SITE.contact.email}`}
        >
          <Mail size={19} strokeWidth={2} aria-hidden />
        </a>
      </nav>

      <div className="mt-8 flex w-full flex-col items-center justify-center gap-1 border-t border-white/10 pt-6 text-xs text-white/45">
        <span>© GutmanAI {new Date().getFullYear()} · כל הזכויות שמורות</span>
        <span>gutmanai.com</span>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2">
          <Link
            to="/privacy"
            className="inline-flex min-h-11 items-center justify-center px-3 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            תנאי שימוש ומדיניות פרטיות
          </Link>
          <span className="text-white/20" aria-hidden>
            ·
          </span>
          <Link
            to="/accessibility"
            className="inline-flex min-h-11 items-center justify-center px-3 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            הצהרת נגישות
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
