import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading, isSeller, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <div className="page"><p className="muted">불러오는 중…</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (!isSeller) {
    return (
      <div className="page narrow">
        <p className="error">이 앱은 판매자 전용입니다. 판매자 계정으로 다시 로그인해주세요.</p>
        <button
          className="btn ghost full"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return children;
}
