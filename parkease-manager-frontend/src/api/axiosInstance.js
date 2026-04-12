import axios from 'axios';
import { useAuthStore } from '../store/authStore';

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