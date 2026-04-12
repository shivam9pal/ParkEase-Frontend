# ParkEase Manager Frontend - Complete Code Documentation

## 📋 Project Overview

**ParkEase Manager Frontend** is a React-based parking lot management dashboard for managers to control parking operations, track occupancy, manage spots, view bookings, and analyze revenue.

### Key Features
- 🏢 Manage multiple parking lots
- 🚗 Create and manage parking spots
- 📊 Real-time occupancy tracking
- 💰 Revenue analytics
- 🔔 Booking notifications
- 👤 Manager profile management
- 🔐 Role-based access control (Manager role)

---

## 🏗️ Tech Stack

- **Framework**: React 19.2.4
- **State Management**: Zustand 5.0.12 (with persistence)
- **HTTP Client**: Axios 1.14.0 with interceptors
- **UI Components**: Radix UI (dialog, dropdown, select, toast)
- **Styling**: Tailwind CSS 3.4.14
- **Form Handling**: React Hook Form 7.72.1 + Zod 4.3.6 (validation)
- **Routing**: React Router DOM 7.14.0
- **Charts**: Recharts 3.8.1
- **Maps**: React Leaflet 5.0.0 + Leaflet 1.9.4
- **Icons**: Lucide React 1.7.0
- **Notifications**: React Hot Toast 2.6.0
- **Date Handling**: date-fns 4.1.0
- **Build Tool**: Vite 8.0.4
- **Dev Server**: Hot Module Replacement (HMR)

---

## 📁 Directory Structure

```
parkease-manager-frontend/
├── public/                           # Static assets
├── src/
│   ├── api/                          # API integration layer
│   │   ├── axiosInstance.js          # Axios config with interceptors
│   │   ├── authApi.js                # Authentication endpoints
│   │   ├── bookingApi.js             # Booking management
│   │   ├── lotApi.js                 # Parking lot operations
│   │   ├── spotApi.js                # Spot management
│   │   ├── paymentApi.js             # Payment tracking
│   │   ├── analyticsApi.js           # Analytics & reports
│   │   ├── notificationApi.js        # Notifications
│   │   └── store/
│   │       ├── authStore.js          # Auth state (Zustand)
│   │       └── notificationStore.js  # Notification state
│   ├── components/                   # Reusable React components
│   │   ├── common/
│   │   │   ├── Sidebar.jsx           # Left navigation
│   │   │   ├── Topbar.jsx            # Top header bar
│   │   │   ├── PageHeader.jsx        # Page title component
│   │   │   ├── StatCard.jsx          # Dashboard stat cards
│   │   │   ├── NotificationBell.jsx  # Notification dropdown
│   │   │   ├── StatusBadge.jsx       # Status indicators
│   │   │   ├── LoadingSpinner.jsx    # Loading animation
│   │   │   ├── ErrorMessage.jsx      # Error display
│   │   │   ├── EmptyState.jsx        # No data state
│   │   │   └── ConfirmDialog.jsx     # Confirmation modal
│   │   ├── lots/
│   │   │   ├── LotCard.jsx           # Lot preview card
│   │   │   └── LotFormModal.jsx      # Create/edit lot modal
│   │   ├── spots/
│   │   │   ├── SpotCard.jsx          # Spot display card
│   │   │   └── SpotFormModal.jsx     # Create/edit spot modal
│   │   └── bookings/
│   │       └── OccupancyMeter.jsx    # Occupancy visualization
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.js                # Authentication hook
│   │   └── useOccupancyPoller.js     # Polling hook
│   ├── layouts/
│   │   └── ManagerLayout.jsx         # Main app layout
│   ├── pages/                        # Page components
│   │   ├── manager/
│   │   │   ├── ManagerDashboard.jsx  # Main dashboard
│   │   │   ├── MyLotsPage.jsx        # List all lots
│   │   │   ├── LotDetailPage.jsx     # Lot details view
│   │   │   ├── ManageSpotsPage.jsx   # Spot management
│   │   │   ├── LotBookingsPage.jsx   # Bookings list
│   │   │   ├── ActiveOccupancyPage.jsx
│   │   │   ├── RevenuePage.jsx       # Revenue analytics
│   │   │   └── ProfilePage.jsx       # Manager profile
│   │   └── public/
│   │       ├── ManagerLoginPage.jsx  # Login form
│   │       └── ManagerRegisterPage.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx        # Auth guard
│   │   └── RoleGuard.jsx             # Role-based guard
│   ├── utils/
│   │   ├── formatCurrency.js         # ₹ formatting
│   │   ├── formatDateTime.js         # Date/time formatting
│   │   └── formatDuration.js         # Duration formatting
│   ├── App.jsx                       # Route configuration
│   ├── main.jsx                      # React entry point
│   ├── index.css                     # Global styles
│   └── App.css                       # App-specific styles
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── vite.config.js                    # Vite config
├── tailwind.config.js                # Tailwind config
├── postcss.config.js                 # PostCSS config
└── eslint.config.js                  # ESLint rules
```

