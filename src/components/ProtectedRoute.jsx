import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage in the router:
//   <Route element={<ProtectedRoute />}> ...any signed-in page... </Route>
//   <Route element={<ProtectedRoute allowedRoles={['curator','admin']} />}> ... </Route>
export default function ProtectedRoute({ allowedRoles = null }) {
  const { session, profile, loading } = useAuth();

  if (loading) return null; // or a spinner

  // Not signed in, or profile row missing -> login (same as the old requireAuth)
  if (!session || !profile) return <Navigate to="/login" replace />;

  // Signed in, but wrong role for this page -> dashboard
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
