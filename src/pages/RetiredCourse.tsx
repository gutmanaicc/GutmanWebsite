import { Link, useLocation, useParams } from "react-router-dom";
import { SITE } from "../data/site";
import { useSeo } from "../lib/seo";

const RETIRED_NAMES: Record<string, string> = {
  "ai-fashion": "בינה מלאכותית באופנה",
  "ai-for-students": "AI לסטודנטים",
  "ai-for-therapists": "AI למטפלים ופסיכולוגים",
};

export default function RetiredCourse({ slug: providedSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const slug = providedSlug ?? params.slug ?? pathname.split("/").filter(Boolean).pop() ?? "";
  const name = RETIRED_NAMES[slug] ?? "המסלול הקודם";
  useSeo({
    title: `${name}, עמוד ארכיון | ${SITE.name}`,
    description: "המסלול אינו מוצע להרשמה חדשה. משתתפים קיימים מוזמנים לפנות לאקדמיה לבירור ההתחייבויות והמידע הנוגע להרשמתם.",
    path: pathname,
    noindex: true,
  });

  return (
    <section className="container-site py-20 sm:py-28" aria-labelledby="retired-title">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-brand">עמוד ארכיון</p>
        <h1 id="retired-title" className="mt-4 text-3xl font-bold sm:text-5xl">{name}</h1>
        <p className="mt-6 text-xl leading-relaxed">המסלול הזה אינו מוצע כעת להרשמה חדשה.</p>
        <p className="mt-4 leading-relaxed academy-muted">האקדמיה עוברת למתכונת של סמינרים מעשיים ביום אחד. העמוד נשמר כדי שקישורים קודמים ימשיכו להוביל למידע ברור.</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">כבר נרשמתם למסלול הזה?</h2>
          <p className="mt-3 leading-relaxed academy-muted">השינוי בקטלוג אינו מבטל התחייבויות קודמות ואינו מעביר אתכם לסמינר אחר. לבירור מפגשים, רכישה, מסמכים או התחייבויות שנותרו, פנו אלינו עם פרטי ההרשמה. אין לשלוח פרטי כרטיס אשראי.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <a className="btn-ghost" href={`mailto:${SITE.contact.email}`}><span dir="ltr">{SITE.contact.email}</span></a>
            <a className="btn-ghost" href={`tel:+972${SITE.contact.phone.replace(/\D/g, "").slice(1)}`}><span dir="ltr">{SITE.contact.phone}</span></a>
          </div>
        </div>
        <Link className="btn-primary mt-8" to="/courses">לסמינרים הנוכחיים</Link>
      </div>
    </section>
  );
}