---

## 📦 Configuration Files

### package.json
```json
{
  "name": "parkease-manager-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-toast": "^1.2.15",
    "axios": "^1.14.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "leaflet": "^1.9.4",
    "lucide-react": "^1.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-hook-form": "^7.72.1",
    "react-hot-toast": "^2.6.0",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.14.0",
    "recharts": "^3.8.1",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  }
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3D52A0",
          hover: "#2e3f7c",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#7091E6",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#8697C4",
          foreground: "#3D52A0",
        },
        accent: {
          DEFAULT: "#ADBBDA",
          foreground: "#3D52A0",
        },
        background: "#EDE8F5",
        surface: "#ffffff",
        border: "#ADBBDA",
        parkease: {
          dark:    "#3D52A0",
          mid:     "#7091E6",
          muted:   "#8697C4",
          light:   "#ADBBDA",
          bg:      "#EDE8F5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(61, 82, 160, 0.08)",
        "card-hover": "0 4px 20px rgba(61, 82, 160, 0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### eslint.config.js
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## 📡 API Layer

### src/api/axiosInstance.js
Axios instance with JWT interceptors for automatic token attachment and 401 error handling.

```javascript
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
      useAuthStore.getState().logout();
      window.location.href = '/manager/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### src/api/authApi.js
Authentication endpoints for login, register, profile, password management, and OTP-based verification.

```javascript
import api from './axiosInstance';

// ── AUTH ──────────────────────────────────────────

// POST /api/v1/auth/register
// Body: { fullName, email, password, phone, role: "MANAGER" }
// Response 201: UserProfileResponse (❌ NO TOKEN — must login after)
export const register = (data) => api.post('/api/v1/auth/register', data);

// POST /api/v1/auth/login
// Body: { email, password }
// Response 200: { accessToken, tokenType, expiresIn, user: UserProfileResponse }
// Errors:
//   - 401: Invalid credentials
//   - 403: Account deactivated
// CRITICAL: Check user.role === 'MANAGER' to enforce manager-only access
export const login = (data) => api.post('/api/v1/auth/login', data);

// POST /api/v1/auth/logout
// Response 200: "Logged out successfully"
export const logout = () => api.post('/api/v1/auth/logout');

// POST /api/v1/auth/refresh
// Body: { token }
// Response 200: { accessToken, tokenType, expiresIn, user }
export const refreshToken = (token) =>
  api.post('/api/v1/auth/refresh', { token });

// ── PROFILE ───────────────────────────────────────

// GET /api/v1/auth/profile
// Response 200: UserProfileResponse
export const getProfile = () => api.get('/api/v1/auth/profile');

// PUT /api/v1/auth/profile
// Body: { fullName?, phone?, profilePicUrl? } — all optional
// Response 200: UserProfileResponse
export const updateProfile = (data) => api.put('/api/v1/auth/profile', data);

// PUT /api/v1/auth/password
// Body: { currentPassword, newPassword }
// Response 200: "Password changed successfully"
export const changePassword = (data) => api.put('/api/v1/auth/password', data);

// DELETE /api/v1/auth/deactivate
// Response 200: "Account deactivated successfully"
export const deactivateAccount = () => api.delete('/api/v1/auth/deactivate');

// ── OTP AUTHENTICATION ────────────────────────────

// POST /api/v1/auth/send-otp
// Body: { email, purpose: "REGISTRATION" | "FORGOT_PASSWORD" }
// Response 200: { message: "OTP sent successfully", retryAfter: null }
// Errors:
//   - 429: Too many requests (rate limited)
//   - 400: Email already registered (only for REGISTRATION purpose)
export const sendOtp = (email, purpose) =>
  api.post('/api/v1/auth/send-otp', { email, purpose });

// POST /api/v1/auth/verify-otp
// Body: { email, otp, purpose: "REGISTRATION" | "FORGOT_PASSWORD" }
// Response 200: { message: "OTP verified successfully" }
// Errors:
//   - 400: OTP expired or invalid
//   - 429: Too many verification attempts
// NOTE: Must verify before calling register or reset-password
export const verifyOtp = (email, otp, purpose) =>
  api.post('/api/v1/auth/verify-otp', { email, otp, purpose });

// POST /api/v1/auth/forgot-password
// Body: { email }
// Response 200: { message: "If account exists, OTP has been sent" } (generic for security)
// NOTE: Does not reveal if account exists — always shows success
export const forgotPassword = (email) =>
  api.post('/api/v1/auth/forgot-password', { email });

// POST /api/v1/auth/reset-password
// Body: { email, newPassword }
// Requires: OTP must be verified first via verify-otp with purpose: "FORGOT_PASSWORD"
// Response 200: { message: "Password reset successfully" }
// Errors:
//   - 403: OTP verification expired or not verified
export const resetPassword = (email, newPassword) =>
  api.post('/api/v1/auth/reset-password', { email, newPassword });

/*
  UserProfileResponse shape:
  {
    userId        : "uuid",
    fullName      : "Jane Manager",
    email         : "jane@parkinglot.com",
    phone         : "+91XXXXXXXXXX",
    role          : "MANAGER",
    vehiclePlate  : null,              // Always null for managers
    isActive      : true,
    createdAt     : "2026-04-01T09:00:00",
    profilePicUrl : null
  }
*/
```

