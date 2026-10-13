import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AcademyLayout from './components/AcademyLayout';
import Home from './pages/Home';
const Courses = lazy(() => import('./pages/Courses'));
const SeminarDetail = lazy(() => import('./pages/SeminarDetail'));
const About = lazy(() => import('./pages/About'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Privacy = lazy(() => import('./pages/Privacy'));
const BookingTerms = lazy(() => import('./pages/BookingTerms'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const AcademyAdmin = lazy(() => import('./pages/AcademyAdmin'));
const RetiredCourse = lazy(() => import('./pages/RetiredCourse'));
const NotFound = lazy(() => import('./pages/NotFound'));
export default function App() {
  return <Routes><Route element={<AcademyLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/courses/ai-fashion" element={<RetiredCourse slug="ai-fashion" />} />
    <Route path="/courses/ai-for-therapists" element={<RetiredCourse slug="ai-for-therapists" />} />
    <Route path="/courses/ai-for-students" element={<RetiredCourse slug="ai-for-students" />} />
    <Route path="/courses/:slug" element={<SeminarDetail />} />
    <Route path="/lp/ai-fashion" element={<RetiredCourse slug="ai-fashion" />} />
    <Route path="/syllabus/ai-fashion" element={<RetiredCourse slug="ai-fashion" />} />
    <Route path="/syllabus/ai-for-therapists" element={<RetiredCourse slug="ai-for-therapists" />} />
    <Route path="/syllabus/ai-for-students" element={<RetiredCourse slug="ai-for-students" />} />
    <Route path="/syllabus/:slug" element={<SeminarDetail />} />
    <Route path="/about" element={<About />} />
    <Route path="/reviews" element={<Reviews />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/booking-terms" element={<BookingTerms />} />
    <Route path="/accessibility" element={<Accessibility />} />
    <Route path="/register" element={<Checkout />} />
    <Route path="/orders/:orderId" element={<OrderConfirmation />} />
    <Route path="/thank-you" element={<OrderConfirmation />} />
    <Route path="/admin/academy" element={<AcademyAdmin />} />
    <Route path="/seminars" element={<Navigate to="/courses" replace />} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes>;
}
