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
import Syllabus from "./pages/Syllabus";
import Register from "./pages/Register";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";

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
