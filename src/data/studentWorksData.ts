/**
 * Student works gallery - video files under /public/videos/.
 */

export type StudentWorkTrack = "video" | "social" | "business" | "students";

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
    courseSlugs: ["ai-video-content"],
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
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_5.mp4",
    poster: "/images/works/movie-5.jpg",
  },
  {
    id: "movie-6",
    title: "טריילר קצר ללקוח",
    author: "משתתפת במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
    video: "/videos/Movie_6.mp4",
    poster: "/images/works/movie-6.jpg",
  },
  {
    id: "movie-7",
    title: "ויז'ואל מסחרי עם AI",
    author: "משתתף במסלול וידאו",
    track: "video",
    courseSlugs: ["ai-video-content"],
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
];

export function getStudentWorksForCourse(slug: string): StudentWork[] {
  return STUDENT_WORKS.filter((work) => work.courseSlugs.includes(slug));
}
