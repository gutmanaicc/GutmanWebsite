import type { ReactNode } from "react";
import BackButton from "./BackButton";

/**
 * מעטפת לעמודי המסמכים המשפטיים: אותה שפה של האתר, עמודת קריאה צרה,
 * וכותרות ממוספרות. התוכן עצמו מגיע מהעמוד שעוטף.
 */

export const LegalSection = ({
  num,
  title,
  children,
}: {
  num?: string;
  title: string;
  children: ReactNode;
}) => (
  <section className="border-t border-white/10 py-8 first:border-t-0 sm:py-10">
    <h2 className="flex items-baseline gap-3 font-serif text-xl font-medium tracking-tight text-bone sm:text-2xl">
      {num && (
        <span className="shrink-0 text-[13px] font-medium tracking-normal text-brand" dir="ltr">
          {num}
        </span>
      )}
      {title}
    </h2>
    <div className="legal-body mt-4 space-y-3.5 text-[15px] leading-relaxed text-bone/60">
      {children}
    </div>
  </section>
);

const LegalPage = ({
  kicker,
  title,
  meta,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  meta: string;
  intro?: string;
  children: ReactNode;
}) => (
  <div className="py-10 sm:py-14">
    <div className="container-site max-w-3xl">
      <div className="mb-8 flex justify-start">
        <BackButton fallbackTo="/" />
      </div>

      <header className="pb-4">
        <span className="section-label mb-5 flex text-bone">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          {kicker}
        </span>
        <h1 className="display-2 text-bone">{title}</h1>
        <p className="mt-5 text-sm text-bone/40">{meta}</p>
        {intro && <p className="mt-6 text-base leading-relaxed text-bone/65">{intro}</p>}
      </header>

      <div className="mt-6">{children}</div>
    </div>
  </div>
);

export default LegalPage;
