import { useEffect } from "react";
import ChatFinder from "../components/ChatFinder";
import FAQAccordion from "../components/FAQAccordion";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StickyCoursesShowcase from "../components/StickyCoursesShowcase";
import Pressable from "../components/Pressable";
import { StaggerGroup, StaggerItem, MagneticCard, ScrollReveal3D } from "../components/motion";
import HeroBackdrop from "../components/motion/hero/HeroBackdrop";
import { GENERAL_FAQ, SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { acquirePointerStore } from "../lib/motion";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

const WHY_FROM = ["left", "right", "up", "left", "right"] as const;

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
      <section className="relative overflow-x-clip overflow-y-hidden">
        <HeroBackdrop />
        <div
          className="pointer-events-none absolute inset-0 z-[1] grid-canvas opacity-70"
          aria-hidden
        />
        <div className="container-site relative z-[2] flex flex-col items-center justify-center py-14 text-center sm:py-24 lg:py-32">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-1 lg:max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:mb-8">
              <span className="stat-pill">מסלולים מעשיים</span>
              <span className="stat-pill">לימוד פרונטלי</span>
              <span className="stat-pill">יוצאים עם תוצר</span>
            </div>
            <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-7xl lg:text-8xl">
              {SITE.hero.title}{" "}
              <AccentWord>{SITE.hero.titleAccent}</AccentWord>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted sm:mt-6 sm:text-lg md:text-xl">
              {SITE.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
              <Pressable as="link" to="/courses" className="btn-primary">
                {SITE.hero.primaryCta}
              </Pressable>
              <Pressable as="a" href="#finder" className="btn-ghost" rippleTone="pink">
                {SITE.hero.secondaryCta}
              </Pressable>
            </div>
          </div>
        </div>
      </section>

      <section id="finder" className="py-12 sm:py-16 lg:py-20">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
            <SectionHeader
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

      <section className="pt-12 sm:pt-16 lg:pt-20">
        <div className="container-site pb-8 sm:pb-10">
          <SectionHeader
            kicker="מסלולים"
            title={<>חמישה מסלולים. <AccentWord>תוצר</AccentWord> אחד לכל אחד.</>}
            sub={SITE.claim}
          />
        </div>
        <StickyCoursesShowcase vhPerSlide={vhPerSlide} />
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container-site">
          <SectionHeader
            kicker="למה פרונטלי"
            title={<>לומדים <AccentWord>בזמן אמת</AccentWord></>}
            sub="האקדמיה בנויה סביב עבודה מעשית, פידבק מיידי, ותוצר שיוצא איתכם הביתה."
          />
          <div className="deck-strip">
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
                      className="glow-edge h-full rounded-[1.75rem] border border-white/40 bg-white p-5 shadow-card ring-1 ring-ink/5"
                      tilt={6}
                      scale={1.02}
                      lift={-6}
                      unroll={false}
                    >
                      <h3 className="font-normal">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                    </MagneticCard>
                  </ScrollReveal3D>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      <section id="registration-form" className="scroll-mt-24 py-12 sm:py-16 lg:py-24">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <SectionHeader
              as="h2"
              kicker="הצעד הבא"
              title={<>מוכנים? <AccentWord>השאירו פרטים.</AccentWord></>}
              sub="נחזור אליכם עם כל הפרטים על המסלול, תאריכים כשייסגרו, ותשובות לכל שאלה. בלי ספאם."
            />
            <ScrollReveal3D from="right" intensity="quiet" fromRotateX={7} fromY={24}>
              <RegisterForm
                preselectedCourse={inlinePrefill.courseId}
                initialGoal={inlinePrefill.initialGoal}
                leadSource={inlinePrefill.leadSource ?? "home-lead"}
                title="טופס הרשמה "
                sub="אם עברתם דרך המנחה, המסלול כבר נבחר בשבילכם."
              />
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container-site">
          <SectionHeader kicker="שאלות" title="שאלות נפוצות" center />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={20}>
            <FAQAccordion items={[...GENERAL_FAQ]} />
          </ScrollReveal3D>
        </div>
      </section>
    </>
  );
};

export default Home;
