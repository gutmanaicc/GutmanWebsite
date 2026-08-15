import { Link } from "react-router-dom";
import SectionHeader, { AccentWord } from "./SectionHeader";
import StudentWorksCarousel from "./StudentWorksCarousel";
import { ScrollReveal3D, StaggerGroup, StaggerItem } from "./motion";
import { ArrowIcon } from "./icons";
import { STUDENT_WORKS } from "../data/studentWorksData";
import { TESTIMONIALS, type Testimonial } from "../data/testimonialsData";

/** Screenshots that read best at card size; the full set lives on /reviews. */
const FEATURED = TESTIMONIALS.slice(0, 6);

const ProofCard = ({ item }: { item: Testimonial }) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#191919] text-right shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_32px_60px_-30px_rgba(0,0,0,0.75)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <div className="flex flex-col gap-1.5 p-4 pb-3">
      <span className="inline-flex w-fit rounded-full bg-[#FF2D85]/15 px-2.5 py-1 text-xs font-semibold text-[#FF2D85]">
        {item.tag}
      </span>
      <p className="text-sm font-bold leading-snug text-[#F4F4F2]">
        <span className="text-[#FF2D85]" aria-hidden>
          “
        </span>
        {item.quote}
        <span className="text-[#FF2D85]" aria-hidden>
          ”
        </span>
      </p>
      <p className="line-clamp-3 text-xs leading-relaxed text-[#F4F4F2]/65">{item.text}</p>
    </div>

    <div className="mx-4 mb-4 mt-auto overflow-hidden rounded-xl bg-zinc-900">
      <img
        src={item.image}
        alt={`צילום ביקורת: ${item.quote}`}
        className="h-32 w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none sm:h-36"
        loading="lazy"
        draggable={false}
      />
    </div>
  </article>
);

/**
 * Home-page proof block: real student screenshots + the works they built.
 * Both data sets already power /reviews and the course pages; this surfaces
 * them before the lead form, so the ask lands after the evidence.
 */
const HomeProof = () => (
  <>
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container-site">
        <SectionHeader
          index="04"
          kicker="הוכחות"
          title={
            <>
              לא מבטיחים. <AccentWord>מראים.</AccentWord>
            </>
          }
          sub="הודעות אמיתיות שקיבלנו ממשתתפים אחרי המסלולים, בלי עריכה ובלי שכתוב."
        />

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
          {FEATURED.map((item) => (
            <StaggerItem key={item.id} className="h-full">
              <ScrollReveal3D className="h-full" intensity="quiet" fromRotateX={7} fromY={26}>
                <ProofCard item={item} />
              </ScrollReveal3D>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <div className="mt-8 flex justify-center">
          <Link
            to="/reviews"
            className="btn-ghost inline-flex items-center gap-2"
            aria-label="לכל הביקורות"
          >
            לכל הביקורות
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </section>

    {/* Carousel ships its own <section> + header. */}
    {STUDENT_WORKS.length > 0 && <StudentWorksCarousel works={STUDENT_WORKS} />}
  </>
);

export default HomeProof;
