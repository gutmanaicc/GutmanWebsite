import { Boxes, Clock, Users, Wallet } from "lucide-react";
import { Reveal } from "../motion";
import type { PainCard } from "../../data/fashionLanding";

/*
 * מיפוי מפתח האייקון מהדאטה לרכיב lucide.
 * הדאטה נשארת מחרוזות בלבד, וה-JSX חי כאן.
 */
const ICONS = {
  boxes: Boxes,
  wallet: Wallet,
  clock: Clock,
  users: Users,
} as const;

/**
 * ארבעת הכאבים כבנטו של אריחים, במקום ארבע פסקאות.
 *
 * כל אריח: אייקון + כותרת של 2-3 מילים + שורה אחת. הפירוט שהיה קודם
 * (עשרות מילים לכרטיס) ירד: הוא שירת את שיחת המכירה, לא את ההחלטה
 * להשאיר פרטים, ובדף קר מ-IG הוא בדיוק הקיר שגורם לנטישה.
 *
 * האריח הראשון ("פרסום מחכה למלאי") הוא הדיפרנציאטור ולכן הוא רחב
 * (span 2) ומסומן בוורוד. השאר 1x1.
 *
 * בלי הובר-סקייל ובלי צל מונפש: transform/opacity בלבד דרך Reveal,
 * וזה נצבע פעם אחת. מטרות מגע לא רלוונטיות כי האריחים אינם לחיצים.
 */
const PainBento = ({ cards }: { cards: readonly PainCard[] }) => {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
      {cards.map((card, i) => {
        const Icon = ICONS[card.icon];
        const featured = i === 0;
        return (
          <Reveal
            key={card.title}
            variant="scale"
            delay={i * 0.06}
            className={featured ? "sm:col-span-2" : undefined}
          >
            <article
              className={`flex h-full items-start gap-3.5 rounded-2xl border p-4 shadow-card sm:p-5 ${
                featured
                  ? "border-[#FF2D85]/35 bg-[#FF2D85]/[0.06]"
                  : "border-white/10 bg-surface-1"
              }`}
            >
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
                  featured ? "bg-[#FF2D85]/15 text-[#FF2D85]" : "bg-white/[0.04] text-bone/70"
                }`}
                aria-hidden
              >
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-snug tracking-tight text-bone">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-bone/60">{card.body}</p>
              </div>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
};

export default PainBento;
