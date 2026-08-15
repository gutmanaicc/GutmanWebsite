import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { RegisterModalProvider } from "./context/RegisterModalContext";
import { WaitlistModalProvider } from "./context/WaitlistModalContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Reviews from "./pages/Reviews";
import Privacy from "./pages/Privacy";
import Accessibility from "./pages/Accessibility";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

/** Lazy so coming-soon.css does not leak onto the marketing site. */
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

const App = () => (
  <RegisterModalProvider>
    <WaitlistModalProvider>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
    </WaitlistModalProvider>
  </RegisterModalProvider>
);

export default App;
