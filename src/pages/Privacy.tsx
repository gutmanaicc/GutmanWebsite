import LegalPage, { LegalSection } from '../components/LegalPage';
import { Link } from 'react-router-dom';
import notice from '../../shared/privacy-notice.json';
import { SellerDisclosure, useMerchantDisclosure } from '../components/academy/CommercialDisclosure';
import { useSeo } from '../lib/seo';

export default function Privacy() {
  const disclosure = useMerchantDisclosure();
  useSeo({ title: 'מדיניות פרטיות | מכללת גוטמן', description: 'המידע הנאסף, מטרות השימוש, ספקים, בחירת מדידה וזכויות עיון ותיקון.', path: '/privacy' });
  return <LegalPage kicker="מידע ופרטיות" title={notice.title} meta={`עודכן ב־13 באוקטובר 2026 · ${notice.version}`} intro="מה נאסף במהלך פנייה או רכישה, למה משתמשים במידע ואיך אפשר לפנות אלינו בנושא.">
    <SellerDisclosure disclosure={disclosure} />
    {notice.sections.map((section,index)=><LegalSection key={section.title} num={String(index+1).padStart(2,'0')} title={section.title}>{section.paragraphs.map(p=><p key={p}>{p}</p>)}</LegalSection>)}
    <LegalSection title="קישורים לפעולות ולמידע"><p><Link to="/privacy-requests">מסירת פנייה בנושא פרטיות או הסרה מעדכונים</Link> · <Link to="/cancel">הודעת ביטול עסקה</Link> · <Link to="/booking-terms">תנאי הרשמה וביטול</Link> · <Link to="/terms">תקנון האתר</Link>.</p><p>השימוש באתר אינו מרשה שימוש בלתי חוקי, פגיעה בזכויות, פריצה או הפצת חומרים מוגנים בלי הרשאה. תוצאות הלמידה אינן הבטחה להכנסה או לתוצאה מסחרית. הזכויות לפי הדין נשמרות.</p></LegalSection>
  </LegalPage>;
}
