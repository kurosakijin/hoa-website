import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import BlockLotsPage from './pages/BlockLotsPage';
import LandingPage from './pages/LandingPage';
import ResidentPage from './pages/ResidentPage';
import ResidentLookupPage from './pages/ResidentLookupPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLandingPageEditor from './pages/admin/AdminLandingPageEditor';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminResidentsPage from './pages/admin/AdminResidentsPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import { getAdminSiteUrl, isAdminHost } from './utils/siteHost';

function ExternalRedirect({ to, fallback }) {
  useEffect(() => {
    if (to && typeof window !== 'undefined') {
      window.location.replace(to);
    }
  }, [to]);

  if (!to) {
    return fallback;
  }

  return (
    <div className="min-h-screen public-shell grid place-items-center px-4">
      <div className="surface-card max-w-md p-8 text-center text-slate-200">
        Redirecting to the admin subdomain...
      </div>
    </div>
  );
}

function AdminLoginEntry() {
  const adminHost = isAdminHost();
  const targetUrl = getAdminSiteUrl('/');

  if (adminHost || !targetUrl) {
    return <AdminLoginPage />;
  }

  return <ExternalRedirect to={targetUrl} fallback={<AdminLoginPage />} />;
}

function AdminSubdomainRedirect() {
  const location = useLocation();
  const targetUrl = getAdminSiteUrl(`${location.pathname}${location.search}${location.hash}`);

  return <ExternalRedirect to={targetUrl} fallback={<Navigate to="/hiyas-admin-access" replace />} />;
}

function App() {
  const adminHost = isAdminHost();

  if (adminHost) {
    return (
      <Routes>
        <Route path="/" element={<AdminLoginPage />} />
        <Route path="/hiyas-admin-access" element={<Navigate to="/" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="landing-page" element={<AdminLandingPageEditor />} />
            <Route path="residents" element={<AdminResidentsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="chat" element={<AdminChatPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="resident-page" element={<ResidentPage />} />
        <Route path="block-and-lots" element={<BlockLotsPage />} />
        <Route path="find-my-resident-info" element={<ResidentLookupPage />} />
      </Route>

      <Route path="/hiyas-admin-access" element={<AdminLoginEntry />} />
      <Route path="/admin/*" element={<AdminSubdomainRedirect />} />
    </Routes>
  );
}

export default App;
