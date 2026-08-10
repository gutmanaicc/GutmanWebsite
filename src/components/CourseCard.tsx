import type { Course, CourseCardPill } from "../data/courses";
import { ArrowIcon, BoltIcon, SparkIcon, TargetIcon, UsersIcon } from "./icons";
import { useRegisterModal } from "../context/RegisterModalContext";
import Pressable from "./Pressable";
import { MagneticCard, MagneticDepth } from "./motion";

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

  return (
    <MagneticCard
      as="article"
      className={`course-card group relative flex h-full flex-col rounded-[1.75rem] border border-white/40 bg-white p-6 shadow-card ring-1 ring-ink/5 ${
        featured ? "sm:p-7 lg:p-8" : ""
      }`}
      tilt={featured ? 10 : 8}
      scale={featured ? 1.02 : 1.015}
      lift={featured ? -10 : -8}
      unroll={unroll}
    >
      <span className="course-card-accent" aria-hidden="true" />

      <MagneticDepth z={36} className="mb-4">
        <span className="stat-pill border-[#FF2D85]/20 bg-[#FF2D85]/5 text-[#FF2D85]">{course.category}</span>
      </MagneticDepth>

      <h3
        className={`font-bold tracking-tight text-ink ${
          featured ? "text-2xl sm:text-[1.75rem] leading-tight" : "text-xl leading-snug"
        }`}
      >
        {course.title}
      </h3>

      <p className={`mt-2 text-muted ${featured ? "max-w-xl text-base leading-snug" : "text-sm leading-snug"}`}>
        {course.cardSubtitle}
      </p>

      <MagneticDepth z={22} className="mt-4 flex flex-wrap gap-2">
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

      <MagneticDepth z={40} className="mt-auto flex flex-wrap items-center gap-2 pt-6">
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
          onClick={() => openRegisterModal({ courseId: course.slug, leadSource: `card-${course.slug}` })}
        >
          שמרו לי מקום
        </Pressable>
      </MagneticDepth>
    </MagneticCard>
  );
};

export default CourseCard;
