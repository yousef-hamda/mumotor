import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { getTenantSlug } from './lib/tenant';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import DashboardHome from './pages/dashboard/Dashboard';
import DrivingSchool from './pages/dashboard/DrivingSchool';
import Reviews from './pages/dashboard/Reviews';
import Messages from './pages/dashboard/Messages';
import Publishing from './pages/dashboard/Publishing';
import Billing from './pages/dashboard/Billing';
import Settings from './pages/dashboard/Settings';
import BuilderWizard from './pages/builder/BuilderWizard';
import CustomizePage from './pages/customize/CustomizePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PublicSite from './pages/public/PublicSite';
import Enroll from './pages/public/Enroll';
import BookLesson from './pages/public/BookLesson';
import LeaveReview from './pages/public/LeaveReview';
import StudentAccount from './pages/public/StudentAccount';
import TemplatesGallery from './pages/templates/TemplatesGallery';
import TemplatePreview from './pages/templates/TemplatePreview';
import NotFound from './pages/NotFound';

/** The legacy split-pane editor is retired — old /editor links open Customize. */
function EditorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/customize/${id}`} replace />;
}

/**
 * On a teacher's own subdomain (`{slug}.mumotor.com`) the app IS that teacher's
 * site: `/` is their published site and the student flows live at short paths.
 * The `/p/:websiteSlug/*` routes stay mounted too, so any absolute link the
 * templates emit still resolves on the subdomain. Marketing + dashboard + auth
 * live only on the apex host.
 */
function TenantApp() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/enroll" element={<Enroll />} />
      <Route path="/book-lesson" element={<BookLesson />} />
      <Route path="/account" element={<StudentAccount />} />
      <Route path="/review" element={<LeaveReview />} />
      {/* absolute links from templates (/p/:slug/...) still work on the subdomain */}
      <Route path="/p/:websiteSlug" element={<PublicSite />} />
      <Route path="/p/:websiteSlug/enroll" element={<Enroll />} />
      <Route path="/p/:websiteSlug/book-lesson" element={<BookLesson />} />
      <Route path="/p/:websiteSlug/account" element={<StudentAccount />} />
      <Route path="/p/:websiteSlug/review" element={<LeaveReview />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Per-teacher subdomain → serve that teacher's site + student flows only.
  if (getTenantSlug()) return <TenantApp />;

  return (
    <Routes>
      {/* Marketing + auth */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/builder" element={<BuilderWizard />} />

      {/* Template gallery + live interactive previews */}
      <Route path="/templates" element={<TemplatesGallery />} />
      <Route path="/templates/:slug" element={<TemplatePreview />} />
      <Route path="/editor/:id" element={<EditorRedirect />} />
      <Route
        path="/customize/:id"
        element={
          <ProtectedRoute>
            <CustomizePage />
          </ProtectedRoute>
        }
      />

      {/* Teacher dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/driving-school"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DrivingSchool />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reviews"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reviews />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/messages"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Messages />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/publishing"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Publishing />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/billing"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Public student pages */}
      <Route path="/p/:websiteSlug" element={<PublicSite />} />
      <Route path="/p/:websiteSlug/enroll" element={<Enroll />} />
      <Route path="/p/:websiteSlug/book-lesson" element={<BookLesson />} />
      <Route path="/p/:websiteSlug/account" element={<StudentAccount />} />
      <Route path="/p/:websiteSlug/review" element={<LeaveReview />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
