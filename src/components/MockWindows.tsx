import { Link } from "react-router-dom";

const WindowChrome = ({ title }: { title: string }) => (
  <div className="mw-bar">
    <span className="chat-dots" aria-hidden="true"><span /><span /><span /></span>
    <span className="mw-title">{title}</span>
  </div>
);

export const AiWorkerWindow = () => (
  <Link to="/courses/social-media-ai" className="mock-window">
    <WindowChrome title="עובד AI · לקוח: סטודיו יוגה" />
    <div className="mw-body" aria-hidden="true">
      <span className="mw-bubble me">צריך 3 רעיונות לרילז לשבוע הבא</span>
      <span className="mw-bubble">בטח. לפי אסטרטגיית התוכן של הסטודיו, הקהל מגיב הכי טוב לסדרת "5 דקות על המזרן". הנה שלושה כיוונים בטון של המותג...</span>
    </div>
    <div className="mw-caption">
      <b>עובד AI שמכיר את הלקוח</b>
      <span>מסלול מנהלי סושיאל</span>
    </div>
  </Link>
);

export const CrmWindow = () => (
  <Link to="/courses/ai-business-systems" className="mock-window">
    <WindowChrome title="מערכת ניהול · העסק שלי" />
    <div className="mw-body" aria-hidden="true">
      <span className="mw-row">רונית לוי · עיצוב לוגו<span className="st">הצעה נשלחה</span></span>
      <span className="mw-row">סטודיו אלמוג · ליווי חודשי<span className="st">ממתין לתשלום</span></span>
      <span className="mw-row">יואב כהן · סדנה לצוות<span className="st">נסגר ✓</span></span>
    </div>
    <div className="mw-caption">
      <b>CRM ומעקב תשלומים</b>
      <span>מסלול בעלי עסקים</span>
    </div>
  </Link>
);

export const StoryboardWindow = () => (
  <Link to="/courses/ai-video-content" className="mock-window">
    <WindowChrome title="סטוריבורד · קמפיין השקה" />
    <div className="mw-body" aria-hidden="true">
      <div className="mw-frames">
        <span className="mw-frame" /><span className="mw-frame" /><span className="mw-frame" />
      </div>
      <span className="mw-bubble">שוט 04: תקריב על המוצר, תנועת מצלמה איטית פנימה, תאורה חמה</span>
    </div>
    <div className="mw-caption">
      <b>מרעיון לסרטון גמור</b>
      <span>מסלול וידאו ותוכן</span>
    </div>
  </Link>
);

export const StudyWindow = () => (
  <Link to="/courses/ai-for-students" className="mock-window">
    <WindowChrome title="מערכת לימודים · סמסטר ב׳" />
    <div className="mw-body" aria-hidden="true">
      <span className="mw-row">מבוא לסטטיסטיקה · מבחן בעוד 12 יום<span className="st">תוכנית מוכנה</span></span>
      <span className="mw-bubble me">תבנה לי מבחן תרגול מההרצאות של פרקים 3 - 5</span>
    </div>
    <div className="mw-caption">
      <b>סביבת לימודים אישית</b>
      <span>מסלול סטודנטים</span>
    </div>
  </Link>
);

export const LandingWindow = () => (
  <Link to="/courses/business-landing-page" className="mock-window">
    <WindowChrome title="דף נחיתה · בבנייה" />
    <div className="mw-body" aria-hidden="true">
      <div className="mw-blocks">
        <span className="mw-block mw-block-hero" />
        <span className="mw-block mw-block-half" />
        <span className="mw-block mw-block-cta" />
      </div>
      <span className="mw-bubble">הסקשן הראשון מוכן. עכשיו נכתוב את ההבטחה המרכזית ונחבר טופס לידים.</span>
    </div>
    <div className="mw-caption">
      <b>דף נחיתה שאתם בונים לבד</b>
      <span>מסלול דף נחיתה</span>
    </div>
  </Link>
);

export const MOCK_WINDOWS = [
  AiWorkerWindow,
  CrmWindow,
  StoryboardWindow,
  StudyWindow,
  LandingWindow,
] as const;

export const getMockWindowForVisual = (visual: string) => {
  const map: Record<string, typeof AiWorkerWindow> = {
    social: AiWorkerWindow,
    business: CrmWindow,
    video: StoryboardWindow,
    students: StudyWindow,
    landing: LandingWindow,
  };
  return map[visual] ?? AiWorkerWindow;
};
