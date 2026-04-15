import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RoleGuard({ allowedRole }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/manager/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/manager/login" replace />;

  return <Outlet />;
}