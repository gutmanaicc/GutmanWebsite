import SectionHeader, { AccentWord } from "../components/SectionHeader";
import Pressable from "../components/Pressable";
import { ParallaxLayer, StaggerGroup, StaggerItem, MagneticCard, ScrollReveal3D } from "../components/motion";
import { SITE } from "../data/site";
import { useRegisterModal } from "../context/RegisterModalContext";
import { useReveal } from "../lib/useReveal";
import { orgSchema, useSeo } from "../lib/seo";

const About = () => {
  const { openRegisterModal } = useRegisterModal();

  useSeo({
    title: `אודות | ${SITE.name}`,
    description: SITE.founder.bio,
    path: "/about",
    schema: [orgSchema()],
  });

  useReveal();

  return (
    <>
      <section className="relative overflow-hidden">
        <ParallaxLayer
          speed={0.2}
          range={48}
          className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-[#FF2D85]/10 blur-3xl"
        />
        <ParallaxLayer
          speed={0.12}
          range={40}
          className="pointer-events-none absolute -right-8 bottom-0 h-52 w-52 rounded-full bg-[rgba(255,45,133,0.07)] blur-3xl"
        />
        <div className="container-site relative py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              אודות
            </p>
            <h1 className="text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl">
              {SITE.hebrewName}.{" "}
              <AccentWord>לומדים לעבוד עם AI.</AccentWord>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{SITE.claim}</p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <SectionHeader
              kicker={SITE.founder.title}
              title={
                <>
                  {SITE.founder.name}. <AccentWord>מייסד.</AccentWord>
                </>
              }
              sub={SITE.founder.bio}
            />
            <ScrollReveal3D fromRotateX={11} fromY={28}>
              <div className="rounded-[1.75rem] border border-white/40 bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-8">
                <p className="text-sm leading-relaxed text-muted">
                  האקדמיה בנויה סביב עבודה מעשית, פידבק מיידי, ותוצר שיוצא איתכם הביתה - לא סדרת הקלטות ולא רשימת כלים בלי שיטה.
                </p>
                <Pressable
                  type="button"
                  className="btn-primary mt-6"
                  onClick={() => openRegisterModal({ leadSource: "about-cta" })}
                >
                  השאירו פרטים
                </Pressable>
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <SectionHeader
            kicker="עקרונות"
            title={
              <>
                איך אנחנו <AccentWord>מלמדים</AccentWord>
              </>
            }
            sub="חמישה עקרונות שמנחים כל מסלול באקדמיה."
          />
          <div className="deck-strip">
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
              {SITE.principles.map((item) => (
                <StaggerItem key={item.title} className="h-full">
                  <ScrollReveal3D className="h-full" fromRotateX={12} fromY={30}>
                    <MagneticCard
                      as="article"
                      className="h-full rounded-[1.75rem] border border-white/40 bg-canvas p-5 shadow-card ring-1 ring-ink/5"
                      tilt={6}
                      scale={1.02}
                      lift={-6}
                      unroll={false}
                    >
                      <h3 className="font-normal text-ink">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                    </MagneticCard>
                  </ScrollReveal3D>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
