export const seminarNames = {
  'social-media-ai': 'AI למנהלי ומנהלות סושיאל',
  'ai-video-content': 'יצירת וידאו ותוכן באמצעות AI',
  'ai-business-owners': 'AI לבעלי עסקים',
};

/** Transactional service messages; marketing consent is separate and never assumed. No sends here. */
export function buildMessage(kind, order, date) {
  const label = seminarNames[date.seminarId] ?? date.seminarId;
  const detail = `${label} | ${date.date} | 15:00–20:00 | ${date.venue}`;
  const preparation = {
    'social-media-ai': 'הביאו בריף של לקוח או מותג, דוגמאות תוכן ותיאור קהל שאפשר לשתף בבטחה.',
    'ai-video-content': 'הביאו אוזניות, רעיון קצר לסרטון וחומרי מקור שאפשר לשתף. ודאו גישה לכלי היצירה והעריכה לפי רשימת ההכנה של הסמינר.',
    'ai-business-owners': 'הכינו תיאור קצר של העסק והשירותים שלכם, ומשימה שחוזרת על עצמה עם דוגמאות ללא מידע רגיש.',
  }[date.seminarId] ?? '';
  const templates = {
    confirmation: ['אישור הרשמה — מכללת גוטמן', order.simulation ? `שלום ${order.customer.name}, ההרשמה אומתה בסביבת ההדגמה. ${detail}. אסמכתא: ${order.id}. זהו אישור הדגמה ואינו קבלה או רכישה אמיתית.` : `שלום ${order.customer.name}, התשלום אומת והרשמתכם התקבלה. ${detail}. מספר הזמנה: ${order.id}. פתיחת הסמינר מותנית במינימום המשתתפים בהתאם לתנאי ההרשמה. אישור זה אינו קבלה.`],
    preparation: ['לקראת הסמינר שלכם', `שלום ${order.customer.name}, ${detail}. הביאו מחשב נייד, מטען וגישה לחשבונות הכלים שלכם. ${preparation}`],
    reminder: ['תזכורת לסמינר שלכם', `שלום ${order.customer.name}, הסמינר שלכם: ${detail}. בדקו את פרטי המיקום המעודכנים והביאו מחשב ומטען.`],
    followup: ['ממשיכים לתרגל', `שלום ${order.customer.name}, תודה על ההשתתפות ב${label}. בחרו משימה אחת לתרגול, המשיכו לעבוד עם התוצר שבניתם ובדקו את התוצאה לפני שימוש או פרסום.`],
    cancellation: ['עדכון על ההרשמה', `שלום ${order.customer.name}, ההרשמה ל${detail} בוטלה בסביבת ההדגמה. אם נדרש החזר אמיתי, יש לבדוק מול ספק התשלום; אין כאן אישור לביצוע החזר כספי אמיתי.`],
  };
  const [subject, text] = templates[kind];
  return { to: order.customer.email, subject, text, orderId: order.id, dateId: date.id, simulation: Boolean(order.simulation) };
}
