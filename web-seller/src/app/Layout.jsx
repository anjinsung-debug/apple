import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">🍎</span> 사과랑 판매자
        </Link>

        <nav className="topnav">
          <NavLink to="/" end>들어온 주문</NavLink>
          <NavLink to="/products">판매 품목</NavLink>
          <NavLink to="/settings/bank">계좌 정보</NavLink>
        </nav>

        {user ? (
          <button
            className="btn ghost sm"
            onClick={() => {
              logout();
              navigate('/login');
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
        <span>🍎 사과랑 판매자 · 주문·배송 관리</span>
        <span className="muted">문의 010-6770-7111</span>
      </footer>
    </div>
  );
}
