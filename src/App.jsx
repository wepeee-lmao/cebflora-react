import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/coming-soon" element={<ComingSoon />} />


      {/* Signed-in users (any role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/curators" element={<ComingSoon title="Platform Curators" />} />
          <Route path="/taxonomy" element={<ComingSoon title="Browse Taxonomy" />} />
          <Route path="/compare" element={<ComingSoon title="Compare Specimens" />} />
          <Route path="/identify" element={<ComingSoon title="Identification Wizard" />} />
          <Route path="/quiz" element={<ComingSoon title="Taxonomy Quiz" />} />
          <Route path="/profile" element={<ComingSoon title="Settings" />} />
          <Route path="/apply-curator" element={<ComingSoon title="Apply to become a Curator" />} />
        </Route>
      </Route>

      {/* Curators + admins only (example of role-restricted pages) */}
      <Route element={<ProtectedRoute allowedRoles={['curator', 'admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/curator-dashboard" element={<ComingSoon title="Curator Dashboard" />} />
        </Route>
      </Route>

      {/* Admins only */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin-review" element={<ComingSoon title="Curator Applications" />} />
        </Route>
      </Route>

      <Route path="*" element={<h1 style={{ color: 'white' }}>No route for this URL</h1>} />
    </Routes>
  );
}
