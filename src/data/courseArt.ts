// ויזואלים שנוצרו ב-Higgsfield בשפת המותג: פחם, לבן, ורוד #ff5f9e.
// תמונות: Nano Banana. לופים אווירתיים שקטים: Seedance 2.5 (720p, בלי אודיו).
import social from "../assets/courses/social.webp";
import video from "../assets/courses/video.webp";
import students from "../assets/courses/students.webp";
import business from "../assets/courses/business.webp";
import landing from "../assets/courses/landing.webp";
import banner from "../assets/courses/banner.webp";

import socialLoop from "../assets/courses/social.mp4";
import socialLoopW from "../assets/courses/social.webm";
import videoLoopW from "../assets/courses/video.webm";
import studentsLoopW from "../assets/courses/students.webm";
import businessLoopW from "../assets/courses/business.webm";
import landingLoopW from "../assets/courses/landing.webm";
import bannerLoopW from "../assets/courses/banner.webm";
import videoLoop from "../assets/courses/video.mp4";
import studentsLoop from "../assets/courses/students.mp4";
import businessLoop from "../assets/courses/business.mp4";
import landingLoop from "../assets/courses/landing.mp4";
import bannerLoop from "../assets/courses/banner.mp4";
import showreel from "../assets/courses/showreel.mp4";
import showreelW from "../assets/courses/showreel.webm";
import showreelPoster from "../assets/courses/showreel.webp";

export const COURSE_ART: Record<string, string> = {
  "social-media-ai": social,
  "ai-video-content": video,
  "ai-for-students": students,
  "ai-business-systems": business,
  "ai-landing-page": landing,
};

export const COURSE_LOOPS: Record<string, string> = {
  "social-media-ai": socialLoop,
  "ai-video-content": videoLoop,
  "ai-for-students": studentsLoop,
  "ai-business-systems": businessLoop,
  "ai-landing-page": landingLoop,
};

export const COURSE_LOOPS_WEBM: Record<string, string> = {
  "social-media-ai": socialLoopW,
  "ai-video-content": videoLoopW,
  "ai-for-students": studentsLoopW,
  "ai-business-systems": businessLoopW,
  "ai-landing-page": landingLoopW,
};

export const SHOWREEL = showreel;
export const SHOWREEL_WEBM = showreelW;
export const SHOWREEL_POSTER = showreelPoster;

export const WIDE_BANNER = banner;
export const WIDE_BANNER_LOOP = bannerLoop;
export const WIDE_BANNER_LOOP_WEBM = bannerLoopW;
