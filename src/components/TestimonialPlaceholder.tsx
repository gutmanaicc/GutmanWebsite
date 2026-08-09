// רכיב המלצה במצב Placeholder.
// מסומן בכוונה כ"בקרוב" כדי שלא ייראה כהמלצה אמיתית של לקוח.
// כשיהיו המלצות אמיתיות: מחליפים את השימוש ברכיב הזה בתוכן אמיתי (ציטוט, שם, תפקיד, תמונה).

type Props = {
  roleHint: string; // למשל: "מנהלת סושיאל" — סוג הממליץ שיוצג כאן בעתיד
};

const TestimonialPlaceholder = ({ roleHint }: Props) => (
  <div className="testi" data-reveal>
    <span className="testi-badge">המלצות יעלו בקרוב</span>
    <p className="testi-quote">
      כאן תופיע המלצה של {roleHint} מהמחזורים הראשונים: מה השתנה בעבודה, כמה זמן נחסך ומה נבנה במהלך
      המסלול.
    </p>
    <div className="testi-person">
      <span className="testi-avatar" aria-hidden="true">✦</span>
      <div>
        <div className="testi-name">שם הממליץ/ה</div>
        <div className="testi-role">{roleHint}</div>
      </div>
    </div>
  </div>
);

export default TestimonialPlaceholder;
