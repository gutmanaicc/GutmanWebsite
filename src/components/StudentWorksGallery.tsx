import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { StudentWork } from "../data/studentWorksData";
import SectionHeader, { AccentWord } from "./SectionHeader";

type Props = {
  works: StudentWork[];
};

/**
 * Compact video gallery of real student outputs for course pages.
 */
const StudentWorksGallery = ({ works }: Props) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const active = works.find((w) => w.id === activeId) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!works.length) return null;

  return (
    <section className="py-10 sm:py-12">
      <div className="container-site">
        <SectionHeader
          compact
          kicker="תוצרים"
          title={
            <>
              עבודות של <AccentWord>תלמידים</AccentWord>
            </>
          }
          sub="סרטונים אמיתיים שנבנו במהלך המסלול - לא הדגמות מבוימות."
        />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => (
            <li key={work.id}>
              <button
                type="button"
                className="group flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-[#191919] text-right shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D85]/50"
                onClick={() => setActiveId(work.id)}
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  <video
                    src={work.video}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FF2D85] text-white shadow-lg">
                      ▶
                    </span>
                  </span>
                </div>
                <div className="p-4 text-[#F4F4F2]">
                  <h3 className="text-sm font-bold">{work.title}</h3>
                  <p className="mt-1 text-xs text-[#F4F4F2]/65">{work.author}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[80] m-0 h-full max-h-none w-full max-w-none bg-[#191919]/85 p-0 backdrop:bg-transparent"
        onClose={() => setActiveId(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setActiveId(null);
        }}
        aria-labelledby={titleId}
      >
        {active && (
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#191919] shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="min-w-0 text-right">
                  <h2 id={titleId} className="truncate text-sm font-bold text-[#F4F4F2]">
                    {active.title}
                  </h2>
                  <p className="text-xs text-[#F4F4F2]/60">{active.author}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[#F4F4F2] hover:border-[#FF2D85] hover:text-[#FF2D85]"
                  onClick={() => setActiveId(null)}
                  aria-label="סגירה"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <video
                key={active.id}
                src={active.video}
                className="aspect-video w-full bg-black"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
};

export default StudentWorksGallery;
