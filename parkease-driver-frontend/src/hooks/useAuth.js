import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../api/authApi';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, token, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Silent — server logout is best-effort
    } finally {
      clearAuth();
      navigate('/auth/login');
      toast.success('Logged out successfully');
    }
  };

  const isAuthenticated = !!token;
  const isDriver = user?.role === 'DRIVER';

  return { user, token, isAuthenticated, isDriver, setAuth, handleLogout };
};