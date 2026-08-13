import { Instagram, Phone } from "lucide-react";
import Logo from "./Logo";
import { SITE } from "../data/site";

type IconProps = { size?: number; className?: string };

/** Lucide-compatible WhatsApp mark (brand glyph; not in lucide core). */
const WhatsAppIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
