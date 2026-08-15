import { useEffect } from "react";
import ChatFinder from "../components/ChatFinder";
import FAQAccordion from "../components/FAQAccordion";
import HomeProof from "../components/HomeProof";
import Marquee from "../components/Marquee";
import ProcessSection from "../components/ProcessSection";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StatsBand from "../components/StatsBand";
import StickyCoursesShowcase from "../components/StickyCoursesShowcase";
import Hero from "../components/Hero";
import InstructorsShowcase from "../components/InstructorsShowcase";
import Pressable from "../components/Pressable";
import { WhatsAppIcon } from "../components/icons";
import { StaggerGroup, StaggerItem, MagneticCard, ScrollReveal3D } from "../components/motion";
import { GENERAL_FAQ, SITE } from "../data/site";
import { INSTRUCTORS } from "../data/instructorsData";
import { STUDENT_WORKS } from "../data/studentWorksData";
import { useRegisterModal } from "../context/RegisterModalContext";
import { acquirePointerStore } from "../lib/motion";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

const WHY_FROM = ["left", "right", "up", "left", "right"] as const;

/* כל המספרים אמיתיים: הביקורות הן ההצהרה הקיימת מההירו, השאר נספרים מהדאטה */
const STATS = [
  { value: 100, suffix: "+", label: "ביקורות של משתתפים" },
  { value: INSTRUCTORS.length, label: "מנחים שמובילים את המסלולים" },
  { value: STUDENT_WORKS.length, label: "עבודות תלמידים באתר" },
];

const MARQUEE_ITEMS = SITE.principles.map((p) => p.title);

const Home = () => {
  const { inlinePrefill, setInlinePrefill } = useRegisterModal();
  // Curtains are always 100dvh; prop kept for StickyCoursesShowcase API compat
  const vhPerSlide = 100;

  useSeo({
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.hero.subtitle,
    path: "/",
    schema: [orgSchema()],
  });

  useReveal([inlinePrefill.courseId]);

  useEffect(() => acquirePointerStore(), []);

  const handleFinderResult = (slug: string, goal?: string) => {
    setInlinePrefill({ courseId: slug, initialGoal: goal, leadSource: "chat-finder-home" });
  };

  return (
    <>
      <Hero />

      <Marquee items={MARQUEE_ITEMS} />

      <section id="finder" className="py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <SectionHeader
              index="01"
              kicker="המנחה"
              title={<>לא בטוחים? <AccentWord>נכוון</AccentWord> אתכם.</>}
              sub="שתי שאלות קצרות, והמנחה של האקדמיה ימליץ על המסלול שמתאים למטרה שלכם. בסוף, מעבירים אתכם ישר לטופס עם המסלול שכבר נבחר."
            />
            <ScrollReveal3D from="left" intensity="quiet" fromRotateX={8} fromY={28}>
              <ChatFinder onResult={handleFinderResult} />
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      <section className="pt-4 sm:pt-6">
        <div className="container-site pb-8 sm:pb-10">
          <SectionHeader
            index="02"
            kicker="מסלולים"
            title={<>חמישה מסלולים. <AccentWord>תוצר</AccentWord> אחד לכל אחד.</>}
            sub={SITE.claim}
          />
        </div>
        <StickyCoursesShowcase vhPerSlide={vhPerSlide} />
      </section>

      <StatsBand stats={STATS} />

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <SectionHeader
            index="03"
            kicker="למה פרונטלי"
            title={<>לומדים <AccentWord>בזמן אמת</AccentWord></>}
            sub="האקדמיה בנויה סביב עבודה מעשית, פידבק מיידי, ותוצר שיוצא איתכם הביתה."
          />
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {SITE.whyFrontal.map((item, i) => (
              <StaggerItem key={item.title} className="h-full">
                <ScrollReveal3D
                  className="h-full"
                  from={WHY_FROM[i % WHY_FROM.length]}
                  intensity="default"
                  fromRotateX={9}
                  fromY={32}
                >
                  <MagneticCard
                    as="article"
                    className="relative h-full overflow-hidden rounded-[1.5rem] border border-line bg-white p-6 pt-7 shadow-card"
                    tilt={6}
                    scale={1.02}
                    lift={-6}
                    unroll={false}
                  >
                    <span
                      className="pointer-events-none absolute left-5 top-4 text-4xl font-semibold leading-none tracking-tightest text-ink/10"
                      dir="ltr"
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                  </MagneticCard>
                </ScrollReveal3D>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <HomeProof />

      <ProcessSection />

      <InstructorsShowcase />

      <section id="registration-form" className="scroll-mt-24 py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <SectionHeader
              as="h2"
              index="06"
              kicker="הצעד הבא"
              title={<>מוכנים? <AccentWord>השאירו פרטים.</AccentWord></>}
              sub="נחזור אליכם עם כל הפרטים על המסלול, תאריכים כשייסגרו, ותשובות לכל שאלה. בלי ספאם."
            />
            <ScrollReveal3D from="right" intensity="quiet" fromRotateX={7} fromY={24}>
              <RegisterForm
                preselectedCourse={inlinePrefill.courseId}
                initialGoal={inlinePrefill.initialGoal}
                leadSource={inlinePrefill.leadSource ?? "home-lead"}
                title="השאירו פרטים "
                sub="אם עברתם דרך המנחה, המסלול כבר נבחר בשבילכם."
              />
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white/60 py-14 sm:py-16 lg:py-20">
        <div className="container-site">
          <SectionHeader kicker="שאלות" title="שאלות נפוצות" center />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={20}>
            <FAQAccordion items={[...GENERAL_FAQ]} />
          </ScrollReveal3D>
        </div>
      </section>

      {/* סגירה גדולה בסגנון orbix: כותרת ענקית וזוג גלולות, רגע לפני הפוטר הכהה */}
      <section className="border-t border-line py-20 text-center sm:py-28">
        <div className="container-site flex flex-col items-center">
          <span className="section-label mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {SITE.hebrewName}
          </span>
          <h2 className="display-1 max-w-4xl text-ink">
            לא רק ללמוד. <AccentWord>לדעת.</AccentWord>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            מגיעים עם העסק, הלימודים או הפרויקט שלכם. יוצאים עם תוצר שעובד ושיטה שנשארת.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <Pressable as="link" to="/courses" className="btn-primary">
              {SITE.hero.primaryCta}
            </Pressable>
            <Pressable
              as="a"
              href={SITE.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              rippleTone="pink"
            >
              <WhatsAppIcon size={19} className="shrink-0 text-[#25D366]" />
              דברו איתנו בוואטסאפ
            </Pressable>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
