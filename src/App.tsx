import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminWheelEditor } from './pages/AdminWheelEditor';
import { ParishionerWheel } from './pages/ParishionerWheel';
import { AuthCallback } from './pages/AuthCallback';

// Route protection for Admin pages
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F4F6F5' }}>
        <span>Đang xác minh quyền truy cập...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/auth/callback" element={<AuthCallback />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/wheel/:wheelId"
        element={
          <ProtectedRoute>
            <AdminWheelEditor />
          </ProtectedRoute>
        }
      />

      {/* Public White-label Parishioner Routes */}
      <Route path="/giao-xu/:parishSlug/vong-quay/:wheelSlug" element={<ParishionerWheel />} />
      <Route path="/w/:wheelId" element={<ParishionerWheel />} />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
