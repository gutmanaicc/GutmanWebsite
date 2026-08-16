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

export const MOCK_WINDOWS = [AiWorkerWindow, StoryboardWindow, StudyWindow] as const;

export const getMockWindowForVisual = (visual: string) => {
  const map: Record<string, typeof AiWorkerWindow> = {
    social: AiWorkerWindow,
    video: StoryboardWindow,
    students: StudyWindow,
  };
  return map[visual] ?? AiWorkerWindow;
};