### src/api/bookingApi.js
Booking endpoints for viewing, managing, and tracking bookings.

```javascript
import api from './axiosInstance';

// GET /api/v1/bookings/lot/{lotId}
export const getBookingsByLot = (lotId) =>
  api.get(`/api/v1/bookings/lot/${lotId}`);

// GET /api/v1/bookings/lot/{lotId}/active
export const getActiveBookingsByLot = (lotId) =>
  api.get(`/api/v1/bookings/lot/${lotId}/active`);

// GET /api/v1/bookings/{bookingId}
export const getBookingById = (bookingId) =>
  api.get(`/api/v1/bookings/${bookingId}`);

// PUT /api/v1/bookings/{bookingId}/checkout
export const checkOutBooking = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/checkout`);

// PUT /api/v1/bookings/{bookingId}/cancel
export const cancelBooking = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/cancel`);

// GET /api/v1/bookings/{bookingId}/fare
export const getFareEstimate = (bookingId) =>
  api.get(`/api/v1/bookings/${bookingId}/fare`);

/*
  BookingResponse shape:
  {
    bookingId    : "uuid",
    userId       : "uuid",
    lotId        : "uuid",
    spotId       : "uuid",
    vehicleId    : "uuid",
    vehiclePlate : "DL01AB1234",
    vehicleType  : "FOUR_WHEELER",
    bookingType  : "PRE_BOOKING",
    status       : "ACTIVE",
    pricePerHour : 50.00,
    totalAmount  : null,
    startTime    : "2026-04-07T10:00:00",
    endTime      : "2026-04-07T14:00:00",
    checkInTime  : "2026-04-07T10:05:00",
    checkOutTime : null,
    createdAt    : "2026-04-06T15:00:00"
  }
*/
```

### src/api/lotApi.js
Parking lot CRUD operations and management.

```javascript
import api from './axiosInstance';

// POST /api/v1/lots
export const createLot = (data) => api.post('/api/v1/lots', data);

// GET /api/v1/lots/manager/{managerId}
export const getMyLots = (managerId) =>
  api.get(`/api/v1/lots/manager/${managerId}`);

// GET /api/v1/lots/{lotId}
export const getLotById = (lotId) => api.get(`/api/v1/lots/${lotId}`);

// PUT /api/v1/lots/{lotId}
export const updateLot = (lotId, data) =>
  api.put(`/api/v1/lots/${lotId}`, data);

// PUT /api/v1/lots/{lotId}/toggleOpen
export const toggleLotOpen = (lotId) =>
  api.put(`/api/v1/lots/${lotId}/toggleOpen`);

// DELETE /api/v1/lots/{lotId}
export const deleteLot = (lotId) => api.delete(`/api/v1/lots/${lotId}`);

/*
  LotResponse shape:
  {
    lotId          : "uuid",
    name           : "MG Road Parking",
    address        : "45 MG Road",
    city           : "Bangalore",
    latitude       : 12.9716,
    longitude      : 77.5946,
    totalSpots     : 80,
    availableSpots : 35,
    managerId      : "uuid",
    isOpen         : true,
    openTime       : "07:00:00",
    closeTime      : "23:00:00",
    imageUrl       : "https://...",
    isApproved     : false,
    createdAt      : "2026-04-01T10:00:00"
  }
*/
```

### src/api/spotApi.js
Parking spot management and status updates.

```javascript
import api from './axiosInstance';

// GET /api/v1/spots/lot/{lotId}
export const getSpotsByLot = (lotId) =>
  api.get(`/api/v1/spots/lot/${lotId}`);

// GET /api/v1/spots/{spotId}
export const getSpotById = (spotId) =>
  api.get(`/api/v1/spots/${spotId}`);

// POST /api/v1/spots
export const createSpot = (data) => api.post('/api/v1/spots', data);

// PUT /api/v1/spots/{spotId}
export const updateSpot = (spotId, data) =>
  api.put(`/api/v1/spots/${spotId}`, data);

// DELETE /api/v1/spots/{spotId}
export const deleteSpot = (spotId) => api.delete(`/api/v1/spots/${spotId}`);

// PUT /api/v1/spots/{spotId}/maintenance
export const setSpotMaintenance = (spotId) =>
  api.put(`/api/v1/spots/${spotId}/maintenance`);

// PUT /api/v1/spots/{spotId}/available
export const setSpotAvailable = (spotId) =>
  api.put(`/api/v1/spots/${spotId}/available`);

/*
  SpotResponse shape:
  {
    spotId        : "uuid",
    lotId         : "uuid",
    spotNumber    : "A-01",
    spotType      : "STANDARD",
    vehicleType   : "FOUR_WHEELER",
    status        : "AVAILABLE",
    pricePerHour  : 50.00,
    isEVCharging  : false,
    isHandicapped : false
  }
*/
```

