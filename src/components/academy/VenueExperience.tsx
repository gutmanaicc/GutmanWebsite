import { Image, MapPin } from 'lucide-react';
import { useState } from 'react';
import venue from '../../../shared/academy-venue.json';
import { SectionHeading } from './Content';
import VenueNavigation from './VenueNavigation';

const photoRoot = 'https://designterminal.org.il/f-users/user_102461/website_105065/images/';

function VenuePhoto({ src, alt, caption, className }: { src: string; alt: string; caption: string; className: string }) {
  const [unavailable, setUnavailable] = useState(false);
  return <figure className={`academy-venue-photo ${className}`}>
    <img src={src} alt={alt} width="1200" height="800" loading="lazy" decoding="async" referrerPolicy="no-referrer" hidden={unavailable} onError={() => setUnavailable(true)} />
    {unavailable && <a className="academy-venue-photo-fallback" href={src} target="_blank" rel="noopener noreferrer"><Image size={28} aria-hidden="true" /><span>לצפייה בתמונת המתחם<span className="sr-only">, בלשונית חדשה</span></span></a>}
    <figcaption>{caption}</figcaption>
  </figure>;
}

export default function VenueExperience() {
  return <section className="academy-section academy-venue-experience" aria-labelledby="venue-title">
    <div className="academy-container academy-venue-experience-grid">
      <div className="academy-venue-experience-copy">
        <SectionHeading eyebrow="נפגשים, בונים, יוצאים עם תוצר" title={"חמש שעות.\nמחוץ לשגרה."} description="מגיעים עם המחשב והעבודה שלכם, ונפגשים במתחם יצירתי לעבודה מעשית בקבוצה קטנה." />
        <h3 id="venue-title"><MapPin size={21} aria-hidden="true" />{venue.name}</h3>
        <p className="academy-venue-address">{venue.address}</p>
        <VenueNavigation venue={venue.venue} />
      </div>
      <div className="academy-venue-photos">
        <VenuePhoto src={`${photoRoot}10112.jpg`} alt="החלל המרכזי בטרמינל לעיצוב בבת ים" caption="מרחב להיפגש וליצור." className="academy-venue-photo--main" />
        <VenuePhoto src={`${photoRoot}thumbs/W_960_0334.jpg`} alt="חלל סדנאות במתחם הטרמינל לעיצוב" caption="אווירה של עשייה." className="academy-venue-photo--detail" />
        <p className="academy-venue-photo-credit">תמונות המתחם מתוך <a href={venue.officialUrl} target="_blank" rel="noopener noreferrer">אתר הטרמינל לעיצוב<span className="sr-only">, בלשונית חדשה</span></a>. החדר הספציפי יעודכן לקראת המפגש.</p>
      </div>
    </div>
  </section>;
}
