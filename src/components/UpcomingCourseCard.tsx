import { motion } from "framer-motion";
import type { UpcomingCourse } from "../data/upcomingCourses";
import { useWaitlistModal } from "../context/WaitlistModalContext";
import { MagneticCard } from "./motion";
import { staggerContainer, staggerItem, useMotionCapability } from "../lib/motion";

/**
 * כרטיס סדנה שטרם נפתחה. אותו מבנה בדיוק של כרטיס סדנה פעילה, כדי
 * שהסדנאות שבקרוב ירגישו חלק מהאקדמיה ולא סקשן נפרד. ההבדלים: תג
 * "בקרוב" למעלה, וכפתור שמצרף לרשימת המתנה במקום פעולת הרשמה.
 */
const UpcomingCourseCard = ({ course }: { course: UpcomingCourse }) => {
  const { openWaitlist } = useWaitlistModal();
  const reduced = useMotionCapability() === "static";
  const container = staggerContainer(0.07, 0.05);
  const item = staggerItem(reduced);

  return (
    <MagneticCard
      as="article"
      className="course-card surface-light group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-[#d9d8d4] p-6 text-ink shadow-card ring-1 ring-ink/[0.06] sm:p-7"
      tilt={6}
      scale={1.012}
      lift={-6}
      unroll={false}
    >
      <span
        className="pointer-events-none absolute -top-24 right-0 h-48 w-64 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        style={{ background: "radial-gradient(circle, rgba(214,31,44,0.14) 0%, rgba(214,31,44,0) 70%)" }}
        aria-hidden
      />

      <motion.div
        className="relative z-[1] flex h-full flex-col"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={container}
      >
        <motion.div variants={item} className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d61f2c] px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-[0_4px_14px_-4px_rgba(214,31,44,0.8)]">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
            בקרוב
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-ink/45">
            {course.category}
          </span>
        </motion.div>

        <motion.h3
          variants={item}
          className="mt-4 font-display text-2xl font-bold leading-[1.18] tracking-tight text-ink/85 sm:text-[1.7rem]"
        >
          {course.title}
        </motion.h3>

        <motion.p variants={item} className="mt-3 text-[15px] leading-relaxed text-ink/60">
          {course.description}
        </motion.p>

        <motion.div variants={item} className="mt-auto pt-7">
          <div className="border-t border-ink/10 pt-5">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-full bg-ink px-6 text-sm font-medium text-white transition-colors duration-300 hover:bg-black"
              onClick={() => openWaitlist({ slug: course.slug, title: course.title })}
            >
              הצטרפות לרשימת המתנה
            </button>
          </div>
        </motion.div>
      </motion.div>
    </MagneticCard>
  );
};

export default UpcomingCourseCard;
