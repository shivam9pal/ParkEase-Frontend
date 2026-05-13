import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import logger from '../utils/logger';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:8080
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST — attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE — handle 401 globally (token expired / unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log new requestId format (from GlobalExceptionHandler)
    const requestId = error.response?.data?.requestId;
    if (requestId) {
      logger.log(`📍 Request ID: ${requestId}`);
    }

    // Fallback: Log old correlationId format (legacy support)
    const correlationId = error.response?.data?.correlationId;
    if (correlationId) {
      logger.log(`📍 Correlation ID: ${correlationId}`);
    }

    // Log old errorCode format (legacy support)
    const errorCode = error.response?.data?.errorCode;
    if (errorCode) {
      logger.log(`❌ Error Code: ${errorCode}`);
    }

    // Log path and method for debugging
    const path = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    if (path && error.response?.status) {
      logger.error(`❌ ${method} ${path} failed with status ${error.response.status}`);
    }

    if (error.response?.status === 401) {
      // Don't auto-redirect if this is a login request
      // (let the login form handle auth errors)
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        useAuthStore.getState().logout();
        window.location.href = '/manager/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;