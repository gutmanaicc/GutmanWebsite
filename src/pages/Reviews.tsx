import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import BackButton from "../components/BackButton";
import ReviewsRatingBadge from "../components/ReviewsRatingBadge";
import { AccentWord } from "../components/SectionHeader";
import { TESTIMONIALS, type Testimonial } from "../data/testimonialsData";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

/**
 * קיר ההודעות המלא: כל העדויות במכה אחת, בלי קטגוריות ובלי סינון.
 * לחיצה על הודעה פותחת את הצילום המקורי בגודל מלא.
 */
const Reviews = () => {
  const reduced = useReducedMotion();
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);

  useSeo({
    title: `מה אומרים | ${SITE.name}`,
    description: "ההודעות שקיבלנו ממשתתפים אחרי המפגשים, כפי שנשלחו.",
    path: "/reviews",
  });

  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close]);

  return (
    <>
      <section className="border-b border-white/10 py-14 sm:py-20">
        <div className="container-site">
          <BackButton />
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label mb-4 text-bone/45">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                מה אומרים
              </span>
              <h1 className="display-2 text-bone">
                מילה במילה, <AccentWord>מההודעות שקיבלנו.</AccentWord>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-bone/60 sm:text-lg">
                לא כתבנו את זה. אלה ההודעות עצמן, כפי שנשלחו אחרי המפגשים. לחצו על כל אחת כדי לראות
                את הצילום המקורי.
              </p>
            </div>
            <ReviewsRatingBadge linked={false} />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-site">
          {/* קיר בנוי בעמודות: כל הודעה בגובה הטבעי שלה */}
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {TESTIMONIALS.map((item, i) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setLightbox(item)}
                className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-5 text-right transition-colors hover:border-white/30 hover:bg-white/[0.06]"
                initial={reduced ? false : { opacity: 0, y: 22 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-lg font-semibold leading-snug tracking-tight text-bone">
                  {item.quote}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-bone/55">{item.text}</p>
                <span className="mt-4 block overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden
                    className="h-36 w-full object-cover object-top opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                    loading="lazy"
                    draggable={false}
                  />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`צילום ההודעה: ${lightbox.quote}`}
          onClick={close}
        >
          <button
            type="button"
            className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-bone transition-colors hover:border-white/50"
            onClick={close}
            aria-label="סגירה"
          >
            <X size={20} />
          </button>
          <img
            src={lightbox.image}
            alt={`צילום ההודעה: ${lightbox.quote}`}
            className="max-h-[88vh] w-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
};

export default Reviews;
