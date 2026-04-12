import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';
import DriverLayout from './layouts/DriverLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ExploreParkingPage from './pages/public/ExploreParkingPage';
import PublicLotDetailPage from './pages/public/PublicLotDetailPage';
import PublicSpotDetailPage from './pages/public/PublicSpotDetailPage';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import FindParkingPage from './pages/driver/FindParkingPage';
import LotDetailPage from './pages/driver/LotDetailPage';
import MyBookingsPage from './pages/driver/MyBookingsPage';
import BookingDetailPage from './pages/driver/BookingDetailPage';
import PaymentHistoryPage from './pages/driver/PaymentHistoryPage';
import MyVehiclesPage from './pages/driver/MyVehiclesPage';
import ProfilePage from './pages/driver/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#ffffff',
            color: '#3D52A0',
            border: '1px solid #ADBBDA',
            fontWeight: '500',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#3D52A0', secondary: '#EDE8F5' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExploreParkingPage />} />
        <Route path="/explore/lots/:lotId" element={<PublicLotDetailPage />} />
        <Route path="/explore/spots/:spotId" element={<PublicSpotDetailPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

        {/* Driver Routes — Protected + Role-Guarded */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allowedRole="DRIVER" />}>
            <Route element={<DriverLayout />}>
              <Route path="/driver" element={<DriverDashboard />} />
              <Route path="/driver/find-parking" element={<FindParkingPage />} />
              <Route path="/driver/lots/:lotId" element={<LotDetailPage />} />
              <Route path="/driver/bookings" element={<MyBookingsPage />} />
              <Route path="/driver/bookings/:bookingId" element={<BookingDetailPage />} />
              <Route path="/driver/payments" element={<PaymentHistoryPage />} />
              <Route path="/driver/vehicles" element={<MyVehiclesPage />} />
              <Route path="/driver/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}