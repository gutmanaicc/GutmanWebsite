import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import FAQAccordion from "../components/FAQAccordion";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import SyllabusBlocks from "../components/SyllabusBlocks";
import { InstructorAvatar } from "../components/InstructorsShowcase";
import InstructorBioModal, { type InstructorBio } from "../components/InstructorBioModal";
import Pressable from "../components/Pressable";
import BackButton from "../components/BackButton";
import StudentWorksCarousel from "../components/StudentWorksCarousel";
import { ParallaxLayer, MagneticCard, MagneticDepth } from "../components/motion";
import {
  ArrowIcon,
  BoltIcon,
  BriefcaseIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  FlagIcon,
  GraduationIcon,
  LayersIcon,
  SparkIcon,
  TargetIcon,
  UsersIcon,
  VideoIcon,
} from "../components/icons";
import { getChildCourses, getCourse, type AudienceIcon, type Course } from "../data/courses";
import { getMarketingSyllabus, getSyllabusHref } from "../data/syllabi";
import { trackStandard } from "../pixel";
import { getInstructorsForCourse } from "../data/instructorsData";
import { getStudentWorksForCourse } from "../data/studentWorksData";
import { SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { useReveal } from "../lib/useReveal";
import { courseSchema, faqSchema, useSeo } from "../lib/seo";
import NotFound from "./NotFound";

const AUDIENCE_ICONS: Record<AudienceIcon, (props: { size?: number }) => JSX.Element> = {
  bolt: BoltIcon,
  users: UsersIcon,
  target: TargetIcon,
  spark: SparkIcon,
  briefcase: BriefcaseIcon,
  graduation: GraduationIcon,
  video: VideoIcon,
  layers: LayersIcon,
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const MotionSection = ({
  children,
  className,
  id,
  resetKey,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Remount when the course changes so whileInView + stagger re-fire */
  resetKey?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.section
      key={resetKey}
      id={id}
      className={className}
      initial={reduced ? false : "hidden"}
      animate={reduced ? "show" : undefined}
      whileInView={reduced ? undefined : "show"}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -8% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
      }}
    >
      {children}
    </motion.section>
  );
};

const MotionItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : fadeUp}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const CurriculumAccordion = ({
  modules,
  courseKey,
}: {
  modules: { title: string; topics: string[]; outcome: string }[];
  courseKey: string;
}) => {
  const [open, setOpen] = useState(0);

  return (
    <div key={courseKey} className="space-y-2">
      {modules.map((mod, i) => {
        const isOpen = open === i;
        return (
          <article
            key={`${courseKey}-${mod.title}`}
            className={`course-glass-card overflow-hidden transition-[box-shadow,border-color] duration-300 ${
              isOpen ? "border-[#FF2D85]/35 shadow-[0_16px_32px_-14px_rgba(255,45,133,0.16)]" : ""
            }`}
          >
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-right sm:px-5"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF2D85]/10 text-xs font-bold text-[#FF2D85]">
                {i + 1}
              </span>
              <h3 className="flex-1 text-sm font-bold tracking-tight text-ink sm:text-base">{mod.title}</h3>
              <span className={`text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                <ChevronIcon size={16} />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-line/70 px-4 pb-4 pt-3 sm:px-5">
                  <ul className="space-y-1.5 text-sm leading-snug text-muted">
                    {mod.topics.map((topic) => (
                      <li key={topic} className="flex gap-2">
                        <CheckIcon size={13} />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-xl bg-[#FF2D85]/5 px-3 py-2 text-sm">
                    <span className="font-semibold text-[#FF2D85]">תוצר המודול: </span>
                    <span className="text-ink">{mod.outcome}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

const SubTracksGrid = ({
  parent,
  tracks,
  courseKey,
}: {
  parent: Course;
  tracks: Course[];
  courseKey: string;
}) => {
  const { openRegisterModal } = useRegisterModal();
  return (
    <MotionSection resetKey={`${courseKey}-subtracks`} className="py-10 sm:py-12">
      <div className="container-site">
        <MotionItem>
          <SectionHeader
            compact
            kicker="מסלולי משנה"
            title={
              <>
                בחרו את <AccentWord>התוצר</AccentWord> לעסק
              </>
            }
            sub="שלושה מסלולים ממוקדים תחת מסלול לבעלי עסקים - כל אחד עם תוצר ברור בסוף."
          />
        </MotionItem>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {tracks.map((sub) => (
            <MotionItem key={sub.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-white/90 p-4 shadow-sm">
                <span className="text-[11px] font-semibold tracking-wide text-[#FF2D85]">{parent.shortTitle}</span>
                <h3 className="mt-1.5 text-base font-bold text-ink">{sub.shortTitle}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{sub.cardSubtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/courses/${sub.slug}`}
                    className="btn btn-small bg-[#191919] text-[#F4F4F2] hover:brightness-110"
                  >
                    לפרטי המסלול
                    <ArrowIcon />
                  </Link>
                  <Pressable
                    type="button"
                    className="btn-ghost btn-small"
                    rippleTone="pink"
                    onClick={() =>
                      openRegisterModal({ courseId: sub.slug, leadSource: `${sub.leadSource}-hub` })
                    }
                  >
                    הרשמה
                  </Pressable>
                </div>
              </article>
            </MotionItem>
          ))}
        </div>
      </div>
    </MotionSection>
  );
};

const CourseDetail = () => {
  const { slug = "" } = useParams();
  const course = getCourse(slug);
  const { openRegisterModal } = useRegisterModal();
  const reduced = useReducedMotion();
  const parentCourse = course?.parentSlug ? getCourse(course.parentSlug) : undefined;
  const subTracks = course && !course.parentSlug ? getChildCourses(course.slug) : [];
  const courseInstructors = course ? getInstructorsForCourse(course.slug) : [];
  const [instructorBio, setInstructorBio] = useState<InstructorBio>(null);
  const studentWorks = course ? getStudentWorksForCourse(course.slug) : [];

  useSeo({
    title: course ? `${course.title} | ${SITE.name}` : `מסלול | ${SITE.name}`,
    description: course?.tagline ?? "מסלול לימוד AI פרונטלי ומעשי.",
    path: course ? `/courses/${course.slug}` : `/courses/${slug}`,
    schema: course ? [courseSchema(course), faqSchema(course.courseFaq)] : undefined,
  });

  // Re-bind scroll-reveal + motion trees whenever the course slug changes
  useReveal([slug]);

  if (!course) return <NotFound />;
  if (slug !== course.slug) {
    return <Navigate to={`/courses/${course.slug}`} replace />;
  }

  const valueLines = course.valueProposition.split("\n").filter(Boolean);
  const courseKey = course.slug;
  const marketingSyllabus = getMarketingSyllabus(course.slug);

  useEffect(() => {
    trackStandard("ViewContent", {
      content_type: "product",
      content_ids: [course.slug],
      content_name: course.title,
      content_category: course.category,
    });
  }, [course.slug, course.title, course.category]);

  return (
    <div className="course-detail-page" key={courseKey}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <ParallaxLayer speed={0.18} range={40} className="pointer-events-none absolute inset-0 grid-canvas opacity-50" />
        <ParallaxLayer
          speed={0.3}
          range={70}
          className="pointer-events-none absolute -left-20 top-6 h-40 w-40 rounded-full bg-[#FF2D85]/12 blur-3xl"
        />
        <ParallaxLayer
          speed={0.2}
          range={55}
          className="pointer-events-none absolute -right-16 bottom-4 h-44 w-44 rounded-full bg-[rgba(255,45,133,0.08)] blur-3xl"
        />

        <div className="container-site relative py-8 sm:py-10 lg:py-12">
          <div className="mb-4 flex w-full justify-start sm:mb-5">
            <BackButton />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <nav className="mb-3 text-sm text-muted" aria-label="breadcrumb">
              <Link to="/courses" className="inline-flex min-h-11 items-center hover:text-ink">
                מסלולים
              </Link>
              {parentCourse && (
                <>
                  <span className="mx-2">/</span>
                  <Link to={`/courses/${parentCourse.slug}`} className="inline-flex min-h-11 items-center hover:text-ink">
                    {parentCourse.shortTitle}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-ink">{course.shortTitle}</span>
            </nav>

            <motion.div
              key={`${courseKey}-hero`}
              className="flex w-full flex-col items-center"
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="stat-pill mb-2.5 inline-flex border-[#FF2D85]/25 bg-[#FF2D85]/5 text-[#FF2D85]">
                {course.category}
              </span>
              <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>
              <div className="mt-3 max-w-2xl space-y-0.5 text-base leading-snug text-muted sm:text-lg">
                {valueLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="course-hero-meta mt-4 w-full max-w-xl justify-center">
                <div className="course-hero-meta-item text-start">
                  <ClockIcon size={14} />
                  <div>
                    <span className="course-hero-meta-label">משך</span>
                    <span className="course-hero-meta-value">{course.heroMeta.duration}</span>
                  </div>
                </div>
                <div className="course-hero-meta-item text-start">
                  <UsersIcon size={14} />
                  <div>
                    <span className="course-hero-meta-label">פורמט</span>
                    <span className="course-hero-meta-value">{course.heroMeta.format}</span>
                  </div>
                </div>
                <div className="course-hero-meta-item text-start">
                  <FlagIcon size={14} />
                  <div>
                    <span className="course-hero-meta-label">התוצר</span>
                    <span className="course-hero-meta-value">{course.heroMeta.outcome}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <Pressable
                  type="button"
                  className="btn btn-small cursor-pointer bg-[#FF2D85] text-white shadow-pill hover:brightness-105"
                  rippleTone="pink"
                  onClick={() => openRegisterModal({ courseId: course.slug, leadSource: course.leadSource })}
                >
                  שמרו לי מקום
                  <ArrowIcon />
                </Pressable>
                <Pressable as="link" to={getSyllabusHref(course.slug)} className="btn-ghost btn-small" rippleTone="pink">
                  סילבוס
                </Pressable>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {subTracks.length > 0 && (
        <SubTracksGrid parent={course} tracks={subTracks} courseKey={courseKey} />
      )}

      {/* Target audience - lightweight rows */}
      <MotionSection resetKey={`${courseKey}-audience`} className="py-10 sm:py-12">
        <div className="container-site">
          <MotionItem>
            <SectionHeader
              compact
              kicker="קהל יעד"
              title={
                <>
                  למי המסלול <AccentWord>מתאים</AccentWord>
                </>
              }
              
            />
          </MotionItem>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {course.targetAudience.map((profile) => {
              const Icon = AUDIENCE_ICONS[profile.icon];
              return (
                <MotionItem key={`${courseKey}-${profile.title}`}>
                  <article className="group relative flex gap-3.5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FF2D85]/40 hover:shadow-md motion-reduce:hover:translate-y-0">
                    <span
                      className="pointer-events-none absolute inset-y-0 right-0 w-1 origin-right scale-y-0 rounded-l bg-[#FF2D85] transition-transform duration-300 group-hover:scale-y-100"
                      aria-hidden
                    />
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF2D85]/10 text-[#FF2D85] transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1 text-right">
                      <h3 className="mb-1 text-lg font-bold text-zinc-900">{profile.title}</h3>
                      <p className="text-sm leading-relaxed text-zinc-600">{profile.description}</p>
                    </div>
                  </article>
                </MotionItem>
              );
            })}
          </div>
        </div>
      </MotionSection>

      {/* Syllabus - הגרסה השיווקית קודמת לפירוט המודולים הישן */}
      <MotionSection resetKey={`${courseKey}-curriculum`} id="curriculum" className="relative py-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-30" aria-hidden />
        <div className="container-site relative max-w-4xl">
          <MotionItem>
            <SectionHeader
              compact
              kicker="סילבוס"
              title={
                <>
                  מה <AccentWord>לומדים</AccentWord> בסדנה
                </>
              }
              sub={marketingSyllabus ? undefined : course.methodName ?? "כל מודול מסתיים בתוצר מעשי."}
            />
          </MotionItem>
          <MotionItem>
            {marketingSyllabus ? (
              <SyllabusBlocks syllabus={marketingSyllabus} />
            ) : (
              <CurriculumAccordion courseKey={courseKey} modules={course.curriculum} />
            )}
          </MotionItem>
        </div>
      </MotionSection>

      {courseInstructors.length > 0 && (
        <MotionSection resetKey={`${courseKey}-instructors`} className="py-10 sm:py-12">
          <div className="container-site">
            <MotionItem>
              <SectionHeader
                compact
                center
                kicker="המנחה"
                title={
                  <>
                    מי <AccentWord>מנחה</AccentWord> את הסדנה
                  </>
                }
                sub="לחצו על המנחה כדי לקרוא עליו."
              />
            </MotionItem>
            <div className="mt-10 flex flex-wrap items-start justify-center gap-x-16 gap-y-12">
              {courseInstructors.map(({ instructor, bio }) => (
                <MotionItem key={instructor.id}>
                  <InstructorAvatar instructor={instructor} bio={bio} onOpen={setInstructorBio} />
                </MotionItem>
              ))}
            </div>
          </div>
        </MotionSection>
      )}

      {studentWorks.length > 0 && (
        <div className="bg-[#F4F4F2]/60">
          <StudentWorksCarousel works={studentWorks} />
        </div>
      )}

      {/* Deliverables - featured bento */}
      <MotionSection resetKey={`${courseKey}-deliverables`} className="relative py-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 grid-canvas opacity-25" aria-hidden />
        <div className="container-site relative">
          <MotionItem>
            <SectionHeader
              compact
              kicker="תוצרים"
              title={
                <>
                  מה תצאו <AccentWord>איתו</AccentWord> מהמסלול
                </>
              }
              sub="תוצרים אמיתיים שנבנים במהלך המסלול - לא רק ידע תיאורטי."
            />
          </MotionItem>

          <div className="deck-strip">
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12">
              {course.deliverables.map((item, i) => {
                const Icon = AUDIENCE_ICONS[item.icon];
                const featured = i === 0;
                const span = featured
                  ? "md:col-span-2 lg:col-span-7 lg:row-span-2"
                  : i === course.deliverables.length - 1
                    ? "md:col-span-2 lg:col-span-12"
                    : "lg:col-span-5";
                return (
                  <MotionItem key={`${courseKey}-${item.title}`} className={span}>
                    <MagneticCard
                      as="article"
                      className={`course-deliverable-card flex h-full flex-col p-5 ${
                        featured
                          ? "course-deliverable-featured min-h-[200px] justify-center sm:min-h-[220px] lg:min-h-full lg:p-7"
                          : ""
                      }`}
                      tilt={featured ? 9 : 7}
                      scale={1.015}
                      lift={-6}
                    >
                      <MagneticDepth z={32}>
                        <span
                          className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[1.15rem] ${
                            featured ? "bg-[#FF2D85] text-white" : "bg-[#121212] text-white"
                          }`}
                        >
                          <Icon size={featured ? 18 : 16} />
                        </span>
                      </MagneticDepth>
                      <h3
                        className={`font-bold tracking-tight text-ink ${
                          featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={`mt-2 leading-relaxed text-muted ${
                          featured ? "max-w-md text-sm sm:text-base" : "text-sm"
                        }`}
                      >
                        {item.description}
                      </p>
                    </MagneticCard>
                  </MotionItem>
                );
              })}
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Bottom registration CTA */}
      <MotionSection resetKey={`${courseKey}-register`} id="registration-form" className="scroll-mt-20 py-10 sm:py-12">
        <div className="container-site">
          <MotionItem>
            <div className="course-register-banner relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-15" aria-hidden>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to left, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                  }}
                />
              </div>

              <div className="relative grid gap-5 lg:grid-cols-[1fr_minmax(0,400px)] lg:items-center lg:gap-6">
                <div className="text-white">
                  <span className="mb-2 inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
                    הרשמה למסלול
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    מוכנים להתחיל ?
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                    השאירו פרטים ונחזור אליכם עם מועדים ופרטי המסלול - בלי התחייבות.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-white/85">
                    <li className="flex gap-2">
                      <CheckIcon size={13} />
                      <span>{course.heroMeta.outcome}</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckIcon size={13} />
                      <span>{course.heroMeta.format}</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckIcon size={13} />
                      <span>{course.experienceLevel}</span>
                    </li>
                  </ul>
                </div>

                <div className="relative rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-xl">
                  <RegisterForm
                    key={courseKey}
                    preselectedCourse={course.slug}
                    lockCourse
                    leadSource={`${course.leadSource}-page`}
                    title={course.ctaText}
                    sub="המסלול כבר נבחר. נחזור אליכם עם הפרטים."
                  />
                </div>
              </div>
            </div>
          </MotionItem>
        </div>
      </MotionSection>

      {/* FAQ - bottom of page */}
      <MotionSection resetKey={`${courseKey}-faq`} className="bg-white/40 py-10 sm:py-12">
        <div className="container-site max-w-3xl">
          <MotionItem>
            <SectionHeader
              compact
              kicker="שאלות"
              title={
                <>
                  שאלות <AccentWord>ותשובות</AccentWord>
                </>
              }
            />
          </MotionItem>
          <MotionItem>
            <FAQAccordion key={courseKey} items={course.courseFaq} compact />
          </MotionItem>
        </div>
      </MotionSection>

      <InstructorBioModal value={instructorBio} onClose={() => setInstructorBio(null)} />
    </div>
  );
};

export default CourseDetail;
export { CourseDetail as CourseDetailPage };
