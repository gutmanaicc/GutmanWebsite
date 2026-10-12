import { ACADEMY_CONFIG, type Catalog } from '../../lib/academy';

export default function SeminarPrice({ compact = false, pricing }: { compact?: boolean; pricing?: Catalog['pricing'] }) {
  const launch = (pricing?.launchPriceAgorot ?? ACADEMY_CONFIG.launchPriceILS * 100) / 100;
  const regular = (pricing?.regularPriceAgorot ?? ACADEMY_CONFIG.plannedPriceILS * 100) / 100;
  const isLaunch = (pricing?.activePrice ?? ACADEMY_CONFIG.activePrice) !== 'regular';
  const amount = isLaunch ? launch : regular;
  return <div className={`academy-price${compact ? ' academy-price--compact' : ''}`}>
    {isLaunch && regular > launch && <div className="academy-price-reference"><span>מחיר רגיל</span><del><bdi>{regular.toLocaleString('he-IL')} ₪</bdi></del><span className="academy-price-saving">חוסכים <bdi>{(regular - launch).toLocaleString('he-IL')} ₪</bdi></span></div>}
    <div className="academy-price-launch"><strong><bdi>{amount.toLocaleString('he-IL')} ₪</bdi></strong><span>{isLaunch ? 'מחיר השקה למשתתף' : 'מחיר רגיל למשתתף'}</span></div>
  </div>;
}
