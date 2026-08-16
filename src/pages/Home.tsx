import { useEffect } from "react";
import ChatFinder from "../components/ChatFinder";
import FAQAccordion from "../components/FAQAccordion";
import HomeProof from "../components/HomeProof";
import Marquee from "../components/Marquee";
import ProcessSection from "../components/ProcessSection";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StackingCourses from "../components/StackingCourses";
import NightHero from "../components/NightHero";
import InstructorsShowcase from "../components/InstructorsShowcase";
import Pressable from "../components/Pressable";
import { WhatsAppIcon } from "../components/icons";
import { StaggerGroup, StaggerItem, ScrollReveal3D } from "../components/motion";
import { GENERAL_FAQ, SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { acquirePointerStore } from "../lib/motion";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

const WHY_FROM = ["left", "right", "up", "left", "right"] as const;

const MARQUEE_ITEMS = SITE.principles.map((p) => p.title);

const Home = () => {
  const { inlinePrefill, setInlinePrefill } = useRegisterModal();

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
      <NightHero />

      <div className="relative z-[2] bg-canvas">
      <Marquee items={MARQUEE_ITEMS} />


      <section id="finder" className="py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
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

      <section className="pt-4 sm:pt-6">
        <div className="container-site pb-8 sm:pb-10">
          <SectionHeader
            kicker="מסלולים"
            title={<>חמש סדנאות. <AccentWord>תוצר</AccentWord> אחד לכל אחת.</>}
            sub={SITE.claim}
            center
          />
        </div>
        <StackingCourses />
      </section>

      <section className="py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <SectionHeader
            kicker="למה פרונטלי"
            title={<>לומדים <AccentWord>בזמן אמת</AccentWord></>}
            sub="האקדמיה בנויה סביב עבודה מעשית, פידבק מיידי, ותוצר שיוצא איתכם הביתה."
            center
          />
          {/* לוחות כהים על הקנבס: מספר זעיר, קו שיער שנמתח בהובר, וזוהר ורוד */}
          <StaggerGroup
            className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] bg-white/10 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.06}
          >
            {SITE.whyFrontal.map((item, i) => (
              <StaggerItem key={item.title} className="h-full">
                <ScrollReveal3D
                  className="h-full"
                  from={WHY_FROM[i % WHY_FROM.length]}
                  intensity="quiet"
                  fromRotateX={6}
                  fromY={26}
                >
                  <article className="why-tile group relative flex h-full flex-col bg-canvas p-7 text-bone transition-colors duration-500 sm:p-9">
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-px origin-right scale-x-0 bg-brand transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                      style={{ background: "radial-gradient(circle, rgba(255,95,158,0.3) 0%, rgba(255,95,158,0) 70%)" }}
                      aria-hidden
                    />

                    <span
                      className="text-[11px] font-medium tracking-[0.22em] text-bone/30 transition-colors duration-500 group-hover:text-brand"
                      dir="ltr"
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-7 font-display text-xl font-bold leading-snug tracking-tight sm:text-[1.4rem]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-bone/50">{item.text}</p>
                  </article>
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

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="container-site">
          <div className="rounded-[2rem] bg-bone px-5 py-12 text-ink sm:rounded-[2.5rem] sm:px-10 sm:py-16">
          <SectionHeader kicker="שאלות" title="שאלות נפוצות" center />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={20}>
            <FAQAccordion items={[...GENERAL_FAQ]} />
          </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* סגירה הפוכה: על האתר השחור, הבלוק הסוגר הוא שנהב שמתעגל מעל הפוטר */}
      <section className="mt-10 rounded-t-[3rem] bg-bone py-24 text-center text-ink sm:mt-14 sm:py-32">
        <div className="container-site flex flex-col items-center">
          <span className="section-label mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {SITE.hebrewName}
          </span>
          <h2 className="display-1 max-w-4xl">
            לא רק ללמוד. <AccentWord>לדעת.</AccentWord>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/60 sm:text-lg">
            מגיעים עם העסק, הלימודים או הפרויקט שלכם. יוצאים עם תוצר שעובד ושיטה שנשארת.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Pressable
              as="link"
              to="/courses"
              className="btn bg-ink text-white hover:bg-black"
            >
              {SITE.hero.primaryCta}
            </Pressable>
            <Pressable
              as="a"
              href={SITE.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-ink/25 text-ink hover:border-ink/50"
              rippleTone="pink"
            >
              <WhatsAppIcon size={19} className="shrink-0 text-[#25D366]" />
              דברו איתנו בוואטסאפ
            </Pressable>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default Home;
