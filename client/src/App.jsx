import { Navigate, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import LandingPage from './pages/LandingPage';
import ResidentLookupPage from './pages/ResidentLookupPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminResidentsPage from './pages/admin/AdminResidentsPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="find-my-resident-info" element={<ResidentLookupPage />} />
        </Route>

        <Route path="/hiyas-admin-access" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="residents" element={<AdminResidentsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
          </Route>
        </Route>
      </Routes>
      <SpeedInsights />
    </>
  );
}

export default App;
