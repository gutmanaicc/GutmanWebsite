import { Navigation } from 'lucide-react';
import venueDetails from '../../../shared/academy-venue.json';

export default function VenueNavigation({ venue, className = '' }: { venue: string; className?: string }) {
  if (venue !== venueDetails.venue) return null;
  return <a className={`academy-venue-navigation ${className}`} href={venueDetails.wazeUrl} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />ניווט לטרמינל ב־Waze<span className="sr-only">, בלשונית חדשה</span></a>;
}