### src/api/paymentApi.js
Payment and revenue tracking endpoints.

```javascript
import api from './axiosInstance';

// GET /api/v1/payments/lot/{lotId}
export const getPaymentsByLot = (lotId) =>
  api.get(`/api/v1/payments/lot/${lotId}`);

// GET /api/v1/payments/{paymentId}
export const getPaymentById = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}`);

// GET /api/v1/payments/{paymentId}/receipt
export const downloadReceipt = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}/receipt`, { responseType: 'blob' });

/*
  PaymentResponse shape:
  {
    paymentId     : "uuid",
    bookingId     : "uuid",
    userId        : "uuid",
    lotId         : "uuid",
    amount        : 150.00,
    status        : "PAID",
    mode          : "UPI",
    transactionId : "TXN102030405",
    currency      : "INR",
    description   : "Parking fee for MG Road Parking",
    paidAt        : "2026-04-07T13:30:00",
    refundedAt    : null,
    createdAt     : "2026-04-07T13:29:00"
  }
*/
```

### src/api/analyticsApi.js
Analytics and reporting endpoints for occupancy, revenue, and insights.

```javascript
import api from './axiosInstance';

// OCCUPANCY
export const getOccupancyRate = (lotId) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}`);

export const getHourlyOccupancy = (lotId) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}/hourly`);

export const getPeakHours = (lotId, topN = 5) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}/peak`, { params: { topN } });

// REVENUE
export const getLotRevenue = (lotId, from, to) =>
  api.get(`/api/v1/analytics/revenue/${lotId}`, { params: { from, to } });

export const getDailyRevenue = (lotId, from, to) =>
  api.get(`/api/v1/analytics/revenue/${lotId}/daily`, { params: { from, to } });

// UTILISATION
export const getSpotTypeUtilisation = (lotId) =>
  api.get(`/api/v1/analytics/spot-types/${lotId}`);

export const getAvgDuration = (lotId) =>
  api.get(`/api/v1/analytics/avg-duration/${lotId}`);

// REPORT
export const getDailyReport = (lotId) =>
  api.get(`/api/v1/analytics/report/${lotId}/daily`);
```

### src/api/notificationApi.js
Notification endpoints for real-time alerts.

```javascript
import api from './axiosInstance';

// GET /api/v1/notifications/my
export const getMyNotifications = () =>
  api.get('/api/v1/notifications/my');

// GET /api/v1/notifications/my/unread
export const getUnreadNotifications = () =>
  api.get('/api/v1/notifications/my/unread');

// GET /api/v1/notifications/my/unread/count
export const getUnreadCount = () =>
  api.get('/api/v1/notifications/my/unread/count');

// PUT /api/v1/notifications/{notificationId}/read
export const markAsRead = (notificationId) =>
  api.put(`/api/v1/notifications/${notificationId}/read`);

// PUT /api/v1/notifications/my/read-all
export const markAllAsRead = () =>
  api.put('/api/v1/notifications/my/read-all');

/*
  NotificationResponse shape:
  {
    notificationId : "uuid",
    recipientId    : "uuid",
    type           : "BOOKING_CREATED",
    title          : "New Booking 🅿️",
    message        : "A driver has booked spot A-05 at MG Road Parking.",
    channel        : "APP",
    relatedId      : "uuid",
    relatedType    : "BOOKING",
    isRead         : false,
    sentAt         : "2026-04-07T10:00:00"
  }
*/
```

---

## 🏪 State Management (Zustand)

### src/api/store/authStore.js
Persistent authentication state with token and user info.

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      // user shape:
      // { userId, fullName, email, phone, role, isActive, createdAt, profilePicUrl }

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (updatedUser) => set({ user: updatedUser }),
    }),
    {
      name: 'parkease-manager-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
```

### src/api/store/notificationStore.js
Notification counter and list state.

```javascript
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (notifications) => set({ notifications }),
  decrementUnread: () =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  clearUnread: () => set({ unreadCount: 0 }),
  addNotification: (notification) =>
    set((s) => ({ notifications: [notification, ...s.notifications] })),
}));
```

---

## 🎣 Custom Hooks

### src/hooks/useAuth.js
Authentication wrapper with logout functionality.

```javascript
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../api/authApi';
import toast from 'react-hot-toast';

export function useAuth() {
  const { token, user, setAuth, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Swallow — we still clear local state
    } finally {
      clearAuth();
      navigate('/manager/login');
      toast.success('Logged out successfully');
    }
  };

  return {
    token,
    user,
    isAuthenticated: !!token,
    isManager: user?.role === 'MANAGER',
    setAuth,
    logout: handleLogout,
  };
}
```

### src/hooks/useOccupancyPoller.js
Polling hook for automatic data refresh.

