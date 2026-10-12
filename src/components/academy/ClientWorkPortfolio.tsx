import type { ReactNode } from 'react';
import { ArrowUpLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLIENT_WORK, CLIENT_WORK_CONTENT, type ClientWork } from '../../data/clientWork';
import { SectionHeading } from './Content';

function ClientFilm({ work, index }: { work: ClientWork; index: number }) {
  return <figure className={`academy-client-film academy-client-film--${work.id}`}>
    <div className="academy-client-film-meta"><span className="academy-client-film-index">0{index + 1} / פרויקט למותג</span><span className="academy-client-film-brand"><img src={work.logo} alt="" loading="lazy" width="85" height="32" /><span>{work.brand}</span></span></div>
    <div className="academy-client-film-screen" style={{ aspectRatio: `${work.width}/${work.height}` }}>
      <video controls playsInline preload="none" poster={work.poster} width={work.width} height={work.height} aria-label={`סרטון של רון גוטמן למותג ${work.brand}`}>
        <source src={work.video} type="video/mp4" />
        <p>הדפדפן אינו תומך בניגון הסרטון. <a href={work.video}>לפתיחת הסרטון של {work.brand}</a></p>
      </video>
    </div>
    <figcaption><h3>{work.title}</h3><p>{work.description}</p></figcaption>
  </figure>;
}

/** A supplied testimonial can occupy its own card without mixing it with client work. */
export default function ClientWorkPortfolio({ testimonial }: { testimonial?: ReactNode }) {
  return <section className="academy-section academy-client-work" id="client-work" aria-label="פרויקטים ללקוחות של רון גוטמן"><div className="academy-container">
    <div className="academy-heading-row"><SectionHeading eyebrow={CLIENT_WORK_CONTENT.eyebrow} title={CLIENT_WORK_CONTENT.title} description={CLIENT_WORK_CONTENT.description} /><p className="academy-source-note">{CLIENT_WORK_CONTENT.note}</p></div>
    <div className="academy-client-film-grid"><ClientFilm work={CLIENT_WORK[0]} index={0} /><div className="academy-client-film-side"><ClientFilm work={CLIENT_WORK[1]} index={1} /><div className="academy-client-work-link"><span>מהעבודה בשטח, לתרגול שלכם.</span><Link to="/courses/ai-video-content">לסמינר וידאו ותוכן <ArrowUpLeft size={19} aria-hidden="true" /></Link></div>{testimonial && <div className="academy-client-work-testimonial">{testimonial}</div>}</div></div>
  </div></section>;
}
