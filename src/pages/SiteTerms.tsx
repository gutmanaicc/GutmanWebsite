import LegalPage, { LegalSection } from '../components/LegalPage';
import content from '../../shared/site-terms-draft.json';
import { SellerDisclosure, useMerchantDisclosure } from '../components/academy/CommercialDisclosure';
import { useSeo } from '../lib/seo';
import { Link } from 'react-router-dom';

export default function SiteTerms() {
  const disclosure = useMerchantDisclosure(); const approved = disclosure?.siteTermsApproved === true;
  useSeo({ title: 'תקנון האתר ותנאי שימוש | מכללת גוטמן', description: 'תנאי האתר, השירות, חומרי ההדרכה וזכויות המשתתפים.', path: '/terms', noindex: !approved });
  return <LegalPage kicker="תקנון האתר" title={content.title} meta={`${approved ? 'נוסח מאושר' : 'טיוטה לאישור בעל העסק'} · 13 באוקטובר 2026 · ${content.version}`} intro="פרטי השירות וההתקשרות, שימוש בחומרים, גבולות האחריות וזכויות המשתתפים.">
    {!approved && <div className="academy-notice" role="status"><strong>טיוטה לבדיקה ולאישור</strong><p>הנוסח הזה טרם הופעל כתנאי הרכישה. ההזמנות הקיימות כפופות לתנאי ההרשמה שאושרו ונמסרו בעת יצירתן. <Link to="/booking-terms">לתנאי ההרשמה הנוכחיים</Link>.</p></div>}
    <SellerDisclosure disclosure={disclosure} />
    {content.sections.map((section,index)=><LegalSection key={section.title} num={String(index+1).padStart(2,'0')} title={section.title}>{section.paragraphs.map(p=><p key={p}>{p}</p>)}</LegalSection>)}
    <LegalSection title="פניות ושירות"><p><Link to="/cancel">מסירת הודעת ביטול</Link> · <Link to="/privacy-requests">פניות פרטיות</Link> · <Link to="/privacy">מדיניות פרטיות</Link> · <Link to="/accessibility">הצהרת נגישות</Link>.</p></LegalSection>
  </LegalPage>;
}
