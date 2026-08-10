import ChatFinder from "../components/ChatFinder";
import FAQAccordion from "../components/FAQAccordion";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StickyCoursesShowcase from "../components/StickyCoursesShowcase";
import { MOCK_WINDOWS } from "../components/MockWindows";
import Pressable from "../components/Pressable";
import { StaggerGroup, StaggerItem, MagneticCard, ScrollReveal3D } from "../components/motion";
import HeroBackdrop from "../components/motion/hero/HeroBackdrop";
import { GENERAL_FAQ, SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

const Home = () => {
  const { inlinePrefill, setInlinePrefill } = useRegisterModal();

  useSeo({
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.hero.subtitle,
    path: "/",
    schema: [orgSchema()],
  });

  useReveal([inlinePrefill.courseId]);

  const handleFinderResult = (slug: string, goal?: string) => {
    setInlinePrefill({ courseId: slug, initialGoal: goal, leadSource: "chat-finder-home" });
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <div className="container-site relative z-[1] py-16 sm:py-24 lg:py-28">
          <div className="max-w-4xl">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="stat-pill">מסלולים מעשיים</span>
              <span className="stat-pill">לימוד פרונטלי</span>
              <span className="stat-pill">יוצאים עם תוצר</span>
            </div>
            <h1 className="text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
              {SITE.hero.title}{" "}
              <AccentWord>{SITE.hero.titleAccent}</AccentWord>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{SITE.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
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

      <section id="finder" className="py-16 sm:py-20">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <SectionHeader
              kicker="המנחה"
              title={<>לא בטוחים? <AccentWord>נכוון</AccentWord> אתכם.</>}
              sub="שתי שאלות קצרות, והמנחה של האקדמיה ימליץ על המסלול שמתאים למטרה שלכם. בסוף, מעבירים אתכם ישר לטופס עם המסלול שכבר נבחר."
            />
            <ScrollReveal3D fromRotateX={10} fromY={24}>
              <ChatFinder onResult={handleFinderResult} />
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      <section className="pt-16 sm:pt-20">
        <div className="container-site pb-10">
          <SectionHeader
            kicker="מסלולים"
            title={<>חמישה מסלולים. <AccentWord>תוצר</AccentWord> אחד לכל אחד.</>}
            sub={SITE.claim}
          />
        </div>
        <StickyCoursesShowcase vhPerSlide={110} />
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-site">
          <SectionHeader
            kicker="למה פרונטלי"
            title={<>לומדים <AccentWord>בזמן אמת</AccentWord></>}
            sub="האקדמיה בנויה סביב עבודה מעשית, פידבק מיידי, ותוצר שיוצא איתכם הביתה."
          />
          <div className="deck-strip">
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
              {SITE.whyFrontal.map((item) => (
                <StaggerItem key={item.title} className="h-full">
                  <ScrollReveal3D className="h-full" fromRotateX={12} fromY={30}>
                    <MagneticCard
                      as="article"
                      className="h-full rounded-[1.75rem] border border-white/40 bg-white p-5 shadow-card ring-1 ring-ink/5"
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

      <section id="registration-form" className="scroll-mt-24 py-16 sm:py-24">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHeader
                as="h2"
                kicker="הצעד הבא"
                title={<>מוכנים? <AccentWord>השאירו פרטים.</AccentWord></>}
                sub="נחזור אליכם עם כל הפרטים על המסלול, תאריכים כשייסגרו, ותשובות לכל שאלה. בלי ספאם."
              />
              <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2" stagger={0.06}>
                {MOCK_WINDOWS.slice(0, 2).map((Win, i) => (
                  <StaggerItem key={i}>
                    <ScrollReveal3D fromRotateX={12} fromY={26}>
                      <Win />
                    </ScrollReveal3D>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
            <ScrollReveal3D fromRotateX={9} fromY={22}>
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

      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <SectionHeader kicker="שאלות" title="שאלות נפוצות" center />
          <ScrollReveal3D fromRotateX={8} fromY={20}>
            <FAQAccordion items={[...GENERAL_FAQ]} />
          </ScrollReveal3D>
        </div>
      </section>
    </>
  );
};

export default Home;
