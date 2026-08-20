import { useEffect } from "react";
import ChatFinder from "../components/ChatFinder";
import ClosingCta from "../components/ClosingCta";
import FAQAccordion from "../components/FAQAccordion";
import HomeProof from "../components/HomeProof";
import Marquee from "../components/Marquee";
import ProcessSection from "../components/ProcessSection";
import RegisterForm from "../components/RegisterForm";
import SectionHeader, { AccentWord } from "../components/SectionHeader";
import StackingCourses from "../components/StackingCourses";
import NightHero from "../components/NightHero";
import InstructorsShowcase from "../components/InstructorsShowcase";
import { ScrollReveal3D } from "../components/motion";
import { GENERAL_FAQ, SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { acquirePointerStore } from "../lib/motion";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

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
    setInlinePrefill({ courseId: slug, initialGoal: goal, leadSource: "chat-finder-scrolled" });
  };

  return (
    <>
      <NightHero />

      {/*
        * שקוף, לא bg-canvas.
        *
        * העטיפה הזו הייתה אטומה וכיסתה את רשת הרקע הגלובלית שיושבת
        * ב-z-0, ולכן הרשת נעלמה בכל עמוד הבית מתחת להירו. כל סקשן שרצה
        * רשת נאלץ להוסיף לעצמו שכבה מקומית, וכך נוצר רקע טלאים. עכשיו
        * הרשת הגלובלית נראית ברציפות מתחת לכל התוכן.
        */}
      <div className="relative z-[2]">
      <Marquee items={MARQUEE_ITEMS} />


      <section id="finder" className="py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <SectionHeader
            kicker="המנחה"
            title={<>לא בטוחים? <AccentWord>נכוון</AccentWord> אתכם.</>}
            sub="שתי שאלות קצרות, והמנחה של האקדמיה ימליץ על המסלול שמתאים למטרה שלכם. בסוף, מעבירים אתכם ישר לטופס עם המסלול שכבר נבחר."
          />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={8} fromY={28}>
            <div className="mx-auto w-full max-w-2xl">
              <ChatFinder onResult={handleFinderResult} />
            </div>
          </ScrollReveal3D>
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

      {/*
        * "איך זה עובד" עלה לכאן במקום סקשן "למה פרונטלי" שהיה כאן קודם.
        *
        * שניהם ישבו על אותו עמוד וסיפרו את אותו דבר בניסוח אחר - עבודה על
        * החומר שלכם, בזמן אמת, ויוצאים עם תוצר. אחרי האיחוד הסיפור נאמר
        * פעם אחת, העמוד התקצר בסקשן שלם, וטופס הלידים עלה מעלה.
        * הטקסטים של whyFrontal נשארו ב-src/data/site.ts.
        */}
      <ProcessSection />

      <HomeProof />

      <InstructorsShowcase />

      <section id="registration-form" className="scroll-mt-24 py-14 sm:py-20 lg:py-24">
        <div className="container-site">
          <SectionHeader
            as="h2"
            kicker="הצעד הבא"
            title={<>מוכנים? <AccentWord>השאירו פרטים.</AccentWord></>}
            sub="נחזור אליכם עם כל הפרטים על המסלול, תאריכים כשייסגרו, ותשובות לכל שאלה. בלי ספאם."
          />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={7} fromY={24}>
            <div className="mx-auto w-full max-w-xl">
              <RegisterForm
                preselectedCourse={inlinePrefill.courseId}
                initialGoal={inlinePrefill.initialGoal}
                leadSource={inlinePrefill.leadSource ?? "home-lead"}
                title="השאירו פרטים "
                sub="אם עברתם דרך המנחה, המסלול כבר נבחר בשבילכם."
              />
            </div>
          </ScrollReveal3D>
        </div>
      </section>

      <section className="border-t border-white/10 py-14 sm:py-20">
        <div className="container-site">
          <SectionHeader kicker="שאלות" title="שאלות נפוצות" center />
          <ScrollReveal3D from="up" intensity="quiet" fromRotateX={6} fromY={20}>
            <FAQAccordion items={[...GENERAL_FAQ]} />
          </ScrollReveal3D>
        </div>
      </section>

      {/* סגירה שקטה: אותו קנבס כהה, קו שיער אחד, וטיפוגרפיה במידה */}
      {/* קודם "לצפייה במסלולים" היה הכפתור המלא כאן, והשארת הפרטים הייתה המשני */}
      <ClosingCta
        leadSource="home-closing"
        title={
          <>
            לא רק ללמוד. <AccentWord>לדעת.</AccentWord>
          </>
        }
        sub="מגיעים עם העסק, הלימודים או הפרויקט שלכם. יוצאים עם תוצר שעובד ושיטה שנשארת."
      />
      </div>
    </>
  );
};

export default Home;