```javascript
import { useEffect, useRef } from 'react';

/**
 * Polls a callback function every `intervalMs` milliseconds.
 * Cleans up interval on component unmount.
 *
 * @param {Function} callback - async function to call on each tick
 * @param {number}   intervalMs - polling interval (default: 30000ms)
 * @param {boolean}  enabled - set to false to pause polling
 */
export function useOccupancyPoller(callback, intervalMs = 30000, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
```

---

## 🎨 Common Components

### src/components/common/Sidebar.jsx
Left navigation sidebar with lot context switching.

**Features:**
- Main nav links: Dashboard, My Lots, Profile
- Dynamic lot sub-links when viewing a specific lot
- Active link highlighting
- User role info

### src/components/common/Topbar.jsx
Header with welcome message, notification bell, and user menu.

**Features:**
- Welcome greeting with manager name
- Notification bell with unread count
- User dropdown with profile & logout

### src/components/common/PageHeader.jsx
Reusable page header with title, subtitle, back button.

**Props:**
- `title`: Page heading
- `subtitle`: Optional description
- `showBack`: Show back button
- `actions`: Right-side action buttons

### src/components/common/StatCard.jsx
Stat card for dashboards with color variants.

**Features:**
- Title, value, subtitle
- Icon support
- Color themes: blue, green, yellow, red, purple, primary
- Responsive layout

### src/components/common/StatusBadge.jsx
Reusable status indicator badges.

**Supported statuses:**
- Booking: RESERVED, ACTIVE, COMPLETED, CANCELLED
- Spot: AVAILABLE, OCCUPIED, MAINTENANCE
- Payment: PAID, REFUNDED
- Lot: APPROVED, PENDING, OPEN, CLOSED
- Booking type: PRE_BOOKING, WALK_IN

### src/components/common/NotificationBell.jsx
Notification dropdown with polling and mark-as-read.

**Features:**
- Polls unread count every 30 seconds
- Click to fetch unread notifications
- Mark individual or all as read
- Time ago formatting

### src/components/common/LoadingSpinner.jsx
Loading indicator with optional text.

**Props:**
- `size`: "sm" | "md" | "lg"
- `text`: Optional loading message
- `fullPage`: Center in viewport

### src/components/common/ErrorMessage.jsx
Error display with retry button.

**Props:**
- `message`: Error text
- `onRetry`: Retry callback
- `fullPage`: Center in viewport

### src/components/common/EmptyState.jsx
No data placeholder with action.

**Props:**
- `title`: Empty state heading
- `description`: Explanation
- `icon`: Optional icon
- `action`: CTA button

### src/components/common/ConfirmDialog.jsx
Reusable confirmation modal.

**Props:**
- `open`: Dialog visibility
- `onClose`: Close handler
- `onConfirm`: Confirm handler
- `title`: Dialog heading
- `description`: Confirmation message
- `confirmLabel`: Button text
- `variant`: "danger" | "primary"
- `loading`: Button loading state

---

## 🏢 Lot Components

### src/components/lots/LotCard.jsx
Card displaying parking lot with occupancy visualization.

**Features:**
- Lot image with fallback
- Approval & open/close status badges
- Location, hours, availability info
- Occupancy progress bar with color coding
- Quick actions: view details, toggle, edit, delete
- Occupancy percentage display

**Props:**
- `lot`: LotResponse object
- `onEdit`: Edit handler
- `onDeleted`: Deletion handler
- `onUpdated`: Update handler

### src/components/lots/LotFormModal.jsx
Create/edit parking lot modal with map integration.

**Features:**
- Zod validation for all fields
- Interactive Leaflet map for location selection
- Geolocation detection button
- Image URL input
- Time inputs (HH:MM format)
- Pre-fill for edit mode
- Backend error handling (403, etc.)

**Validation:**
- Name: 1-100 chars
- Address, city required
- Latitude: -90 to 90
- Longitude: -180 to 180
- Total spots: ≥ 1
- Times: HH:MM format
- Image URL: valid URL (optional)

---

## 🚗 Spot Components

### src/components/spots/SpotCard.jsx
Card showing individual parking spot details.

**Features:**
- Spot number with type icon
- Vehicle type & price per hour
- EV charging & accessibility badges
- Status indicator (color-coded border)
- Action buttons: edit, delete, maintain, restore
- Prevents deletion if RESERVED or OCCUPIED

**Props:**
- `spot`: SpotResponse object
- `onEdit`, `onDeleted`, `onUpdated`: handlers

### src/components/spots/SpotFormModal.jsx
Create/edit spot modal with enhanced UX.

**Features:**
- Spot type selector: COMPACT, STANDARD, LARGE, MOTORBIKE, EV
- Vehicle type: TWO_WHEELER, FOUR_WHEELER, HEAVY
- Price picker with ₹ prefix
- EV charging & accessibility toggles
- Zod validation
- Duplicate number conflict handling

---

## 📊 Booking Components

### src/components/bookings/OccupancyMeter.jsx
Visual occupancy gauge with progress bar.

