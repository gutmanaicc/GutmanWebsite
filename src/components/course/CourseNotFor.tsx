import { MotionItem } from "./CourseMotion";

/**
 * "למי זה פחות מתאים", נצמד לסקשן קהל היעד.
 *
 * זה הסקשן שהכי מעלה אמון מול תנועה ממומנת דווקא מפני שהוא מוותר על
 * חלק מהפונים. עמוד נחיתה שאומר "מתאים לכולם" נקרא כמו פרסומת;
 * עמוד שמוכן לפסול נקרא כמו מישהו שיודע מה הוא מוכר.
 *
 * הוא לא סקשן עצמאי בכוונה. עומד לבדו הוא היה מקבל כותרת שלילית
 * במרכז העמוד ומכביד; צמוד לקהל היעד הוא נקרא כצד השני של אותה
 * שאלה, וזה גם הסדר שבו הגולש שואל אותה.
 */
const CourseNotFor = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;

  return (
    <MotionItem>
      <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:mt-16 sm:p-6">
        <h3 className="font-display text-lg font-bold tracking-tight text-bone">
          ולמי הסדנה פחות מתאימה
        </h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-bone/55">
              <span className="mt-[0.55em] h-px w-3 shrink-0 bg-bone/25" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </MotionItem>
  );
};

export default CourseNotFor;
