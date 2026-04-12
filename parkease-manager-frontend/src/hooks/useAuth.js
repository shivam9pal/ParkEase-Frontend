import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { logout as logoutApi } from '../api/authApi';

/**
 * useAuth hook — wraps authStore + logout API call
 */
export const useAuth = () => {
  const { user, token, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API errors — clear client state regardless
    } finally {
      clearAuth();
      toast.success('Logged out successfully.');
      navigate('/manager/login', { replace: true });
    }
  };

  return { user, token, logout };
};