import api from './axiosInstance';

// ── Auth ──────────────────────────────────────────────
// POST /api/v1/auth/register
// Body: { fullName, email, password, phone, role: "MANAGER" }
// Response 201: UserProfileResponse (no token — login after register)
export const register = (data) => api.post('/api/v1/auth/register', data);

// POST /api/v1/auth/login
// Body: { email, password }
// Response 200: { accessToken, tokenType, expiresIn, user: UserProfileResponse }
export const login = (data) => api.post('/api/v1/auth/login', data);

// POST /api/v1/auth/logout
// Response 200: "Logged out successfully"
export const logout = () => api.post('/api/v1/auth/logout');

// POST /api/v1/auth/refresh
// Body: { token }
// Response 200: { accessToken, tokenType, expiresIn, user }
export const refreshToken = (token) =>
  api.post('/api/v1/auth/refresh', { token });

// ── Profile ───────────────────────────────────────────
// GET /api/v1/auth/profile
// Response 200: UserProfileResponse
export const getProfile = () => api.get('/api/v1/auth/profile');

// PUT /api/v1/auth/profile
// Body: { fullName?, phone?, profilePicUrl? }  ← all optional
// Response 200: UserProfileResponse
export const updateProfile = (data) => api.put('/api/v1/auth/profile', data);

// PUT /api/v1/auth/password
// Body: { currentPassword, newPassword }
// Response 200: "Password changed successfully"
export const changePassword = (data) => api.put('/api/v1/auth/password', data);

// DELETE /api/v1/auth/deactivate
// Response 200: "Account deactivated successfully"
export const deactivateAccount = () => api.delete('/api/v1/auth/deactivate');

// ── OTP Authentication ────────────────────────────────
// POST /api/v1/auth/send-otp
// Body: { email, purpose: "REGISTER" | "RESET_PASSWORD" }
// Response 200: { message: "OTP sent successfully", retryAfter: null }
// Response 429: Too many requests (rate limited)
export const sendOtp = (email, purpose) =>
  api.post('/api/v1/auth/send-otp', { email, purpose });

// POST /api/v1/auth/verify-otp
// Body: { email, otp, purpose: "REGISTER" | "RESET_PASSWORD" }
// Response 200: { message: "OTP verified successfully" }
// Response 400: OTP expired or invalid
export const verifyOtp = (email, otp, purpose) =>
  api.post('/api/v1/auth/verify-otp', { email, otp, purpose });

// POST /api/v1/auth/forgot-password
// Body: { email }
// Response 200: { message: "If account exists, OTP has been sent" } (generic for security)
export const forgotPassword = (email) =>
  api.post('/api/v1/auth/forgot-password', { email });

// POST /api/v1/auth/reset-password
// Body: { email, newPassword }
// Requires: OTP must be verified first via verify-otp with purpose: "RESET_PASSWORD"
// Response 200: { message: "Password reset successfully" }
// Response 403: OTP not verified or OTP verification expired
export const resetPassword = (email, newPassword) =>
  api.post('/api/v1/auth/reset-password', { email, newPassword });

/*
  UserProfileResponse shape:
  {
    userId       : "uuid",
    fullName     : "Jane Manager",
    email        : "jane@parkinglot.com",
    phone        : "+91XXXXXXXXXX",
    role         : "MANAGER",
    vehiclePlate : null,
    isActive     : true,
    createdAt    : "2026-04-01T09:00:00",
    profilePicUrl: null
  }
*/