**Props:**
- `total`: Total spots
- `available`: Available spots
- `size`: "sm" | "md" | "lg"

**Features:**
- Color-coded bar: green (≤70%), yellow (70-90%), red (≥90%)
- Percentage display
- Occupied/available/total counts

---

## 📄 Pages

### src/pages/public/ManagerLoginPage.jsx
Manager login page with email/password authentication and role-based access control.

**Features:**
- Email + password form with validation
- Password visibility toggle
- "Forgot Password" link
- Sign-up link for new managers
- Split-screen design (branding on left, form on right)
- Mobile responsive with collapsible branding panel

**Validation:**
- Email: Valid email format
- Password: Minimum 8 characters

**API & Error Handling:**
- Calls `POST /api/v1/auth/login` with { email, password }
- **Critical:** Verifies `user.role === 'MANAGER'` — denies non-managers
- Error 401: "Invalid email or password. Please try again."
- Error 403: "Account is deactivated. Contact support."
- Other: "Login failed. Please check your connection."

**On Success:**
- Stores accessToken + user object in Zustand auth store (persisted to localStorage)
- Navigates to `/manager` dashboard
- Shows: "Welcome back, {firstName}! 🎉"

---

### src/pages/public/ManagerRegisterPage.jsx
Manager account creation with 3-step email verification and profile setup.

#### **Step 1: Email Entry**
**Validation:** Valid email format required

**API Call:** `POST /api/v1/auth/send-otp`
- Body: `{ email, purpose: "REGISTRATION" }`
- Error 429: "Too many requests. Please try again later."
- Contains 'already': "This email is already registered. Please sign in."
- Other: "Failed to send OTP. Please try again."

**On Success:**
- Starts 30-second resend timer
- Moves to Step 2
- Toast: "OTP sent to your email! 📧"

#### **Step 2: OTP Verification**
**Validation:** Exactly 6 digits (numeric input)

**API Call:** `POST /api/v1/auth/verify-otp`
- Body: `{ email, otp, purpose: "REGISTRATION" }`
- Error 400: "Invalid or expired OTP. Please try again."
- Error 429: "Too many attempts. Please request a new OTP."
- Other: "Verification failed. Please try again."

**Features:**
- Resend OTP button (disabled during 30s cooldown with countdown)
- Back button to return to Step 1

**On Success:**
- Moves to Step 3
- Toast: "Email verified! Complete your details."

#### **Step 3: Complete Details**
**Validation:**
- `fullName`: 2-100 characters
- `password`: Min 8 chars + 1 uppercase + 1 number + optional special char
- `confirmPassword`: Must match password
- `phone`: Optional, international format (7-15 digits if provided)

**Password Strength Meter:**
- Score 0-1: ❌ Weak (Red)
- Score 2: ⚠️ Fair (Yellow)
- Score 3: ✓ Good (Blue)
- Score 4: ✅ Strong (Green)

**API Call:** `POST /api/v1/auth/register`
- Body: `{ fullName, email, password, phone (or null), role: "MANAGER" }`
- **Important:** ❌ **NO TOKEN RETURNED** — authentication required after registration
- Error 403: "OTP verification expired. Please start again." → Back to Step 1
- Error 400: "Please check your details and try again."
- Other: "Registration failed. Please try again later."

**On Success:**
- Shows success screen with spinner
- Toast: "Account created! Redirecting to login..."
- Auto-redirects to `/manager/login` after 2.5 seconds
- Manual link available to skip to login

---

### src/pages/public/ManagerForgotPasswordPage.jsx
Password reset flow with OTP verification and new password setup.

#### **Step 1: Email Entry**
**Validation:** Valid email format required

**API Call:** `POST /api/v1/auth/forgot-password`
- Body: `{ email }`
- **Security:** Generic success message ("If account exists with this email, OTP has been sent! 📧") shown even if account doesn't exist

**On Success:**
- Starts 30-second resend timer
- Moves to Step 2

#### **Step 2: OTP Verification**
**Validation:** Exactly 6 digits (numeric input)

**API Call:** `POST /api/v1/auth/verify-otp`
- Body: `{ email, otp, purpose: "FORGOT_PASSWORD" }`
- Error 400: "Invalid or expired OTP. Please try again."
- Error 429: "Too many attempts. Please request a new OTP."
- Other: "Verification failed. Please try again."

**Features:**
- Resend OTP button (disabled during 30s cooldown with countdown)
- Back button to return to Step 1

**On Success:**
- Moves to Step 3
- Toast: "OTP verified! Set your new password."

#### **Step 3: Set New Password**
**Validation:**
- `password`: Min 8 chars + 1 uppercase + 1 number
- `confirmPassword`: Must match password
- Same password strength meter as registration (Weak → Fair → Good → Strong)

**API Call:** `POST /api/v1/auth/reset-password`
- Body: `{ email, newPassword: password }`
- **Requirement:** OTP must be verified first via verify-otp
- Error 403: "OTP verification expired. Please start again." → Back to Step 1
- Other: "Password reset failed. Please try again later."

