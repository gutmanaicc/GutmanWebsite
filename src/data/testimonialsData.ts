/**
 * Student testimonials - screenshots under /public/images/testimonials/.
 */

export type TestimonialCategory = "all" | "business" | "social" | "video";

export type Testimonial = {
  id: string;
  category: Exclude<TestimonialCategory, "all">;
  quote: string;
  text: string;
  image: string;
  tag: string;
};

export const TESTIMONIAL_FILTERS: { id: TestimonialCategory; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "business", label: "בעלי עסקים" },
  { id: "social", label: "מנהלי סושיאל" },
  { id: "video", label: "עורכי וידאו" },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "rec-1",
    category: "business",
    quote: "העליתי מחירים - והלקוחות נשארו",
    text: "אחרי המסלול בניתי תהליך הצעת מחיר מסודר עם AI. תוך שבועות סגרתי עסקאות במחיר גבוה יותר בלי להתנצל.",
    image: "/images/testimonials/Rec_1.jpg",
    tag: "בעלי עסקים",
  },
  {
    id: "rec-2",
    category: "business",
    quote: "מצגת בשווי אלפי שקלים - תוך שעות",
    text: "יצאתי עם תהליך לבניית מצגות עסקיות. מה שהיה עולה לי אלפי שקלים וזמן המתנה - הפך לעבודה שאני שולטת בה בעצמי.",
    image: "/images/testimonials/Rec_2.jpg",
    tag: "בעלי עסקים",
  },
  {
    id: "rec-3",
    category: "business",
    quote: "3,400 ₪ על מצגת? עכשיו אני בונה לבד",
    text: "לפני המסלול שילמתי אלפים על מצגות. עכשיו יש לי תהליך AI מדויק שמוציא תוצר ברמה גבוהה - בלי תלות במעצב.",
    image: "/images/testimonials/Rec_3.jpg",
    tag: "בעלי עסקים",
  },
  {
    id: "rec-4",
    category: "social",
    quote: "עובד AI אוטונומי לכל לקוח",
    text: "בניתי לכל לקוח עובד שמכיר טון, קהל ומטרות. סוף סוף מנהלים יותר לקוחות בלי להסביר הכל מחדש בכל שיחה.",
    image: "/images/testimonials/Rec_4.jpg",
    tag: "מנהלי סושיאל",
  },
  {
    id: "rec-5",
    category: "social",
    quote: "Claude חוסך לי שעות בכל שבוע",
    text: "השיטה מהמסלול הפכה את העבודה עם Claude לשגרה: רעיונות, פוסטים ותסריטים בטון הנכון - בלי להתחיל מאפס.",
    image: "/images/testimonials/Rec_5.jpg",
    tag: "מנהלי סושיאל",
  },
  {
    id: "rec-6",
    category: "social",
    quote: "סוכני תוכן שעובדים גם כשאני לא ליד",
    text: "יצאתי עם סוכנים שממשיכים לייצר תוכן עקבי ללקוחות. פחות שחיקה, יותר איכות, ויותר שליטה על העומס.",
    image: "/images/testimonials/Rec_6.jpg",
    tag: "מנהלי סושיאל",
  },
  {
    id: "rec-7",
    category: "video",
    quote: "עורך וידאו שרץ פי כמה יותר מהר",
    text: "תהליך ההפקה עם AI קיצר לי שלבים שלמים - מרעיון ושוטים ועד טיוטה ללקוח. הקצב השתנה לגמרי.",
    image: "/images/testimonials/Rec_7.jpg",
    tag: "עורכי וידאו",
  },
  {
    id: "rec-8",
    category: "video",
    quote: "מקונספט לסרטון - בשיטה שאפשר לשחזר",
    text: "למדתי תהליך מסחרי עקבי: תסריט, שוטים ועריכה. לא עוד ניסוי וטעייה בכל פרויקט מחדש.",
    image: "/images/testimonials/Rec_8.jpg",
    tag: "עורכי וידאו",
  },
  {
    id: "rec-9",
    category: "video",
    quote: "הלקוח קיבל תוצר ברמה אחרת",
    text: "הסרטון שבניתי במסלול עלה ללקוח אמיתי. הפידבק היה מיידי - וגם הביטחון שלי בתהליך.",
    image: "/images/testimonials/Rec_9.jpg",
    tag: "עורכי וידאו",
  },
  {
    id: "rec-10",
    category: "business",
    quote: "סדר בלקוחות ובתשלומים - סוף סוף",
    text: "בניתי מערכת מעקב שמראה מי שילם ומי חייב. בבוקר פותחים ומבינים בדיוק במה לטפל.",
    image: "/images/testimonials/Rec_10.jpg",
    tag: "בעלי עסקים",
  },
  {
    id: "rec-11",
    category: "social",
    quote: "פחות שחיקה, יותר לקוחות",
    text: "המסלול נתן לי שיטת עבודה ולא רק טיפים. העומס ירד, והיכולת לקחת לקוחות חדשים עלתה.",
    image: "/images/testimonials/Rec_11.jpg",
    tag: "מנהלי סושיאל",
  },
];

export function getTestimonialsByCategory(category: TestimonialCategory): Testimonial[] {
  if (category === "all") return TESTIMONIALS;
  return TESTIMONIALS.filter((t) => t.category === category);
}
