import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CoursePage from "./pages/CoursePage";
import CourseFinder from "./pages/CourseFinder";
import About from "./pages/About";
import Results from "./pages/Results";
import FAQPage from "./pages/FAQPage";
import Contact from "./pages/Contact";
import ThankYou from "./pages/ThankYou";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";

const App = () => (
  <Routes>
    {/* דף ה-Teaser המקורי נשמר כפי שהוא, מחוץ ל-Layout של האתר */}
    <Route path="/coming-soon" element={<ComingSoon />} />

    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:slug" element={<CoursePage />} />
      <Route path="/course-finder" element={<CourseFinder />} />
      <Route path="/about" element={<About />} />
      <Route path="/results" element={<Results />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default App;
