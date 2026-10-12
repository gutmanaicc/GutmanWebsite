# Gutman Academy 2.0

פיתוח בעברית ו־RTL בענף `feature/gutman-academy-seminars-v2`. אין פרסום לייצור או סליקה אמיתית.

```bash
npm ci
npm run academy:server  # מסוף ראשון; סליקה חסומה, מועדים בטיוטה
npm run dev            # מסוף שני; http://localhost:5173
npm run build
npm run preview        # תצוגת build מקומית, http://localhost:4173
npm test
```

נדרש Node 24 לפיתוח שרת SQLite. בדיקות הדפדפן משתמשות ב-Chromium מותקן; אפשר להגדיר `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, או להתקין את דפדפן Playwright באמצעות `npx playwright install chromium`.

[סיכום המימוש](docs/academy-v2-implementation.md) · [מדריך תפעול](docs/academy-operations-guide.md) · [סליקה וחסמים](docs/academy-payment-integration.md) · [הצעת מועדים](docs/academy-seminar-schedule-proposal.md) · [בדיקות ושחרור](docs/academy-release-checklist.md)

כניסת ניהול: `/admin/academy`. נדרש `ACADEMY_ADMIN_TOKEN` פרטי בצד שרת; אין סיסמת ברירת מחדל. זרימת hosted checkout נבדקה עם ספק מדומה; adapter Morning האמיתי עדיין חסום. על ה־Mac אפשר לבדוק קריאה בטוחה של הפריט הקיים: `npm run academy:keychain -- --check --service '<שם הפריט>'`. הפקודה אינה מציגה סודות ואינה בדיקת חיבור לספק. הוראות משתנים ואישור תנאים נמצאות במדריך התפעול. קובצי env אינם נקראים אוטומטית על ידי סקריפט השרת. אין להזין נתוני לקוחות אמיתיים בבדיקות.
