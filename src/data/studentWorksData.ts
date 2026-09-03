/**
 * Student works gallery - video files under /public/videos/.
 */

export type StudentWorkTrack = "video" | "social" | "business" | "students" | "fashion";

export type StudentWork = {
  id: string;
  title: string;
  author: string;
  track: StudentWorkTrack;
  /** Course slugs that should show this work */
  courseSlugs: string[];
  video: string;
  poster?: string;
};

export const STUDENT_WORKS: StudentWork[] = [
  {
    id: "movie-1",
    title: "סרטון מותג מסחרי",
    author: "משתתף במסלול וידאו",
    track: "video",
    /*
     * גם לעמוד הסושיאל, לצד ai-video-content.
     *
     * זה תוכן ממותג ופונה החוצה - בדיוק מה שמנהלת סושיאל מעלה
     * ללקוח - ולכן הוא רלוונטי כדוגמה גם שם. courseSlugs נשאר שדה
     * תצוגה ("איפה מציגים") ולא שדה מקור: author ממשיך לומר בכנות
     * שהיוצר השתתף במסלול הווידאו, וזה לא משתנה כשהעמוד משתנה.
     */
    courseSlugs: ["ai-video-content", "social-media-ai"],
    video: "/videos/Movie_1.mp4",
    poster: "/images/works/movie-1.jpg",
  },
  {
    id: "movie-2",
    title: "קליפ מוצר קצר",
    author: "משתתפת במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_2.mp4",
    poster: "/images/works/movie-2.jpg",
  },
  {
    id: "movie-3",
    title: "שוט תדמית לעסק",
    author: "משתתף במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_3.mp4",
    poster: "/images/works/movie-3.jpg",
  },
  {
    id: "movie-4",
    title: "סיקוונס AI ערוך",
    author: "משתתפת במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_4.mp4",
    poster: "/images/works/movie-4.jpg",
  },
  {
    id: "movie-5",
    title: "פרומו לקמפיין",
    author: "משתתף במסלול וידאו",
    track: "video",
    /* ראו הערה ב-movie-1: תוכן קמפיין ממותג, רלוונטי גם לעמוד הסושיאל */
    courseSlugs: ["ai-video-content", "social-media-ai"],
    video: "/videos/Movie_5.mp4",
    poster: "/images/works/movie-5.jpg",
  },
  {
    id: "movie-6",
    title: "טריילר קצר ללקוח",
    author: "משתתפת במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content", "social-media-ai"],
    video: "/videos/Movie_6.mp4",
    poster: "/images/works/movie-6.jpg",
  },
  {
    id: "movie-7",
    title: "ויז'ואל מסחרי עם AI",
    author: "משתתף במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content", "social-media-ai"],
    video: "/videos/Movie_7.mp4",
    poster: "/images/works/movie-7.jpg",
  },
  {
    id: "movie-8",
    title: "רצף שוטים עקבי",
    author: "משתתפת במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_8.mp4",
    poster: "/images/works/movie-8.jpg",
  },
  {
    id: "movie-9",
    title: "תוצר גמר מהמסלול",
    author: "משתתף במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_9.mp4",
    poster: "/images/works/movie-9.jpg",
  },
  /*
   * ארבעת תוצרי האופנה, שהיו קודם ב-fashionWorks.ts בקובץ נפרד.
   *
   * הועברו לכאן כדי שדף המסלול הרגיל (/courses/ai-fashion) יציג אותם
   * דרך אותו מנגנון גנרי שכל שאר המסלולים משתמשים בו -
   * getStudentWorksForCourse - ולא דרך רשימה נפרדת שרק דף הנחיתה
   * ידע עליה. courseSlugs: ["ai-fashion"] הוא מה שחיבר את שני
   * העמודים בלי לגעת ברישום עצמו.
   *
   * author אומר "הדר בן דור, מנחת הסדנה" ולא "משתתפת במסלול", כי
   * ההדגמה כאן היא של המנחה ולא של בוגרת. זו לא סטייה מהתבנית -
   * השדה הוא string חופשי, וזה פשוט הכיתוב הנכון למי שבנתה אותם
   * בפועל. סרטון הנעליים לא נכלל: התוכן שלו 664x384 בתוך קנבס
   * 720x1280, כלומר וידאו רוחבי שרופד בשחור, והוא ממתין לייצוא אנכי.
   */
  {
    id: "fashion-jewelry-studio",
    title: "קמפיין תכשיטים",
    author: "הדר בן דור, מנחת הסדנה",
    track: "fashion",
    courseSlugs: ["ai-fashion"],
    video: "/videos/fashion-jewelry-studio.mp4",
    poster: "/images/works/fashion-jewelry-studio.jpg",
  },
  {
    id: "fashion-desert-activewear",
    title: "קמפיין ספורט במדבר",
    author: "הדר בן דור, מנחת הסדנה",
    track: "fashion",
    courseSlugs: ["ai-fashion"],
    video: "/videos/fashion-desert-activewear.mp4",
    poster: "/images/works/fashion-desert-activewear.jpg",
  },
  {
    id: "fashion-car-story",
    title: "סצנת קמפיין נרטיבית",
    author: "הדר בן דור, מנחת הסדנה",
    track: "fashion",
    courseSlugs: ["ai-fashion"],
    video: "/videos/fashion-car-story.mp4",
    poster: "/images/works/fashion-car-story.jpg",
  },
  {
    id: "fashion-beach-swimwear",
    title: "קמפיין בגדי ים",
    author: "הדר בן דור, מנחת הסדנה",
    track: "fashion",
    courseSlugs: ["ai-fashion"],
    video: "/videos/fashion-beach-swimwear.mp4",
    poster: "/images/works/fashion-beach-swimwear.jpg",
  },
];

export function getStudentWorksForCourse(slug: string): StudentWork[] {
  return STUDENT_WORKS.filter((work) => work.courseSlugs.includes(slug));
}
