import api from './axiosInstance';

// GET /api/v1/bookings/lot/{lotId}
// Role: MANAGER or ADMIN
// Response 200: BookingResponse[] — ALL bookings for this lot (all statuses)
// Use for: full booking history, reports, revenue cross-reference
export const getBookingsByLot = (lotId) =>
  api.get(`/api/v1/bookings/lot/${lotId}`);

// GET /api/v1/bookings/lot/{lotId}/active
// Role: MANAGER or ADMIN
// Response 200: BookingResponse[] — ACTIVE bookings ONLY
// Use for: live dashboard, real-time occupancy — who is currently parked
export const getActiveBookingsByLot = (lotId) =>
  api.get(`/api/v1/bookings/lot/${lotId}/active`);

// GET /api/v1/bookings/{bookingId}
// Role: MANAGER or ADMIN (can view any booking — no ownership restriction)
// Response 200: BookingResponse | 404: not found
export const getBookingById = (bookingId) =>
  api.get(`/api/v1/bookings/${bookingId}`);

// PUT /api/v1/bookings/{bookingId}/checkout
// Role: DRIVER, MANAGER, or ADMIN
// Requirement: Booking status must be ACTIVE
// Response 200: BookingResponse (ACTIVE → COMPLETED, totalAmount calculated)
// Fare formula: max(1 hour minimum, actual hours) × pricePerHour
export const checkOutBooking = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/checkout`);

// PUT /api/v1/bookings/{bookingId}/cancel
// Role: DRIVER (own only), MANAGER, ADMIN
// Requirement: Status must be RESERVED or ACTIVE
// Response 200: BookingResponse (status → CANCELLED)
export const cancelBooking = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/cancel`);

// GET /api/v1/bookings/{bookingId}/fare
// Role: Public (no auth required)
// Response 200: FareCalculationResponse (READ-ONLY — does NOT persist)
// Use: show live fare estimate before manual checkout confirmation
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
    bookingType  : "PRE_BOOKING",   // PRE_BOOKING | WALK_IN
    status       : "ACTIVE",        // RESERVED | ACTIVE | COMPLETED | CANCELLED
    pricePerHour : 50.00,
    totalAmount  : null,            // null until checkout
    startTime    : "2026-04-07T10:00:00",
    endTime      : "2026-04-07T14:00:00",
    checkInTime  : "2026-04-07T10:05:00",
    checkOutTime : null,
    createdAt    : "2026-04-06T15:00:00"
  }

  FareCalculationResponse shape:
  {
    bookingId      : "uuid",
    checkInTime    : "2026-04-07T10:05:00",
    currentTime    : "2026-04-07T12:20:00",
    pricePerHour   : 50.00,
    estimatedHours : 2.25,
    estimatedFare  : 112.50
  }
*/