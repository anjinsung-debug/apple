import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import HomePage from '../features/home/HomePage.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import NewOrderPage from '../features/orders/NewOrderPage.jsx';
import MyOrdersPage from '../features/orders/MyOrdersPage.jsx';
import OrderDetailPage from '../features/orders/OrderDetailPage.jsx';

/** 구매자 앱 — 화면 경로는 이 파일 하나만 보면 전부 파악되도록 모아둔다 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <NewOrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
