import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import logger from '../utils/logger';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log correlation ID and error code if available
    const correlationId = error.response?.data?.correlationId;
    if (correlationId) {
      logger.log(`📍 Error Reference ID: ${correlationId}`);
    }
    const errorCode = error.response?.data?.errorCode;
    if (errorCode) {
      logger.log(`❌ Error Code: ${errorCode}`);
    }

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isLoginRequest = requestUrl.includes('/api/v1/auth/login');
      if (!isLoginRequest) {
        useAuthStore.getState().logout();
        // Use window.location.origin to work in both dev and production
        window.location.href = window.location.origin + '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;