import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Course, CourseCardPill } from "../data/courses";
import { ArrowIcon, BoltIcon, SparkIcon, TargetIcon, UsersIcon } from "./icons";
import { useRegisterModal } from "../context/RegisterModalContext";
import { MagneticCard } from "./motion";
import { staggerContainer, staggerItem, useMotionCapability } from "../lib/motion";

const PILL_ICONS: Record<CourseCardPill["icon"], (props: { size?: number }) => JSX.Element> = {
  bolt: BoltIcon,
  users: UsersIcon,
  target: TargetIcon,
  spark: SparkIcon,
};

type Props = {
  course: Course;
  index?: number;
  featured?: boolean;
  /** Disable card-level scroll unroll when parent ScrollReveal3D handles it. */
  unroll?: boolean;
};

/**
 * כרטיס סדנה על משטח כהה, לא על כרטיס לבן גנרי.
 *
 * המבנה: מספר ענק בקווי מתאר ברקע שנותן לכרטיס זהות, קטגוריה על קו
 * שיער, כותרת גדולה, ומדף פעולה תחתון. בהובר הכרטיס נדלק מבפנים - קו
 * ורוד נמתח מהצד, הזוהר מתעורר, והמספר מתחזק.
 */
const CourseCard = ({ course, featured = false, unroll = true }: Props) => {
  const { openRegisterModal } = useRegisterModal();
  const level = useMotionCapability();
  const reduced = level === "static";
  const container = staggerContainer(0.07, 0.05);
  const item = staggerItem(reduced);

  return (
    <MagneticCard
      as="article"
      className={`course-card group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141317] text-bone transition-colors duration-500 hover:border-white/25 ${
        featured ? "p-7 sm:p-9" : "p-7 sm:p-8"
      }`}
      tilt={featured ? 7 : 5}
      scale={1.01}
      lift={-6}
      unroll={unroll}
    >
      {/* מספר ענק בקווי מתאר: החתימה הוויזואלית של הכרטיס */}
      <span
        className="course-card-ghost pointer-events-none absolute -left-4 -top-8 select-none font-display text-[9rem] font-black leading-none tracking-tightest"
        dir="ltr"
        aria-hidden
      >
        {course.shortTitle.slice(0, 2)}
      </span>

      {/* קו ורוד שנמתח לאורך הקצה בהובר */}
      <span
        className="pointer-events-none absolute inset-y-0 right-0 w-[2px] origin-top scale-y-0 bg-brand transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(255,95,158,0.22) 0%, rgba(255,95,158,0) 70%)" }}
        aria-hidden
      />

      <motion.div
        className="relative z-[1] flex h-full flex-col"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={container}
      >
        <motion.p
          variants={item}
          className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-brand"
        >
          <span className="h-px w-6 bg-brand/60" aria-hidden />
          {course.category}
        </motion.p>

        <motion.h3
          variants={item}
          className={`mt-6 font-display font-bold leading-[1.1] tracking-tightest text-bone ${
            featured ? "text-[1.8rem] sm:text-[2.4rem]" : "text-[1.6rem] sm:text-[1.9rem]"
          }`}
        >
          {course.title}
        </motion.h3>

        <motion.p
          variants={item}
          className={`mt-4 leading-relaxed text-bone/55 ${featured ? "max-w-xl text-base" : "text-[15px]"}`}
        >
          {course.cardSubtitle}
        </motion.p>

        <motion.div variants={item} className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
          {course.cardPills.map((pill) => {
            const Icon = PILL_ICONS[pill.icon];
            return (
              <span
                key={pill.label}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-bone/45"
              >
                <Icon size={13} />
                {pill.label}
              </span>
            );
          })}
        </motion.div>

        {/* מדף הפעולה */}
        <motion.div variants={item} className="mt-auto pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <Link
              to={`/courses/${course.slug}`}
              className="group/cta inline-flex min-h-11 items-center gap-2.5 rounded-full bg-bone px-6 text-sm font-medium text-ink transition-colors duration-300 hover:bg-white"
            >
              לפרטי הסדנה
              <span
                className="inline-flex transition-transform duration-300 group-hover/cta:-translate-x-1"
                aria-hidden
              >
                <ArrowIcon />
              </span>
            </Link>

            <button
              type="button"
              className="inline-flex min-h-11 items-center text-sm font-medium text-bone/45 underline-offset-4 transition-colors duration-200 hover:text-brand hover:underline"
              onClick={() =>
                openRegisterModal({ courseId: course.slug, leadSource: `card-${course.slug}` })
              }
            >
              שמרו לי מקום
            </button>
          </div>
        </motion.div>
      </motion.div>
    </MagneticCard>
  );
};

export default CourseCard;
