import { motion } from "framer-motion";
import type { Course, CourseCardPill } from "../data/courses";
import { ArrowIcon, BoltIcon, SparkIcon, TargetIcon, UsersIcon } from "./icons";
import { useRegisterModal } from "../context/RegisterModalContext";
import Pressable from "./Pressable";
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

const CourseCard = ({ course, featured = false, unroll = true }: Props) => {
  const { openRegisterModal } = useRegisterModal();
  const level = useMotionCapability();
  const reduced = level === "static";
  const container = staggerContainer(0.07, 0.05);
  const item = staggerItem(reduced);

  return (
    <MagneticCard
      as="article"
      className={`course-card glow-edge group relative flex h-full flex-col rounded-[1.75rem] border border-white/40 bg-white p-4 shadow-card ring-1 ring-ink/5 sm:p-6 ${
        featured ? "sm:p-7 lg:p-8" : ""
      }`}
      tilt={featured ? 10 : 8}
      scale={featured ? 1.02 : 1.015}
      lift={featured ? -10 : -8}
      unroll={unroll}
    >
      <span className="course-card-accent" aria-hidden="true" />

      <motion.div
        className="relative z-[1] flex h-full flex-col"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={container}
      >
        <motion.div variants={item}>
          <MagneticDepth z={36} className="mb-3 sm:mb-4">
            <span className="stat-pill border-[#FF2D85]/20 bg-[#FF2D85]/5 text-[#FF2D85]">
              {course.category}
            </span>
          </MagneticDepth>
        </motion.div>

        <motion.h3
          variants={item}
          className={`font-bold tracking-tight text-ink ${
            featured
              ? "text-xl leading-tight sm:text-2xl lg:text-[1.75rem]"
              : "text-lg leading-snug sm:text-xl"
          }`}
        >
          {course.title}
        </motion.h3>

        <motion.p
          variants={item}
          className={`mt-2 text-muted ${
            featured ? "max-w-xl text-sm leading-snug sm:text-base" : "text-sm leading-snug"
          }`}
        >
          {course.cardSubtitle}
        </motion.p>

        <motion.div variants={item}>
          <MagneticDepth z={22} className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            {course.cardPills.map((pill) => {
              const Icon = PILL_ICONS[pill.icon];
              return (
                <span key={pill.label} className="course-card-pill">
                  <Icon size={13} />
                  {pill.label}
                </span>
              );
            })}
          </MagneticDepth>
        </motion.div>

        <motion.div variants={item} className="mt-auto pt-5 sm:pt-6">
          <MagneticDepth z={40} className="flex flex-wrap items-center gap-2">
            <Pressable
              as="link"
              to={`/courses/${course.slug}`}
              className="course-card-cta-primary btn-primary btn-small"
            >
              לפרטי המסלול
              <span className="course-card-cta-arrow inline-flex" aria-hidden="true">
                <ArrowIcon />
              </span>
            </Pressable>
            <Pressable
              type="button"
              className="btn-ghost btn-small cursor-pointer"
              rippleTone="pink"
              onClick={() =>
                openRegisterModal({ courseId: course.slug, leadSource: `card-${course.slug}` })
              }
            >
              שמרו לי מקום
            </Pressable>
          </MagneticDepth>
        </motion.div>
      </motion.div>
    </MagneticCard>
  );
};

export default CourseCard;
