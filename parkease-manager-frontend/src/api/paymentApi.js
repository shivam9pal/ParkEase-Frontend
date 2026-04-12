import api from './axiosInstance';

// GET /api/v1/payments/lot/{lotId}
// Role: MANAGER (own lot), ADMIN
// Response 200: PaymentResponse[] — all payments for this lot
// Use for: revenue tracking, financial reports
export const getPaymentsByLot = (lotId) =>
  api.get(`/api/v1/payments/lot/${lotId}`);

// GET /api/v1/payments/{paymentId}
// Role: MANAGER (lot-scoped), ADMIN
// Response 200: PaymentResponse
export const getPaymentById = (paymentId) =>
  api.get(`/api/v1/payments/${paymentId}`);

// GET /api/v1/payments/{paymentId}/receipt
// Role: DRIVER (own), ADMIN
// Response 200: PDF blob
// NOTE: Manager access depends on admin policy — handle 403 gracefully
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
    status        : "PAID",         // PAID | REFUNDED
    mode          : "UPI",          // CARD | UPI | WALLET | CASH
    transactionId : "TXN102030405",
    currency      : "INR",
    description   : "Parking fee for MG Road Parking",
    paidAt        : "2026-04-07T13:30:00",
    refundedAt    : null,
    createdAt     : "2026-04-07T13:29:00"
  }
*/