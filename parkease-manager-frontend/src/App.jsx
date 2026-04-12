import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';
import ManagerLayout from './layouts/ManagerLayout';

// Public Pages
import ManagerLoginPage from './pages/public/ManagerLoginPage';
import ManagerRegisterPage from './pages/public/ManagerRegisterPage';
import ManagerForgotPasswordPage from './pages/public/ManagerForgotPasswordPage';

// Protected Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import MyLotsPage from './pages/manager/MyLotsPage';
import LotDetailPage from './pages/manager/LotDetailPage';
import ManageSpotsPage from './pages/manager/ManageSpotsPage';
import LotBookingsPage from './pages/manager/LotBookingsPage';
import ActiveOccupancyPage from './pages/manager/ActiveOccupancyPage';
import RevenuePage from './pages/manager/RevenuePage';
import ProfilePage from './pages/manager/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#3D52A0',
            border: '1px solid #ADBBDA',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#3D52A0', secondary: '#EDE8F5' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/manager/login"           element={<ManagerLoginPage />} />
        <Route path="/manager/register"        element={<ManagerRegisterPage />} />
        <Route path="/manager/forgot-password" element={<ManagerForgotPasswordPage />} />

        {/* ── Protected + Role-Guarded Manager Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allowedRole="MANAGER" />}>
            <Route element={<ManagerLayout />}>

              {/* Dashboard */}
              <Route path="/manager"                              element={<ManagerDashboard />} />

              {/* Lots */}
              <Route path="/manager/lots"                         element={<MyLotsPage />} />
              <Route path="/manager/lots/:lotId"                  element={<LotDetailPage />} />
              <Route path="/manager/lots/:lotId/spots"            element={<ManageSpotsPage />} />
              <Route path="/manager/lots/:lotId/bookings"         element={<LotBookingsPage />} />
              <Route path="/manager/lots/:lotId/occupancy"        element={<ActiveOccupancyPage />} />
              <Route path="/manager/lots/:lotId/revenue"          element={<RevenuePage />} />

              {/* Profile */}
              <Route path="/manager/profile"                      element={<ProfilePage />} />

            </Route>
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/manager/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}