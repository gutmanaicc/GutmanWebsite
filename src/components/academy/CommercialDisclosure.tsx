import commercial from '../../../shared/commercial-disclosures.json';
import { type LegalDisclosure } from '../../lib/academy';
import { useEffect, useState } from 'react';
import { academyRequest } from '../../lib/academy';

export function CommercialDisclosure({ seminarSlug, compact = false }: { seminarSlug: string; compact?: boolean }) {
  const item = commercial.seminars[seminarSlug as keyof typeof commercial.seminars];
  if (!item) return null;
  return <div className={`academy-commercial-disclosure${compact ? ' academy-commercial-disclosure--compact' : ''}`}><h3>{item.title}</h3><p>{item.text}</p><p>{commercial.common}</p></div>;
}
let disclosureRequest: Promise<LegalDisclosure> | undefined;
export function useMerchantDisclosure() {
  const [value, setValue] = useState<LegalDisclosure | null>(null);
  useEffect(() => {
    let active = true;
    disclosureRequest ??= academyRequest<LegalDisclosure>('/legal-disclosure').catch(error => { disclosureRequest = undefined; throw error; });
    disclosureRequest.then(data => { if (active) setValue(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return value;
}
export function SellerDisclosure({ disclosure }: { disclosure: LegalDisclosure | null | undefined }) {
  if (!disclosure?.sellerComplete || !disclosure.seller) return null;
  const seller = disclosure.seller;
  return <div className="academy-seller-disclosure"><h3>פרטי העסק</h3><p>{seller.businessName} · עוסק פטור · מספר עוסק <bdi>{seller.registrationNumber}</bdi></p><p>כתובת העסק למסירת הודעות: {seller.postalAddress}</p><p><a href={`mailto:${seller.email}`} dir="ltr">{seller.email}</a> · <a href={`tel:${seller.phone.replace(/\D/g, '')}`} dir="ltr">{seller.phone}</a></p></div>;
}
export default commercial;
