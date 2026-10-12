import { CLIENT_BRANDS } from '../../data/clientBrands';

export default function ClientLogos() {
  if (!CLIENT_BRANDS.length) return null;
  return <section className="academy-client-banner" aria-labelledby="academy-client-title">
    <div className="academy-container">
      <div className="academy-client-heading"><p className="academy-eyebrow">מותגים וחברות שרון עבד איתם</p><h2 id="academy-client-title">ניסיון שמגיע מהשטח.</h2><p>ממותגים מוכרים ועד חברות טכנולוגיה וגופים אקדמיים — את הניסיון מהפרויקטים האלה רון מביא לעבודה איתכם.</p></div>
      <ul className="academy-client-logos" aria-label="לקוחות ופרויקטים"><li className="sr-only">המותגים מוצגים מתוך ניסיון העבודה של רון.</li>{CLIENT_BRANDS.map(brand => <li key={brand.name} className={brand.light ? 'academy-client-logo-dark-tile' : undefined}><img src={brand.logo} alt={brand.name} loading="lazy" decoding="async" width="180" height="70" /></li>)}</ul>
    </div>
  </section>;
}
