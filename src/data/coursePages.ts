export type AudienceIcon = "bolt" | "users" | "target" | "spark" | "briefcase" | "graduation" | "video" | "layers";

export type TargetAudienceProfile = {
  title: string;
  description: string;
  icon: AudienceIcon;
};

export type CurriculumModule = {
  title: string;
  topics: string[];
  outcome: string;
};

export type CourseDeliverable = {
  title: string;
  description: string;
  icon: AudienceIcon;
};

export type CourseFaqItem = {
  question: string;
  answer: string;
};

export type CoursePageContent = {
  valueProposition: string;
  heroMeta: {
    duration: string;
    format: string;
    outcome: string;
  };
  targetAudience: TargetAudienceProfile[];
  deliverables: CourseDeliverable[];
};

/** Rich page-level content keyed by course slug. Curriculum + FAQ are derived from syllabus/faq. */
export const COURSE_PAGE_CONTENT: Record<string, CoursePageContent> = {
  "ai-for-therapists": {
    valueProposition:
      "AI ככלי עבודה תומך בקליניקה, לא תחליף למטפל.\nחוסכים זמן, עושים סדר ומעמיקים את העבודה המקצועית.",
    heroMeta: {
      duration: "מועדים ייסגרו בקרוב",
      format: "פרונטלי · קבוצה קטנה",
      outcome: "שיטת עבודה לקליניקה",
    },
    targetAudience: [
      {
        title: "מטפלים ופסיכולוגים",
        description: "אנשי מקצוע בקליניקה פרטית או במסגרת ארגונית שרוצים לעשות סדר בעבודה סביב המפגשים.",
        icon: "users",
      },
      {
        title: "אנשי מקצוע בבריאות הנפש",
        description: "מי שעובד עם מידע, חומרי עבודה ומעקב שוטף ומחפש דרך מסודרת יותר לנהל אותם.",
        icon: "briefcase",
      },
      {
        title: "מי שעוד לא עבד עם AI",
        description: "הסדנה מתחילה מהבסיס ומתקדמת שלב אחר שלב, בהנחיה צמודה.",
        icon: "graduation",
      },
    ],
    deliverables: [
      {
        title: "סביבת AI מותאמת",
        description: "מערכת שמכירה את שיטת העבודה, הכלים והגישה המקצועית שלכם.",
        icon: "layers",
      },
      {
        title: "מחברת דיגיטלית לכל מטופל",
        description: "סביבת עבודה נפרדת ומסודרת שמרכזת מידע, משימות וכלים במקום אחד.",
        icon: "target",
      },
      {
        title: "שיטת עבודה פרקטית",
        description: "תהליכים לתיעוד, מעקב וסדר בין מפגשים שאפשר להמשיך לעבוד לפיהם.",
        icon: "bolt",
      },
    ],
  },

  "ai-fashion": {
    valueProposition:
      "מרעיון ראשוני לקמפיין אופנה שלם, בעזרת AI.\nחמישה מפגשים שבסופם קמפיין מוגמר שבניתם בעצמכם.",
    heroMeta: {
      duration: "5 מפגשים",
      format: "פרונטלי · קבוצה קטנה",
      outcome: "קמפיין אופנה מוגמר",
    },
    targetAudience: [
      {
        title: "צלמי ומצלמות אופנה",
        description: "מי שכבר מצלם ורוצה להוסיף שכבת AI לתהליך הקריאייטיב וההפקה.",
        icon: "video",
      },
      {
        title: "יוצרי תוכן",
        description: "יוצרים בעולמות האופנה והמותגים שרוצים לבנות קמפיין עם שפה ויזואלית אחידה.",
        icon: "spark",
      },
      {
        title: "מי שרוצה תוצר ולא רק כלים",
        description: "הסדנה מסתיימת בפרויקט שמוצג ומקבל פידבק מקצועי.",
        icon: "target",
      },
    ],
    deliverables: [
      {
        title: "Moodboard מקצועי",
        description: "ניתוח המותג וה-Brand DNA שלו, שמגדיר את הכיוון של הקמפיין.",
        icon: "layers",
      },
      {
        title: "תמונות הקמפיין",
        description: "דוגמנים ודמויות עקביות ושפה ויזואלית אחידה לאורך כל הקמפיין.",
        icon: "spark",
      },
      {
        title: "וידאו לקמפיין",
        description: "תנועות מצלמה, שוטים ועריכה בסיסית שהופכים את העולם הוויזואלי לתוכן בתנועה.",
        icon: "video",
      },
    ],
  },

  "social-media-ai": {
    valueProposition:
      "בונים לכל לקוח עובד AI שמכיר את הטון, הקהל והמטרות שלו.\nמנהלים יותר לקוחות בפחות שעות - בלי לוותר על איכות.",
    heroMeta: {
      duration: "מועדים ייסגרו בקרוב",
      format: "פרונטלי · קבוצה קטנה",
      outcome: "עובד AI מוכן ללקוח",
    },
    targetAudience: [
      {
        title: "מנהלי ומנהלות סושיאל",
        description: "מנהלים כמה לקוחות במקביל ורוצים לצמוח בלי להישחק על מחקר, כתיבה ועריכה חוזרת.",
        icon: "users",
      },
      {
        title: "סוכנויות תוכן",
        description: "צוותים שצריכים תהליך אחיד שמייצר תוכן מותאם לכל לקוח, לא תוצאה גנרית.",
        icon: "briefcase",
      },
      {
        title: "פרילנסרים בתחום התוכן",
        description: "רוצים לקלוט לקוחות נוספים בלי להכפיל שעות עבודה ובלי לאבד את הקול של כל מותג.",
        icon: "bolt",
      },
      {
        title: "מי שכבר משתמש ב-ChatGPT",
        description: "עובדים עם AI מדי יום אבל מרגישים שהתוצאות שטחיות ושכל שיחה מתחילה מאפס.",
        icon: "spark",
      },
    ],
    deliverables: [
      {
        title: "עובד AI פעיל ללקוח",
        description: "עובד מותאם שמכיר את העסק, הקהל, הטון והגבולות - מוכן לעבודה שוטפת.",
        icon: "bolt",
      },
      {
        title: "מסמך חפיפה מלא",
        description: "בסיס ידע מסודר: קהל, הצעה, מתחרים, טון ומדיניות \"לא ממציאים\".",
        icon: "layers",
      },
      {
        title: "בנק רעיונות ותוכן",
        description: "אסטרטגיה, רעיונות, פוסטים, תסריטים וקרוסלות שיצאו מהמערכת.",
        icon: "spark",
      },
      {
        title: "תבנית שכפול ללקוח הבא",
        description: "תהליך מלא לבניית עובד AI חדש - בלי להמציא את הגלגל בכל פעם.",
        icon: "target",
      },
    ],
  },

  "ai-for-students": {
    valueProposition:
      "בונים מערכת לימודים אישית שמבינה את הקורסים שלכם.\nמסכמים, מתרגלים ומתארגנים - ומגיעים מוכנים למבחנים.",
    heroMeta: {
      duration: "מועדים ייסגרו בקרוב",
      format: "פרונטלי · קבוצה קטנה",
      outcome: "סביבת לימודים אישית",
    },
    targetAudience: [
      {
        title: "סטודנטים בכל תחום",
        description: "בין אם זו שנה א׳ או תואר מתקדם - המערכת נבנית על הקורסים האמיתיים שלכם.",
        icon: "graduation",
      },
      {
        title: "מי שטובע בחומר",
        description: "יש יותר מדי מאמרים, סיכומים ומטלות, וקשה לדעת מאיפה להתחיל.",
        icon: "layers",
      },
      {
        title: "משתמשי AI שטחיים",
        description: "כבר מבקשים סיכומים מצ'אט - אבל מקבלים תשובות לא מדויקות ובלי שיטת עבודה.",
        icon: "spark",
      },
      {
        title: "מי שרוצה תוכנית למבחן",
        description: "להגיע עם מערך תרגול וזיהוי פערי ידע - לא עם פאניקה בלילה שלפני.",
        icon: "target",
      },
    ],
    deliverables: [
      {
        title: "סביבת לימודים אישית",
        description: "מערכת שמכירה את הקורסים, החומרים והמשימות שלכם.",
        icon: "graduation",
      },
      {
        title: "שיטת סיכום אמינה",
        description: "תהליך לסיכום הרצאות ומאמרים בלי לאבד את העיקר.",
        icon: "layers",
      },
      {
        title: "מערך תרגול למבחן",
        description: "שאלות, מבחני דמה וכרטיסיות שמבוססים על הפערים שלכם.",
        icon: "target",
      },
      {
        title: "שגרת ניהול סמסטר",
        description: "משימות, דדליינים ותהליך שאפשר להפעיל מחדש בכל סמסטר.",
        icon: "bolt",
      },
    ],
  },

  "ai-video-content": {
    valueProposition:
      "מרעיון ועד תוצר מסחרי - תהליך הפקה מבוסס AI.\nקונספט, תסריט, שוטים, וידאו ועריכה בשיטה שאפשר לשחזר.",
    heroMeta: {
      duration: "מועדים ייסגרו בקרוב",
      format: "פרונטלי · קבוצה קטנה",
      outcome: "סרטון / קמפיין מוכן",
    },
    targetAudience: [
      {
        title: "עורכי ועורכות וידאו",
        description: "רוצים להרחיב את סל היכולות ולהוביל תהליך AI בלי לאבד את השליטה המקצועית.",
        icon: "video",
      },
      {
        title: "יוצרי תוכן",
        description: "מפיקים לבד או בצוות קטן וצריכים תהליך יציב מרעיון ועד מסירה.",
        icon: "spark",
      },
      {
        title: "אנשי קריאייטיב וסוכנויות",
        description: "מחפשים תהליך AI מסודר שאפשר להציג ללקוח ולשחזר בין פרויקטים.",
        icon: "briefcase",
      },
      {
        title: "מי שכבר התנסה בכלים",
        description: "ניסיתם כלי תמונה ווידאו - אבל עדיין לא הגעתם לרמה מסחרית עקבית.",
        icon: "target",
      },
    ],
    deliverables: [
      {
        title: "פרויקט תוכן גמור",
        description: "סרטון או קמפיין קצר שנבנה במהלך המסלול, מוכן להצגה.",
        icon: "video",
      },
      {
        title: "קונספט + תסריט + סטוריבורד",
        description: "מסמכי הפקה מלאים מהבריף ועד שוט ליסט.",
        icon: "layers",
      },
      {
        title: "סט נכסים ויזואליים",
        description: "תמונות ושוטים עקביים ברמה מסחרית, לא ניסוי וטעייה.",
        icon: "spark",
      },
      {
        title: "תהליך עבודה לשכפול",
        description: "שיטה מקצה לקצה שמיישמים בכל פרויקט הבא.",
        icon: "bolt",
      },
    ],
  },




};
