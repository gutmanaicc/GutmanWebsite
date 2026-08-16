import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeader, { AccentWord } from "./SectionHeader";
import StudentWorksCarousel from "./StudentWorksCarousel";
import ImageLightbox from "./ImageLightbox";
import { popupJustClosed } from "../lib/scrollLock";
import { ArrowIcon } from "./icons";
import { STUDENT_WORKS } from "../data/studentWorksData";
import { TESTIMONIALS, type Testimonial } from "../data/testimonialsData";

/** ההודעות שקוראות הכי חזק; המלאי המלא חי ב-/reviews. */
const FEATURED = TESTIMONIALS.slice(0, 5);

/**
 * קיר עדויות: הציטוט האמיתי הוא הטיפוגרפיה, וצילום ההודעה המקורית
 * נפתח רק למי שרוצה לאמת. כל מילה כאן תומללה מצילומי המסך עצמם.
 */
const QuoteRow = ({
  item,
  index,
  onOpen,
}: {
  item: Testimonial;
  index: number;
  onOpen: (item: Testimonial) => void;
}) => {
  const reduced = useReducedMotion();

  return (
    <motion.li
      className="group border-b border-white/10"
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => !popupJustClosed() && onOpen(item)}
        className="w-full py-8 text-right sm:py-10"
      >
        <span className="block">
          <span className="block">
            <span className="block text-[clamp(1.35rem,2.6vw,2.1rem)] font-semibold leading-[1.25] tracking-tight text-bone">
              {item.quote}
            </span>
            <span className="mt-3 block max-w-2xl text-sm leading-relaxed text-bone/55 sm:text-base">
              {item.text}
            </span>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-bone/40 transition-colors group-hover:text-brand">
              לצפייה בהודעה המקורית
              <ArrowIcon size={13} />
            </span>
          </span>
        </span>
      </button>

    </motion.li>
  );
};

const HomeProof = () => {
  const [lightbox, setLightbox] = useState<Testimonial | null>(null);

  return (
  <>
    <section className="py-14 sm:py-20 lg:py-24">
      <div className="container-site">
        <SectionHeader
          kicker="מה אומרים"
          title={
            <>
              מילה במילה, <AccentWord>מההודעות שקיבלנו.</AccentWord>
            </>
          }
          sub="לא כתבנו את זה. אלה ההודעות עצמן, כפי שנשלחו אחרי המפגשים."
        />

        <ul className="border-t border-white/10">
          {FEATURED.map((item, i) => (
            <QuoteRow key={item.id} item={item} index={i} onOpen={setLightbox} />
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link to="/reviews" className="btn-ghost inline-flex items-center gap-2">
            לכל ההודעות
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </section>

    {/* Carousel ships its own <section> + header. */}
    {STUDENT_WORKS.length > 0 && <StudentWorksCarousel works={STUDENT_WORKS} />}

    <ImageLightbox
      src={lightbox?.image ?? null}
      alt={lightbox ? `צילום ההודעה: ${lightbox.quote}` : ""}
      onClose={() => setLightbox(null)}
    />
  </>
  );
};

export default HomeProof;
