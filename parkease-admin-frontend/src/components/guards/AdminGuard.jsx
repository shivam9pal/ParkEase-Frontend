import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AdminGuard({ children }) {
  const { token, admin } = useAuthStore();

  if (!token || !admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}