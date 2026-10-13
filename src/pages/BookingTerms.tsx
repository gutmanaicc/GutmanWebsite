import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalSection } from '../components/LegalPage';
import { SITE } from '../data/site';
import { ACADEMY_CONFIG, academyRequest, type Catalog } from '../lib/academy';
import { useSeo } from '../lib/seo';
import { SellerDisclosure, useMerchantDisclosure } from '../components/academy/CommercialDisclosure';

export default function BookingTerms() {
  const [approved, setApproved] = useState(false);
  const disclosure = useMerchantDisclosure();
  useSeo({ title: 'תנאי הרשמה וביטול | מכללת גוטמן', description: 'פרטי ההרשמה לסמינרים, ביטול, החזר ומינימום משתתפים.', path: '/booking-terms', noindex: !approved });
  useEffect(() => {
    const controller = new AbortController();
    academyRequest<Catalog>('/catalog', { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setApproved(value.commerce.bookingTermsApproved === true);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <LegalPage kicker="הרשמה לסמינרים" title="תנאי ההרשמה והביטול" meta={approved ? 'עודכן באוקטובר 2026' : 'נוסח מוצע לאישור · אוקטובר 2026'} intro="כל הפרטים על שמירת המקום, התשלום ובקשת ביטול, במקום אחד.">
    {!approved && <div className="academy-notice" role="status"><strong>טיוטה לאישור בעל המכללה</strong><p>הנוסח המוצע שלהלן ממתין לאישור. ההרשמה בתשלום תיפתח לאחר אישור התנאים והמועדים.</p></div>}
    <SellerDisclosure disclosure={disclosure} />
    <LegalSection num="01" title="הסמינר והמחיר">
      <p>הסמינרים פרונטליים ונמשכים {ACADEMY_CONFIG.durationHours} שעות, בשעות <bdi>{ACADEMY_CONFIG.startTime}-{ACADEMY_CONFIG.endTime}</bdi>. בוחרים סמינר ומועד במסך ההרשמה; פרטי המקום מוצגים לפני התשלום.</p>
      <p>המחיר הסופי והנחת קופון, ככל שישנה, מוצגים לפני אישור ההזמנה. המחיר אינו גדל בעקבות מעבר לעמוד הסליקה. אישור תשלום ומסמך חשבונאי מופקים באמצעות Morning בהתאם לעסקה.</p>
    </LegalSection>
    <LegalSection num="02" title="קבוצה קטנה ושמירת מקום">
      <p>הקבוצה מוגבלת ל־{ACADEMY_CONFIG.maximumParticipants} משתתפים. קיום הסמינר מותנה בהרשמה של לפחות {ACADEMY_CONFIG.minimumParticipants} משתתפים בתשלום.</p>
      <p>במהלך התשלום נשמר מקום לזמן מוגבל. הרשמה סופית מותנית בהשלמת התשלום ובקבלת אישור הרשמה.</p>
      <p>אם הסמינר לא יתקיים, יוצע החזר מלא. אפשר לבחור מועד חלופי בהסכמה; הבחירה במועד חלופי אינה תנאי לקבלת החזר.</p>
    </LegalSection>
    <LegalSection num="03" title="בקשת ביטול והחזר">
      <p>{approved ? '' : 'לפי הנוסח המוצע, '}ביטול עד 48 שעות לפני תחילת הסמינר מזכה בהחזר מלא, ללא דמי ביטול.</p>
      <p>בקשה שמתקבלת לאחר מכן תיבחן בהתאם לדין ולנסיבות. זכויות הביטול וההחזר לפי חוק הגנת הצרכן נשמרות בכל מקרה, לרבות זכויות מיוחדות למי שזכאים לכך על פי החוק.</p>
      <p>הודעת ביטול אפשר למסור ב<Link to="/cancel">טופס המקוון</Link>, ללא כניסה לחשבון, או לשלוח ל<a href={`mailto:${SITE.contact.email}`} dir="ltr">{SITE.contact.email}</a> או למסור בטלפון <a href={`tel:${SITE.contact.phone.replace(/-/g, '')}`} dir="ltr">{SITE.contact.phone}</a>. פרטי קשר ומספר הזמנה או מועד הסמינר יעזרו לנו לזהות את ההרשמה; הם אינם תנאי לתיעוד מועד ההודעה.</p>
      {disclosure?.seller && <p>אפשר למסור הודעה גם בדואר רשום לכתובת העסק: {disclosure.seller.postalAddress}. כתובת העסק נפרדת ממקום הסמינר.</p>}
      <p>הדין כולל ציון שם ומספר זהות בהודעת ביטול; מספר הזמנה יסייע בזיהוי. הטופס אינו הדרך היחידה למסירת הודעה ואין צורך לנמק ביטול. ההודעה מתועדת בעת קבלתה, גם אם נדרשת השלמת פרטים אחר כך.</p>
      <p>48 שעות הן הטבה חוזית ולא חישוב של ימים שאינם ימי מנוחה. כאשר זכות ביטול לפי הדין רחבה יותר, היא נשמרת. גם זכויות מיוחדות לאזרח ותיק, לאדם עם מוגבלות ולעולה חדש נשמרות בהתאם לתנאים שבדין.</p>
      <p>החזר יבוצע בהתאם להוראות הדין ולמועדים הקבועים בו. שינוי מועד יתאפשר בהסכמה ובכפוף לזמינות מקומות.</p>
    </LegalSection>
    <LegalSection num="04" title="פרטי קשר ופרטיות">
      <p>פרטי הקשר משמשים לטיפול בהרשמה, למענה ולהעברת פרטים הדרושים להשתתפות. הסכמה לקבלת עדכונים שיווקיים נפרדת ואינה תנאי להרשמה.</p>
      <p>פרטי האשראי מוזנים בעמוד חברת הסליקה. מידע נוסף על הטיפול בפרטים מופיע ב<Link to="/privacy">מדיניות הפרטיות</Link>.</p>
    </LegalSection>
  </LegalPage>;
}
