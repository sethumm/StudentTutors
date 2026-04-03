import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const TutorListing = lazy(() => import('./pages/TutorListing'));
const TutorProfile = lazy(() => import('./pages/TutorProfile'));
const TutorRegister = lazy(() => import('./pages/TutorRegister'));
const CustomerRegister = lazy(() => import('./pages/CustomerRegister'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const ConversationsList = lazy(() => import('./pages/ConversationsList'));
const ChatConversation = lazy(() => import('./pages/ChatConversation'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminReviews = lazy(() => import('./pages/AdminReviews'));
const AdminAudit = lazy(() => import('./pages/AdminAudit'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tutors" element={<TutorListing />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
        <Route path="/register/tutor" element={<TutorRegister />} />
        <Route path="/register/customer" element={<CustomerRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Tutor-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
          <Route path="/dashboard/tutor" element={<TutorDashboard />} />
        </Route>

        {/* Customer-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Route>

        {/* Tutor or customer routes */}
        <Route element={<ProtectedRoute allowedRoles={['tutor', 'customer']} />}>
          <Route path="/messages" element={<ConversationsList />} />
          <Route path="/messages/:connectionId" element={<ChatConversation />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
