import axios from "axios";
import { useAuthStore } from "../store/authStore";
import logger from "../utils/logger";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15s timeout
});

// ── Request Interceptor: attach JWT ──────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.log(`📤 SENDING: ${config.method.toUpperCase()} ${config.url} with JWT`);
    } else {
      logger.log(`📤 SENDING: ${config.method.toUpperCase()} ${config.url} (NO JWT)`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 globally ────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login endpoint - let LoginPage handle it
    const isLoginRequest = error.config?.url?.includes("/auth/admin/login");
    
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;