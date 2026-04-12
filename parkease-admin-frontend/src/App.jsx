import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminGuard from "./components/guards/AdminGuard";
import SuperAdminGuard from "./components/guards/SuperAdminGuard";
import AdminLayout from "./components/layout/AdminLayout";

import LoginPage           from "./pages/LoginPage";
import DashboardPage       from "./pages/DashboardPage";
import UserManagementPage  from "./pages/UserManagementPage";
import LotManagementPage   from "./pages/LotManagementPage";
import AllBookingsPage     from "./pages/AllBookingsPage";
import AllPaymentsPage     from "./pages/AllPaymentsPage";
// import PlatformAnalyticsPage from "./pages/PlatformAnalyticsPage"; // Disabled for now
import LotAnalyticsPage    from "./pages/LotAnalyticsPage";
import AllNotificationsPage from "./pages/AllNotificationsPage";
import BroadcastPage       from "./pages/BroadcastPage";
import AdminManagementPage from "./pages/AdminManagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected — Admin only */}
        <Route
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/users"              element={<UserManagementPage />} />
          <Route path="/lots"               element={<LotManagementPage />} />
          <Route path="/bookings"           element={<AllBookingsPage />} />
          <Route path="/payments"           element={<AllPaymentsPage />} />
          {/* <Route path="/analytics/platform" element={<PlatformAnalyticsPage />} /> */}
          <Route path="/analytics/lots"     element={<LotAnalyticsPage />} />
          <Route path="/notifications"      element={<AllNotificationsPage />} />
          <Route path="/broadcast"          element={<BroadcastPage />} />

          {/* Super Admin only */}
          <Route
            path="/admin-management"
            element={
              <SuperAdminGuard>
                <AdminManagementPage />
              </SuperAdminGuard>
            }
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}