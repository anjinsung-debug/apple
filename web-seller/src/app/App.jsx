import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import LoginPage from '../features/auth/LoginPage.jsx';
import SellerOrdersPage from '../features/orders/SellerOrdersPage.jsx';
import SellerDeliveryPage from '../features/orders/SellerDeliveryPage.jsx';
import SellerProductsPage from '../features/products/SellerProductsPage.jsx';
import BankSettingsPage from '../features/settings/BankSettingsPage.jsx';

/** 판매자(농장 운영자) 앱 — 화면 경로는 이 파일 하나만 보면 전부 파악되도록 모아둔다 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <SellerDeliveryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <SellerProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/bank"
          element={
            <ProtectedRoute>
              <BankSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
