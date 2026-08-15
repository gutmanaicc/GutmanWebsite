import { Instagram, Phone } from "lucide-react";
import Logo from "./Logo";
import { WhatsAppIcon } from "./icons";
import { SITE } from "../data/site";

const phoneHref = `tel:${SITE.contact.phone.replace(/-/g, "")}`;

const iconBadgeClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-[background-color,border-color,transform,color] duration-200 hover:border-[#FF2D85]/50 hover:bg-[#FF2D85]/15 hover:text-[#FF2D85] active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D85]";

/**
 * Centered brand footer - logo-cutout, tagline, icon contact badges.
 * No course list, no YouTube.
 */
const Footer = () => (
  <footer className="bg-ink text-white">
    <div className="container-site flex flex-col items-center justify-center py-14 text-center sm:py-16">
      <Logo height={36} className="max-h-9 w-auto sm:max-h-10" />

      <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
        האקדמיה הפרונטלית ללימודי בינה מלאכותית
      </p>

      <nav
        className="mt-7 flex items-center justify-center gap-3"
        aria-label="יצירת קשר ורשתות חברתיות"
      >
        <a
          href={SITE.contact.whatsapp}
          target="_blank"
          rel="noreferrer"
          className={iconBadgeClass}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={20} />
        </a>
        <a
          href={SITE.social.instagram}
          target="_blank"
          rel="noreferrer"
          className={iconBadgeClass}
          aria-label="Instagram"
        >
          <Instagram size={20} strokeWidth={2} aria-hidden />
        </a>
        <a href={phoneHref} dir="ltr" className={iconBadgeClass} aria-label={`התקשרו ${SITE.contact.phone}`}>
          <Phone size={20} strokeWidth={2} aria-hidden />
        </a>
      </nav>

      <div className="mt-10 flex w-full max-w-lg flex-col items-center justify-center gap-1 border-t border-white/10 pt-6 text-xs text-white/45">
        <span>© GutmanAI {new Date().getFullYear()} · כל הזכויות שמורות</span>
        <span>gutmanai.com</span>
        <a
          href="/terms-and-privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center justify-center px-3 text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-[#FF2D85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D85]"
        >
          מדיניות האתר ותנאי שימוש
        </a>
        <a
          href="/accessibility-statement.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center px-3 text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-[#FF2D85] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D85]"
        >
          הצהרת נגישות
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
