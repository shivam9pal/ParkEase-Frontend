import api from './axiosInstance';

// POST /api/v1/bookings
// Role: DRIVER only
// Body: CreateBookingRequest
// Response 201: BookingResponse
export const createBooking = (data) => api.post('/api/v1/bookings', data);

// GET /api/v1/bookings/my
// Role: DRIVER
// Returns: BookingResponse[] — ALL statuses (RESERVED, ACTIVE, COMPLETED, CANCELLED)
export const getMyBookings = () => api.get('/api/v1/bookings/my');

// GET /api/v1/bookings/history
// Role: DRIVER
// Returns: BookingResponse[] — COMPLETED and CANCELLED only, newest first
export const getBookingHistory = () => api.get('/api/v1/bookings/history');

// GET /api/v1/bookings/{bookingId}
// Role: DRIVER (own only — 403 if not owner), MANAGER, ADMIN
// Response 404: not found | 403: not owner
export const getBookingById = (bookingId) =>
  api.get(`/api/v1/bookings/${bookingId}`);

// PUT /api/v1/bookings/{bookingId}/checkin
// Role: DRIVER only
// Requirement: status must be RESERVED (PRE_BOOKING type)
// Response 200: BookingResponse — status RESERVED → ACTIVE
export const checkIn = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/checkin`);

// PUT /api/v1/bookings/{bookingId}/checkout
// Role: DRIVER, MANAGER, ADMIN
// Requirement: status must be ACTIVE
// Response 200: BookingResponse — status ACTIVE → COMPLETED, totalAmount set
export const checkOut = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/checkout`);

// PUT /api/v1/bookings/{bookingId}/cancel
// Role: DRIVER (own only), MANAGER, ADMIN
// Requirement: status must be RESERVED or ACTIVE
// Response 200: BookingResponse — status → CANCELLED
export const cancelBooking = (bookingId) =>
  api.put(`/api/v1/bookings/${bookingId}/cancel`);

// PUT /api/v1/bookings/{bookingId}/extend
// Role: DRIVER only
// Body: { newEndTime: "2026-04-07T18:00:00" }  ← ISO-8601 LocalDateTime
// Requirement: newEndTime > current endTime AND newEndTime in future
// Requirement: status must be RESERVED or ACTIVE
// Response 200: BookingResponse — endTime updated
export const extendBooking = (bookingId, newEndTime) =>
  api.put(`/api/v1/bookings/${bookingId}/extend`, { newEndTime });

// GET /api/v1/bookings/{bookingId}/fare
// Public — no auth required
// Response 200: FareCalculationResponse
// READ-ONLY — does NOT persist. Actual fare set at checkout only.
// Formula: max(60, minutesSinceCheckIn) / 60 * pricePerHour (HALF_UP 2dp)
export const getFareEstimate = (bookingId) =>
  api.get(`/api/v1/bookings/${bookingId}/fare`);

/* ── CreateBookingRequest shape ───────────────────────────────────────────────
{
  spotId:      "uuid",
  vehicleId:   "uuid",
  bookingType: "PRE_BOOKING" | "WALK_IN",
  startTime:   "2026-04-07T10:00:00",   ← no Z, no ms
  endTime:     "2026-04-07T14:00:00"
}

── BookingResponse shape ─────────────────────────────────────────────────────
{
  bookingId, userId, lotId, spotId, vehicleId,
  vehiclePlate, vehicleType,
  bookingType:  PRE_BOOKING | WALK_IN
  status:       RESERVED | ACTIVE | COMPLETED | CANCELLED
  pricePerHour, totalAmount,
  startTime, endTime, checkInTime, checkOutTime, createdAt
}

── FareCalculationResponse shape ─────────────────────────────────────────────
{
  bookingId, checkInTime, currentTime,
  pricePerHour, estimatedHours, estimatedFare
}

── Booking Status Lifecycle ──────────────────────────────────────────────────
PRE_BOOKING: RESERVED → ACTIVE (checkIn) → COMPLETED (checkOut)
                      ↘ CANCELLED (anytime before COMPLETED)
WALK_IN:     ACTIVE immediately → COMPLETED (checkOut)
                  ↘ CANCELLED
────────────────────────────────────────────────────────────────────────────── */