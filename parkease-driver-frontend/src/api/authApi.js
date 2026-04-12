import api from './axiosInstance';

// Get backend API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// POST /api/v1/auth/register
// Body: { fullName, email, password, phone, role: "DRIVER", vehiclePlate }
// Response 201: UserProfileResponse (no token — must login after)
export const register = (data) => api.post('/api/v1/auth/register', data);

// POST /api/v1/auth/login
// Body: { email, password }
// Response 200: { accessToken, tokenType, expiresIn, user: UserProfileResponse }
export const login = (data) => api.post('/api/v1/auth/login', data);

// POST /api/v1/auth/logout
// Headers: Authorization Bearer (auto-attached by interceptor)
// Response 200: "Logged out successfully"
export const logout = () => api.post('/api/v1/auth/logout');

// POST /api/v1/auth/refresh
// Body: { token }
// Response 200: { accessToken, tokenType, expiresIn, user }
export const refreshToken = (token) =>
  api.post('/api/v1/auth/refresh', { token });

// GET /api/v1/auth/profile
// Response 200: UserProfileResponse
export const getProfile = () => api.get('/api/v1/auth/profile');

// PUT /api/v1/auth/profile
// Body: { fullName?, phone?, vehiclePlate?, profilePicUrl? } — all optional
// Response 200: UserProfileResponse
export const updateProfile = (data) => api.put('/api/v1/auth/profile', data);

// PUT /api/v1/auth/password
// Body: { currentPassword, newPassword }
// Response 200: "Password changed successfully"
export const changePassword = (data) => api.put('/api/v1/auth/password', data);

// DELETE /api/v1/auth/deactivate
// Response 200: "Account deactivated successfully"
export const deactivateAccount = () => api.delete('/api/v1/auth/deactivate');

// ─── OTP Registration & Password Reset ────────────────────────────────────────

// 🆕 POST /api/v1/auth/send-otp
// Send OTP to email before registration or for forgot-password
// purpose must be "REGISTRATION" or "FORGOT_PASSWORD"
export const sendOtp = (email, purpose) =>
  api.post('/api/v1/auth/send-otp', { email, purpose });

// 🆕 POST /api/v1/auth/verify-otp
// Verify the 6-digit OTP sent to email
// purpose must match what was used in sendOtp
export const verifyOtp = (email, otp, purpose) =>
  api.post('/api/v1/auth/verify-otp', { email, otp, purpose });

// 🆕 POST /api/v1/auth/forgot-password
// Send OTP for password reset (purpose=FORGOT_PASSWORD auto-set by backend)
export const forgotPassword = (email) =>
  api.post('/api/v1/auth/forgot-password', { email });

// 🆕 POST /api/v1/auth/reset-password
// Reset password — only works after verify-otp with purpose=FORGOT_PASSWORD
export const resetPassword = (email, newPassword) =>
  api.post('/api/v1/auth/reset-password', { email, newPassword });

// ─── OAuth2 Social Login (NOT Axios — direct browser redirects) ───────────────
// Spring Security handles the full OAuth2 flow
// On success: OAuth2SuccessHandler writes AuthResponse JSON directly

export const loginWithGoogle = () => {
  window.open(
    `${API_BASE_URL}/oauth2/authorization/google`,
    'oauth2-popup',
    'width=500,height=600,scrollbars=yes'
  );
};

export const loginWithGithub = () => {
  window.open(
    `${API_BASE_URL}/oauth2/authorization/github`,
    'oauth2-popup',
    'width=500,height=600,scrollbars=yes'
  );
};