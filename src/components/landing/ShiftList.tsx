import { ArrowIcon } from "../icons";
import { Reveal } from "../motion";
import type { ShiftRow } from "../../data/fashionLanding";

/**
 * "מה השתנה" כארבע שורות מקוצרות, במקום טבלת before/after עם שמונה
 * בלוקי טקסט.
 *
 * ה-before ירד לתגית קטנה חוצת-קו מעל השורה. ה-after הוא השורה
 * האמיתית, מודגשת, עם חץ. קוראים ארבע שורות במקום שמונה, בלי שום
 * מנגנון אינטראקטיבי חדש. reduced-motion לא רלוונטי כי אין תנועה
 * מלבד ה-Reveal החד-פעמי.
 */
const ShiftList = ({
  rows,
  beforeLabel,
  afterLabel,
}: {
  rows: readonly ShiftRow[];
  beforeLabel: string;
  afterLabel: string;
}) => {
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <Reveal>
        <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-bone/35">
          <span className="line-through decoration-bone/25">{beforeLabel}</span>
          <ArrowIcon size={12} />
          <span className="text-[#FF2D85]">{afterLabel}</span>
        </p>
      </Reveal>

      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <Reveal key={row.after} variant="scale" delay={i * 0.06}>
            <div className="rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-card">
              <span className="text-xs leading-relaxed text-bone/35 line-through decoration-bone/25">
                {row.before}
              </span>
              <p className="mt-1 flex items-start gap-2 text-sm font-medium leading-relaxed text-bone">
                <span className="mt-0.5 flex-none text-[#FF2D85]" aria-hidden>
                  <ArrowIcon size={14} />
                </span>
                <span>{row.after}</span>
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default ShiftList;
