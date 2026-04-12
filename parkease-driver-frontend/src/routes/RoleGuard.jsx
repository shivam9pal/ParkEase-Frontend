import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RoleGuard({ allowedRole }) {
  const user = useAuthStore((s) => s.user);

  if (!user || user.role !== allowedRole) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}