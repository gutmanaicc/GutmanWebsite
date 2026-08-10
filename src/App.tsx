import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { RegisterModalProvider } from "./context/RegisterModalContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

/** Lazy so coming-soon.css does not leak onto the marketing site. */
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

const App = () => (
  <RegisterModalProvider>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  </RegisterModalProvider>
);

export default App;
