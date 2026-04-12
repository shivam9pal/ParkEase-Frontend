import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function SuperAdminGuard({ children }) {
  const { isSuperAdmin } = useAuthStore();

  // Non-super admins go back to dashboard, NOT login
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}