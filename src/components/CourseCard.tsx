import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Course, CourseCardPill } from "../data/courses";
import { ArrowIcon, BoltIcon, SparkIcon, TargetIcon, UsersIcon } from "./icons";
import { useRegisterModal } from "../context/RegisterModalContext";
import { MagneticCard, MagneticDepth } from "./motion";
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
 * כרטיס מסלול: קטגוריה זעירה למעלה, כותרת סריפית, קו שיער, ומדף פעולה
 * תחתון עם פעולה ראשית כהה ולינק משני. הפעולות יושבות על משטח לבן,
 * ולכן חייבות ניגודיות כהה - לא שנהב על לבן.
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
      className={`course-card group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white text-ink shadow-card ring-1 ring-ink/[0.07] ${
        featured ? "p-6 sm:p-8 lg:p-10" : "p-6 sm:p-7"
      }`}
      tilt={featured ? 8 : 6}
      scale={1.012}
      lift={-6}
      unroll={unroll}
    >
      {/* משיכת ורוד עדינה בפינה העליונה, מתחזקת בהובר */}
      <span
        className="pointer-events-none absolute -top-24 right-0 h-48 w-64 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(255,95,158,0.16) 0%, rgba(255,95,158,0) 70%)" }}
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
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-brand"
        >
          <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
          {course.category}
        </motion.p>

        <motion.h3
          variants={item}
          className={`mt-4 font-display font-bold leading-[1.18] tracking-tight text-ink ${
            featured ? "text-[1.7rem] sm:text-4xl" : "text-2xl sm:text-[1.7rem]"
          }`}
        >
          {course.title}
        </motion.h3>

        <motion.p
          variants={item}
          className={`mt-3 leading-relaxed text-muted ${featured ? "max-w-xl text-base" : "text-[15px]"}`}
        >
          {course.cardSubtitle}
        </motion.p>

        <motion.div variants={item}>
          <MagneticDepth z={20} className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {course.cardPills.map((pill) => {
              const Icon = PILL_ICONS[pill.icon];
              return (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/55"
                >
                  <Icon size={13} />
                  {pill.label}
                </span>
              );
            })}
          </MagneticDepth>
        </motion.div>

        {/* מדף הפעולה: קו שיער מפריד, פעולה ראשית כהה, משנית כלינק */}
        <motion.div variants={item} className="mt-auto pt-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
            <Link
              to={`/courses/${course.slug}`}
              className="group/cta inline-flex min-h-11 items-center gap-2.5 rounded-full bg-ink px-6 text-sm font-medium text-white transition-colors duration-300 hover:bg-black"
            >
              לפרטי המסלול
              <span
                className="inline-flex transition-transform duration-300 group-hover/cta:-translate-x-1"
                aria-hidden
              >
                <ArrowIcon />
              </span>
            </Link>

            <button
              type="button"
              className="inline-flex min-h-11 items-center text-sm font-medium text-ink/55 underline-offset-4 transition-colors duration-200 hover:text-brand hover:underline"
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
