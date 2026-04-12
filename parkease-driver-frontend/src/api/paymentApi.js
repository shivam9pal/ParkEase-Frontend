import api from './axiosInstance';

// POST /api/v1/payments/initiate
// Role: DRIVER
// Body: CreatePaymentRequest
// Response 201: PaymentResponse
// Mock Payment — no real gateway. Driver selects mode, backend records it.
// totalAmount comes from booking.totalAmount (set at checkout)
export const createPayment = (data) => api.post('/api/v1/payments/initiate', data);

// GET /api/v1/payments/history
// Role: DRIVER
// Returns: PaymentResponse[] — all payments for logged-in driver
export const getMyPayments = () => api.get('/api/v1/payments/history');

// GET /api/v1/payments/{paymentId}
// Role: DRIVER (own only), MANAGER, ADMIN
// Response 200: PaymentResponse
export const getPaymentById = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}`);

// GET /api/v1/payments/{paymentId}/receipt
// Role: DRIVER (own only), ADMIN
// Response 200: PDF blob (application/pdf)
// Usage: open in new tab or trigger download
export const downloadReceipt = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}/receipt`, {
    responseType: 'blob',
  });

/* ── CreatePaymentRequest shape (Mock Payment) ───────────────────────────────
{
  bookingId:   "uuid",
  amount:      150.00,                  ← from booking.totalAmount
  mode:        "CARD" | "UPI" | "WALLET" | "CASH",
  description: "Parking fee for Downtown Parking"
}

── PaymentResponse shape ─────────────────────────────────────────────────────
{
  paymentId, bookingId, userId, lotId,
  amount, status: "PAID" | "REFUNDED",
  mode, transactionId, currency,
  description, paidAt, refundedAt, createdAt
}

── Receipt Download Usage ────────────────────────────────────────────────────
const res = await downloadReceipt(paymentId);
const blob = new Blob([res.data], { type: 'application/pdf' });
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href     = url;
a.download = `receipt-${paymentId}.pdf`;
a.click();
URL.revokeObjectURL(url);
────────────────────────────────────────────────────────────────────────────── */