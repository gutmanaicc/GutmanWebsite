/**
 * Instructors data layer - portraits live under /public/images/instructors/.
 * Paths match the files currently on disk.
 */

export type InstructorTrackBioKey =
  | "general"
  | "video"
  | "cbt"
  | "social"
  | "business"
  | "students";

export type Instructor = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  roleTags: string[];
  image: string;
  credentials: string[];
  /** Default bio shown on Home / general contexts */
  bio: string;
  /** Track-specific bios for Course Detail */
  trackBios: Partial<Record<InstructorTrackBioKey, string>>;
};

export const INSTRUCTORS: Instructor[] = [
  {
    id: "ron-gutman",
    name: "רון גוטמן",
    shortName: "רון",
    role: "מייסד GUTMAN.AI ומנחה ראשי",
    roleTags: ["מייסד", "מנחה ראשי", "AI מעשי"],
    image: "/images/instructors/Ron_Gutman.jpg",
    credentials: [
      "מייסד Gutman Academy ו-GUTMAN.AI",
      "מנחה מסלולים פרונטליים מבוססי תוצר",
      "מומחה לבניית תהליכי עבודה עם בינה מלאכותית",
    ],
    bio: "רון גוטמן הוא מייסד GUTMAN.AI והמנחה הראשי של האקדמיה. הוא בונה מסלולים פרונטליים שבהם לומדים לא רק כלים - אלא תהליכי עבודה אמיתיים שמייצרים תוצר חי כבר במהלך המפגשים.",
    trackBios: {
      general:
        "כמייסד האקדמיה, רון מוביל את הגישה המעשית: כל מסלול בנוי סביב תוצר אמיתי, פידבק בזמן אמת, ועבודה על החומר של המשתתפים עצמם.",
      video:
        "במסלול עורכי הווידאו ויוצרי התוכן, רון מוביל תהליך הפקה מבוסס AI - מקונספט ותסריט ועד שוטים, עריכה ותוצר שניתן לשחזר בכל פרויקט.",
      cbt: "במסלול לטיפולי CBT ואנשי מקצוע טיפוליים, רון מתרגם כלי AI לשגרות עבודה אתיות ומדויקות - סיכום, תרגול והכנה - בלי לוותר על שיקול דעת מקצועי.",
      social:
        "במסלול למנהלי סושיאל, רון מלמד לבנות לכל לקוח עובד AI שמכיר טון, קהל ומטרות - כדי לנהל יותר לקוחות בפחות שעות ובלי לוותר על איכות.",
      business:
        "במסלולי בעלי העסקים, רון מלווה בניית מערכות אמיתיות - CRM, מעקב תשלומים ודפי נחיתה - על הנתונים והשירות של העסק עצמו.",
      students:
        "במסלול לסטודנטים, רון בונה יחד עם המשתתפים מערכת לימודים אישית שמסכמת, מתרגלת ומכינה למבחנים על בסיס הקורסים האמיתיים שלהם.",
    },
  },
  {
    id: "hadar-ben-dor",
    name: "הדר בן דור",
    shortName: "הדר",
    role: "צלמת אופנה",
    roleTags: ["צילום אופנה", "ויז'ואל", "בימוי"],
    image: "/images/instructors/Hadar_ben_david.jpg",
    credentials: [
      "בוגרת שנקר",
      "TLV Fashion Week",
      "עבודה עם אל על, The Jewelry Exchange, Static ואסף אמדורסקי",
    ],
    bio: "הדר בן דור היא צלמת אופנה עם רקע משנקר ומעולם האופנה הישראלי. היא מביאה לאקדמיה עין ויזואלית חדה, סטנדרט והבנה עמוקה של איך בונים שפה תמונתית שעובדת גם עם כלי AI.",
    trackBios: {
      general:
        "הדר מביאה סטנדרט ויזואלי לתוך תהליכי יצירה עם AI - קומפוזיציה, אור, טון מותג ותוצאה שנראית מקצועית מהפריים הראשון.",
      video:
        "במסלול הווידאו והתוכן, הדר מחזקת את השכבה הוויזואלית: איך בונים שפה תמונתית עקבית, שוטים ברמהת, וטון מותג שלא נשבר בין פריימים.",
    },
  },
  {
    id: "idan-mansur",
    name: "עידן מנצור",
    shortName: "עידן",
    role: "מנחה סדנת הסטודנטים",
    roleTags: ["הנחיה", "ליווי מעשי", "תהליכי עבודה"],
    image: "/images/instructors/Idan_Mantzur.png",
    credentials: [
      "מנחה ומלווה במסלולי האקדמיה",
      "התמחות בהטמעת תהליכי AI בעבודה יומיומית",
    ],
    bio: "עידן מנצור מלווה את המשתתפים בבניית תהליכי עבודה עם AI - מהגדרת המטרה ועד תוצר חי. הוא מתמקד בפידבק מדויק, פישוט שלבים מורכבים, והפיכת כלים לשגרה שעובדת גם אחרי המסלול.",
    trackBios: {
      general:
        "עידן מלווה את הקבוצה צמוד: שאלות בזמן אמת, תיקון מסלול כשנתקעים, ודגש על תוצר שעובד ביום שאחרי.",
      business:
        "במסלולי בעלי העסקים, עידן עוזר להפוך רעיונות למערכות תפעוליות - סטטוסים, תזכורות וזרימות עבודה שמתאימות לעסק האמיתי.",
      social:
        "במסלול הסושיאל, עידן מסייע לבנות חפיפות ללקוחות ולוודא שכל עובד AI באמת מייצר תוכן בטון הנכון.",
    },
  },
];

export const getInstructor = (id: string) => INSTRUCTORS.find((i) => i.id === id);

/** Map course slugs → instructor + preferred bio key */
export const COURSE_INSTRUCTOR_MAP: Record<
  string,
  { instructorIds: string[]; bioKey: InstructorTrackBioKey }
> = {
  "social-media-ai": { instructorIds: ["ron-gutman", "idan-mansur"], bioKey: "social" },
  "ai-for-students": { instructorIds: ["ron-gutman"], bioKey: "students" },
  "ai-video-content": { instructorIds: ["ron-gutman", "hadar-ben-dor"], bioKey: "video" },
  "ai-business-systems": { instructorIds: ["ron-gutman", "idan-mansur"], bioKey: "business" },
  "business-crm": { instructorIds: ["ron-gutman", "idan-mansur"], bioKey: "business" },
  "business-payments": { instructorIds: ["ron-gutman", "idan-mansur"], bioKey: "business" },
  "business-landing-page": { instructorIds: ["ron-gutman", "idan-mansur"], bioKey: "business" },
};

export function getInstructorsForCourse(slug: string): Array<{
  instructor: Instructor;
  bio: string;
}> {
  const mapping = COURSE_INSTRUCTOR_MAP[slug];
  if (!mapping) {
    const ron = getInstructor("ron-gutman");
    return ron
      ? [{ instructor: ron, bio: ron.trackBios.general ?? ron.bio }]
      : [];
  }
  return mapping.instructorIds
    .map((id) => {
      const instructor = getInstructor(id);
      if (!instructor) return null;
      const bio =
        instructor.trackBios[mapping.bioKey] ??
        instructor.trackBios.general ??
        instructor.bio;
      return { instructor, bio };
    })
    .filter((x): x is { instructor: Instructor; bio: string } => Boolean(x));
}
