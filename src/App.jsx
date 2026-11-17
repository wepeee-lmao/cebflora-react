import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import SavedPlants from './pages/SavedPlants';
import PlantDetail from './pages/PlantDetail';
import ManagePlants from './pages/ManagePlants';
import PlantEdit from './pages/PlantEdit';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Signed-in users (any role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/saved" element={<SavedPlants />} />
          <Route path="/plants/:id" element={<PlantDetail />} />
          <Route path="/curators" element={<ComingSoon title="Community" />} />
          <Route path="/taxonomy" element={<ComingSoon title="Browse Taxonomy" />} />
          <Route path="/compare" element={<ComingSoon title="Compare Specimens" />} />
          <Route path="/quiz" element={<ComingSoon title="Taxonomy Quiz" />} />
          <Route path="/profile" element={<ComingSoon title="Settings" />} />
          <Route path="/apply-curator" element={<ComingSoon title="Apply to become a Curator" />} />
        </Route>
      </Route>

      {/* Curators + admins only */}
      <Route element={<ProtectedRoute allowedRoles={['curator', 'admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/manage" element={<ManagePlants />} />
          <Route path="/manage/new" element={<PlantEdit />} />
          <Route path="/manage/:id/edit" element={<PlantEdit />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}