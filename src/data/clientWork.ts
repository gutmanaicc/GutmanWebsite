export type ClientWork = {
  id: string;
  brand: string;
  title: string;
  description: string;
  video: string;
  poster: string;
  logo: string;
  width: number;
  height: number;
  durationSeconds: number;
};

// Original client projects supplied by Ron. These are separate from academy participant work.
export const CLIENT_WORK: ClientWork[] = [
  {
    id: 'baladi',
    brand: 'בלדי',
    title: 'סיפור שמכניס את המותג לפריים.',
    description: 'מתוך עבודותיו של רון גוטמן למותג בלדי.',
    video: '/videos/client-work/baladi.mp4',
    poster: '/images/client-work/baladi.jpg',
    logo: '/clients/baladi.svg',
    width: 720,
    height: 1280,
    durationSeconds: 45,
  },
  {
    id: 'nalla',
    brand: 'נאלה',
    title: 'רעיון, אווירה ותוכן למותג.',
    description: 'מתוך עבודותיו של רון גוטמן למותג נאלה.',
    video: '/videos/client-work/nalla.mp4',
    poster: '/images/client-work/nalla.jpg',
    logo: '/clients/nalla.png',
    width: 1288,
    height: 720,
    durationSeconds: 16.166667,
  },
];

export const CLIENT_WORK_CONTENT = {
  eyebrow: 'מהעבודה של רון',
  title: 'רעיונות שפוגשים\nמותגים אמיתיים.',
  description: 'פרויקטים מסחריים מתוך עבודתו של רון גוטמן. מהסיפור והשפה החזותית ועד לתוכן על המסך.',
  note: 'אלו עבודות ללקוחות, בנפרד מתוצרי משתתפי האקדמיה. הן מציגות את הניסיון שרון מביא לכיתה.',
};
