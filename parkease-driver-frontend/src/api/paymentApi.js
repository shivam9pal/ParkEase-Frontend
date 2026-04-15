import api from './axiosInstance';

// ─── OLD: Mock payment (CASH only now) ────────────────────────────────────
// POST /api/v1/payments/initiate
// Role: DRIVER
// Use ONLY for CASH payments
// Body: { bookingId, mode: "CASH" }
// Response 201: PaymentResponse
export const initiateCashPayment = (bookingId) =>
  api.post('/api/v1/payments/initiate', { bookingId, mode: 'CASH' });

// ─── NEW: Razorpay Step 1 — Create Order ──────────────────────────────────
// POST /api/v1/payments/razorpay/create-order
// Role: DRIVER
// Body: { bookingId }
// Response 201: { razorpayOrderId, razorpayKeyId, amount, amountInPaise, currency, paymentId, bookingId }
export const createRazorpayOrder = (bookingId) =>
  api.post('/api/v1/payments/razorpay/create-order', { bookingId });

// ─── NEW: Razorpay Step 2 — Verify & Capture ──────────────────────────────
// POST /api/v1/payments/razorpay/verify
// Role: DRIVER
// Body: { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, mode }
// Response 200: PaymentResponse (status: "PAID")
export const verifyRazorpayPayment = (data) =>
  api.post('/api/v1/payments/razorpay/verify', data);

// ─── Existing: Read-only endpoints (unchanged) ────────────────────────────

// GET /api/v1/payments/history
// Role: DRIVER — returns all payments for logged-in user
export const getMyPayments = () => api.get('/api/v1/payments/history');

// GET /api/v1/payments/booking/{bookingId}
// Role: DRIVER (own only), MANAGER, ADMIN
export const getPaymentByBookingId = (bookingId) =>
  api.get(`/api/v1/payments/booking/${bookingId}`);

// GET /api/v1/payments/{paymentId}/status
// Role: DRIVER (own only), MANAGER, ADMIN
export const getPaymentStatus = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}/status`);

// GET /api/v1/payments/{paymentId}/receipt
// Role: DRIVER (own only), ADMIN
// Response: PDF blob
export const downloadReceipt = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}/receipt`, { responseType: 'blob' });