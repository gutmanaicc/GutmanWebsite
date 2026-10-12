import { ACADEMY_TESTIMONIAL_VIDEO } from '../../data/academyTestimonials';
import { SectionHeading } from './Content';

export default function AcademyTestimonialVideo() {
  const content = ACADEMY_TESTIMONIAL_VIDEO;
  return <section className="academy-section academy-testimonial-video-section" aria-label={content.attribution}>
    <div className="academy-container academy-testimonial-video-grid"><div className="academy-testimonial-video-copy"><SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} /><p className="academy-testimonial-video-attribution">{content.attribution}</p><p className="academy-source-note">{content.context}</p></div><figure className="academy-testimonial-video-card"><video controls playsInline preload="none" width="720" height="1280" poster={content.poster} aria-label={content.attribution}><source src={content.video} type="video/mp4" /><p>הדפדפן אינו תומך בניגון וידאו. <a href={content.video}>לפתיחת סרטון ההמלצות</a></p></video><figcaption>{content.attribution}</figcaption></figure></div>
  </section>;
}
