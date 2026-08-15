import Pressable from "./Pressable";
import ReviewsRatingBadge from "./ReviewsRatingBadge";
import { AccentWord } from "./SectionHeader";
import { WhatsAppIcon } from "./icons";
import HeroBackdrop from "./motion/hero/HeroBackdrop";
import { SITE } from "../data/site";
import { getInstructor } from "../data/instructorsData";

/**
 * Full-viewport home hero: brand headline, punchy hook, social-proof → /reviews, CTAs.
 */
const ron = getInstructor("ron-gutman");

const Hero = () => (
  <section className="relative flex min-h-[calc(100dvh-80px)] flex-col overflow-x-clip overflow-y-hidden">
    <HeroBackdrop />
    <div className="pointer-events-none absolute inset-0 z-[1] grid-canvas opacity-70" aria-hidden />

    <div className="container-site relative z-[2] flex flex-1 flex-col items-center justify-center py-10 text-center sm:py-14">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 sm:mb-7">
          <span className="stat-pill">מסלולים מעשיים</span>
          <span className="stat-pill">לימוד פרונטלי</span>
          <span className="stat-pill">יוצאים עם תוצר</span>
        </div>

        <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-7xl lg:text-8xl">
          {SITE.hero.title}{" "}
          <AccentWord>{SITE.hero.titleAccent}</AccentWord>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-snug text-[#191919]/80 sm:mt-6 sm:text-lg md:text-xl md:leading-relaxed">
          {SITE.hero.subtitle}
        </p>

        <div className="mt-6 flex justify-center sm:mt-7">
          <ReviewsRatingBadge />
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
          <Pressable as="link" to="/courses" className="btn-primary ps-6 pe-2">
            {SITE.hero.primaryCta}
            {ron && (
              <img
                src={ron.image}
                alt=""
                aria-hidden
                className="h-8 w-8 shrink-0 rounded-full object-cover object-top ring-2 ring-white/25"
                loading="eager"
                draggable={false}
              />
            )}
          </Pressable>

          <Pressable
            as="a"
            href={SITE.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            rippleTone="pink"
          >
            <WhatsAppIcon size={18} className="shrink-0 text-[#25D366]" />
            דברו איתנו בוואטסאפ
          </Pressable>

          <Pressable as="a" href="#finder" className="btn-ghost" rippleTone="pink">
            {SITE.hero.secondaryCta}
          </Pressable>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
