import { useEffect } from "react";
import ChatFinder from "../components/ChatFinder";
import FAQAccordion from "../components/FAQAccordion";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StickyCoursesShowcase from "../components/StickyCoursesShowcase";
import Hero from "../components/Hero";
import { StaggerGroup, StaggerItem, MagneticCard, ScrollReveal3D } from "../components/motion";
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
      <Hero />

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
                title="השאירו פרטים "
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
