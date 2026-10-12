export type ClientBrand = {
  name: string;
  logo: string;
  source: string;
  light?: boolean;
};

// Only original assets from identified brands. Ron supplied the client relationships.
// Asset provenance and unresolved names are recorded in docs/academy-client-brand-research.md.
export const CLIENT_BRANDS: ClientBrand[] = [
  { name: 'Touch Store', logo: '/clients/touchstore.svg', source: 'https://www.touchstore.co.il/', light: true },
  { name: 'המרכז האקדמי לוינסקי־וינגייט', logo: '/clients/levinsky-wingate.png', source: 'https://www.l-w.ac.il/', light: true },
  { name: 'אלפא ספורט', logo: '/clients/alfa.svg', source: 'https://alfasport.co.il/' },
  { name: 'הדיה', logo: '/clients/hedia.png', source: 'https://hedia.co.il/', light: true },
  { name: 'Foundera', logo: '/clients/foundera.svg', source: 'https://www.foundera.co/', light: true },
  { name: 'Cognyte', logo: '/clients/cognyte.svg', source: 'https://www.cognyte.com/' },
  { name: 'JW PEI', logo: '/clients/jwpei.png', source: 'https://www.jwpei.com/' },
  { name: 'Reco', logo: '/clients/reco.svg', source: 'https://www.reco.ai/', light: true },
  { name: 'Lasso Security', logo: '/clients/lasso.svg', source: 'https://www.lasso.security/' },
  { name: 'SodaStream', logo: '/clients/sodastream.svg', source: 'https://sodastream.com/' },
  { name: 'MAËLYS', logo: '/clients/maelys.svg', source: 'https://www.maelyscosmetics.com/' },
  { name: 'בלדי', logo: '/clients/baladi.svg', source: 'https://baladi.co.il/' },
  { name: 'Qodo', logo: '/clients/qodo.svg', source: 'https://www.qodo.ai/media-downloads/' },
  { name: 'Nalla', logo: '/clients/nalla.png', source: 'https://www.nalla.co.il/' },
];
