import { Film } from 'lucide-react';
import { ACADEMY_CONTENT } from '../../data/seminars';

/** Add the approved owner video via the central content configuration. */
export default function IntroVideo() {
  const intro = ACADEMY_CONTENT.introVideo;
  return <div className="academy-intro">
    {intro.src ? <video controls playsInline preload="none" poster={intro.poster} aria-label="סרטון היכרות עם רון גוטמן"><source src={intro.src} type="video/mp4" />{intro.captionsSrc && <track default kind="captions" src={intro.captionsSrc} srcLang="he" label="עברית" />}</video> : <>
      <img className="academy-intro-portrait" src={intro.poster} alt="רון גוטמן" width="1000" height="1250" loading="lazy" />
      <div className="academy-intro-name"><span>הצעד הבא שלכם</span><p>לעבוד עם AI.<br />ביחד, ובידיים שלכם.</p></div>
      <div className="academy-intro-placeholder"><span className="academy-intro-symbol"><Film size={22} aria-hidden="true" /></span><div><strong>{intro.title}</strong><p>{intro.placeholder}</p><a href="#ron">להיכרות עם רון</a></div></div>
    </>}
  </div>;
}