**On Success:**
- Shows success screen with spinner
- Toast: "Password reset successfully! Redirecting..."
- Auto-redirects to `/manager/login` after 2.5 seconds
- Manual link available to skip to login

---

### src/pages/manager/ManagerDashboard.jsx
Main dashboard with summary stats and recent activity.

**Features:**
- Summary cards: Total lots, Approved, Pending, Active now
- Recent lots list with quick toggle
- Live active bookings count
- Recent notifications (last 3)
- Refresh button with loading state
- Error boundary with retry

**Data Fetched:**
- Manager lots, active bookings per lot
- Occupancy rates, recent notifications

### src/pages/manager/MyLotsPage.jsx
Browse and manage all manager lots.

**Features:**
- Filter tabs: All, Approved, Pending
- Search by name/city/address
- View mode toggle: Grid/List
- Create new lot button
- Modal forms for create/edit/delete
- Real-time list updates

**Pagination:** No pagination (assumes < 100 lots)

### src/pages/manager/LotDetailPage.jsx
Detailed view of single lot with stats and map.

**Features:**
- Lot approval status banner
- Lot image & header info
- Live occupancy percentage & bar
- Map with spot markers (color-coded by status)
- Spot counts by status (AVAILABLE, RESERVED, OCCUPIED, MAINTENANCE)
- Navigation tabs to sub-pages
- Daily report data if approved
- Hours of operation display

### src/pages/manager/ManageSpotsPage.jsx
Spot CRUD interface with bulk operations.

**Features:**
- Filter: Spot type, Status
- Search by spot number
- Add single spot button
- Bulk add spots modal (range: 1-50)
- Status summary pills with counts
- Grid view of SpotCards
- Edit/delete per spot

**Bulk Operations:**
- Prefix + range (e.g., "A-01" to "A-50")
- Type, vehicle type, price per hour
- Progress tracking during bulk add

### src/pages/manager/LotBookingsPage.jsx
List all bookings for a lot.

**Features:**
- Booking list with filters
- Status badges (RESERVED, ACTIVE, COMPLETED, CANCELLED)
- Search by vehicle plate or booking ID
- Checkout/cancel quick actions
- Occupancy meter at top

### src/pages/manager/ActiveOccupancyPage.jsx
Real-time occupancy monitoring with polling.

**Features:**
- Live occupancy gauge
- Occupancy trend chart (last 24 hours)
- Peak hours analysis
- Active bookings list with current parked duration

### src/pages/manager/RevenuePage.jsx
Revenue analytics and reporting.

**Features:**
- Date range selector (from/to)
- Total revenue display
- Daily revenue breakdown chart
- Spot type utilisation breakdown
- Payment transaction list

### src/pages/manager/ProfilePage.jsx
Manager profile edit and account settings.

**Features:**
- Display profile info from API or store
- Edit full name, phone, profile picture URL
- Change password with strength indicator
- Account deactivation with confirmation
- Success feedback with short-duration toast
- Form validation with Zod

**Forms:**
1. Profile: name, phone, picture URL
2. Password: current, new, confirm (with strength meter)
3. Deactivate: confirmation only

---

## 🛣️ Routes & Layouts

### src/routes/ProtectedRoute.jsx
Auth guard wrapper.

```javascript
export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/manager/login" replace />;
}
```

### src/routes/RoleGuard.jsx
Role-based access control.

```javascript
export default function RoleGuard({ allowedRole }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/manager/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/manager/login" replace />;
  return <Outlet />;
}
```

### src/layouts/ManagerLayout.jsx
Main app layout with sidebar, topbar, and outlet.

```javascript
export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## 🗺️ Route Structure (src/App.jsx)

```
/manager/login              → ManagerLoginPage
/manager/register           → ManagerRegisterPage

Protected + Manager Role:
  /manager                  → ManagerDashboard
  /manager/lots             → MyLotsPage
  /manager/lots/:lotId      → LotDetailPage
  /manager/lots/:lotId/spots     → ManageSpotsPage
  /manager/lots/:lotId/bookings  → LotBookingsPage
  /manager/lots/:lotId/occupancy → ActiveOccupancyPage
  /manager/lots/:lotId/revenue   → RevenuePage
  /manager/profile          → ProfilePage

Fallback: → /manager/login
```

---

## 🛠️ Utility Functions

### src/utils/formatCurrency.js
Formats numbers as Indian Rupees.

```javascript
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

### src/utils/formatDateTime.js
Date/time formatting utilities.

```javascript
export const formatDateTime = (dateStr) => { /* "07 Apr 2026, 10:30 AM" */ }
export const formatDate = (dateStr) => { /* "07 Apr 2026" */ }
export const formatTime = (dateStr) => { /* "10:30 AM" */ }
export const timeAgo = (dateStr) => { /* "2 hours ago" */ }
export const formatTimeString = (timeStr) => { /* "08:00:00" → "8:00 AM" */ }
```

