import { SITE } from "../../data/site";

/**
 * "מה קורה אחרי שתשאירו פרטים", צמוד לטופס.
 *
 * הטופס מבקש שם, טלפון ומייל מגולש שלא מכיר אותנו, והמחיר הנתפס של
 * המילוי הוא לא הזמן אלא החשש: האם זו הרשמה מחייבת, האם ירדפו אחרי,
 * מה בכלל קורה עכשיו. שלוש השורות עונות על זה במקום שבו השאלה
 * נשאלת, ולא בשאלות ותשובות בתחתית העמוד.
 */
const AfterSubmitSteps = () => (
  <div className="mt-5 border-t border-white/15 pt-5">
    <h3 className="text-xs font-semibold tracking-wide text-white/60">
      מה קורה אחרי שתשאירו פרטים
    </h3>
    <ol className="mt-3 space-y-2.5">
      {SITE.afterSubmit.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <span
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white"
            aria-hidden
          >
            {i + 1}
          </span>
          <p className="text-sm leading-snug text-white/80">
            <span className="font-semibold text-white">{step.title}. </span>
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  </div>
);

export default AfterSubmitSteps;
