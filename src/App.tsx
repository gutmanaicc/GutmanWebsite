import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { RegisterModalProvider } from "./context/RegisterModalContext";
import { WaitlistModalProvider } from "./context/WaitlistModalContext";
import Home from "./pages/Home";

/*
 * עמוד הבית נטען ישירות, כל השאר בעצלתיים.
 *
 * קודם כל אחד עשר העמודים ישבו בחבילה אחת של 631KB, כך שמי שנחת בעמוד
 * הבית הוריד גם את עמוד הנגישות, את הסילבוסים ואת מדיניות הפרטיות לפני
 * שראה משהו. עמוד הבית עצמו לא מפוצל בכוונה: הוא הנחיתה הנפוצה ביותר,
 * ופיצול שלו רק היה מוסיף הלוך ושוב לרשת לפני הצביעה הראשונה.
 */
const About = lazy(() => import("./pages/About"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const Syllabus = lazy(() => import("./pages/Syllabus"));
const Register = lazy(() => import("./pages/Register"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const NotFound = lazy(() => import("./pages/NotFound"));

/*
 * גבול ה-Suspense לא יושב כאן אלא בתוך Layout, סביב ה-Outlet.
 *
 * כשהוא עטף את Routes כולו, כל ניווט ראשון לעמוד עצל השהה גם את
 * ה-Layout עצמו: ההדר, הפוטר ושכבות הרקע נעלמו יחד עם גוף העמוד,
 * והמסך נשאר קנבס ריק עד שהצ'אנק הגיע. בחיבור איטי זה נקרא כמו ניווט
 * שבור. כשהגבול בפנים, הכרום נשאר על המסך והתוכן לבדו ממתין.
 */
const App = () => (
  <RegisterModalProvider>
    <WaitlistModalProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/syllabus/:slug" element={<Syllabus />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </WaitlistModalProvider>
  </RegisterModalProvider>
);

export default App;
