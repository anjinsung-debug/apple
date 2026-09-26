import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page"><p className="muted">불러오는 중…</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
