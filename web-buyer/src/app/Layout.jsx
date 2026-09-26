import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">🍎</span> 사과랑
        </Link>

        <nav className="topnav">
          <NavLink to="/order">주문하기</NavLink>
          <NavLink to="/orders">주문 내역</NavLink>
        </nav>

        {user ? (
          <button
            className="btn ghost sm"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            {user.nickname} · 로그아웃
          </button>
        ) : (
          <Link className="btn sm" to="/login">
            로그인
          </Link>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <span>🍎 사과랑 · 산지직송 사과 배송</span>
        <span className="muted">문의 010-6770-7111</span>
      </footer>
    </div>
  );
}