### src/utils/formatDuration.js
Duration formatting for parking sessions.

```javascript
export const formatDuration = (minutes) => { /* 95 → "1h 35m" */ }
export const durationSince = (checkInTimeStr) => { /* Duration from checkin to now */ }
```

---

## 🎬 Entry Points

### src/main.jsx
React app initialization.

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### src/App.jsx
Route definitions with protected routes and role guards.

```javascript
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" {...toasterOptions} />
      <Routes>
        {/* Public */}
        <Route path="/manager/login"    element={<ManagerLoginPage />} />
        <Route path="/manager/register" element={<ManagerRegisterPage />} />

        {/* Protected + Role-guarded */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allowedRole="MANAGER" />}>
            <Route element={<ManagerLayout />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/lots" element={<MyLotsPage />} />
              {/* ... other routes */}
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/manager/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🎨 Styling System

### Tailwind Configuration
- **Primary**: #3D52A0 (park ease dark blue)
- **Secondary**: #7091E6 (lighter blue)
- **Muted**: #8697C4 (muted accent)
- **Accent**: #ADBBDA (light purple)
- **Background**: #EDE8F5 (very light purple)
- **Surface**: #ffffff (white)

### Custom CSS Classes (src/index.css)
- `.btn-primary`: Primary button styling
- `.btn-secondary`: Secondary button styling
- `.btn-danger`: Danger/delete button styling
- `.card`: Card container with shadow
- `.input-field`: Form input styling
- `.label`: Label styling for forms

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Responsive grid layouts for lots, spots, stats

---

## 🔒 Security Features

1. **JWT Token Management**: Automatic token injection via Axios interceptor
2. **401 Handling**: Global logout on token expiration
3. **Role-based Access Control**: ProtectedRoute + RoleGuard
4. **Persistent Auth**: Zustand with localStorage persistence
5. **Input Validation**: Zod schemas for all forms
6. **API Error Handling**: Status-specific error messages

---

## 📡 Environment Variables

Required `.env` file:
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (HMR enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📊 Component Architecture

```
App (routes)
├── ManagerLayout
│   ├── Sidebar (navigation)
│   ├── Topbar (header + notifications)
│   └── Main Outlet
│       ├── ManagerDashboard
│       ├── MyLotsPage
│       │   └── LotCard (reusable)
│       │       └── LotFormModal
│       ├── LotDetailPage
│       │   └── Map component
│       ├── ManageSpotsPage
│       │   └── SpotCard (reusable)
│       │       └── SpotFormModal
│       ├── LotBookingsPage
│       ├── ActiveOccupancyPage
│       │   └── OccupancyMeter
│       ├── RevenuePage
│       └── ProfilePage
├── ManagerLoginPage
└── ManagerRegisterPage
```

---

## 🔄 Data Flow

1. **Auth Flow**
   - User logs in → `authApi.login()` → token stored in `authStore`
   - Axios interceptor auto-attaches token
   - 401 → auto redirect to /manager/login

2. **Lot Management Flow**
   - Fetch lots: `lotApi.getMyLots()` → display LotCards
   - Create lot: form → `lotApi.createLot()` → modal closes, list updates
   - Edit lot: `lotApi.updateLot()` → card updates
   - Delete lot: `lotApi.deleteLot()` → card removed

3. **Spot Management Flow**
   - Similar CRUD via `spotApi`
   - Bulk operations: loop through range, create spots

4. **Notification Flow**
   - Poll unread count every 30s
   - Click bell → fetch unread notifications
   - Mark as read → decrement counter
   - Background polling keeps count fresh

---

## 🎯 Key Insights for Another Model

1. **State Management**: Zustand for auth + notifications (not Redux)
2. **Form Handling**: React Hook Form + Zod for validation
3. **API Pattern**: Centralized Axios instance with interceptors
4. **Routing**: React Router v7 with nested routes & role guards
5. **UI**: Radix UI primitives + Tailwind CSS (not Material UI)
6. **Maps**: React Leaflet for location visualization
7. **Charts**: Recharts for analytics
8. **Error Handling**: Axios interceptor for 401, per-endpoint catches
9. **Notifications**: Hot Toast for feedback, custom NotificationBell for app notifications
10. **Validation**: Zod schemas for all API payloads
11. **Accessibility**: ARIA labels, semantic HTML, keyboard support
12. **Performance**: Lazy component loading, memoization where needed

---

## 📝 Notes for Developers

- **Unused Page**: RevenuePage, ActiveOccupancyPage exist but may need chart implementations
- **Bulk Spot Add**: Handles failures gracefully (creates what it can)
- **Map Integration**: Leaflet icon needs special handling in Vite (see LotFormModal)
- **Notification Polling**: 30-second interval (configurable via useOccupancyPoller)
- **Time Formatting**: Uses date-fns for locale-aware formatting
- **Mobile Responsive**: All pages mobile-first design
- **Accessibility**: Uses Radix UI for WCAG compliance

---

End of Complete Code Documentation
