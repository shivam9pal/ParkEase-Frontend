import api from './axiosInstance';

// ── Occupancy ─────────────────────────────────────────────────────────

// GET /api/v1/analytics/occupancy/{lotId}
// Role: MANAGER (own lot), ADMIN
// Response 200: OccupancyRateResponse
// Returns latest snapshot — falls back to live call if no snapshot yet
export const getOccupancyRate = (lotId) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}`);

// GET /api/v1/analytics/occupancy/{lotId}/hourly
// Role: MANAGER (own lot), ADMIN
// Response 200: HourlyOccupancyResponse[]  (24 items, hour 0–23)
// Data: last 30 days average occupancy rate per hour
export const getHourlyOccupancy = (lotId) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}/hourly`);

// GET /api/v1/analytics/occupancy/{lotId}/peak?topN=5
// Role: MANAGER (own lot), ADMIN
// Query Params: topN (default: 5, max: 24)
// Response 200: PeakHourResponse[]  sorted by highest occupancy first
export const getPeakHours = (lotId, topN = 5) =>
  api.get(`/api/v1/analytics/occupancy/${lotId}/peak`, { params: { topN } });

// ── Revenue ───────────────────────────────────────────────────────────

// GET /api/v1/analytics/revenue/{lotId}?from=&to=
// Role: MANAGER (own lot), ADMIN
// Query Params: from (ISO 8601), to (ISO 8601)
// Response 200: RevenueDto
export const getLotRevenue = (lotId, from, to) =>
  api.get(`/api/v1/analytics/revenue/${lotId}`, { params: { from, to } });

// GET /api/v1/analytics/revenue/{lotId}/daily?from=&to=
// Role: MANAGER (own lot), ADMIN
// Response 200: DailyRevenueDto[]
// Each entry: { date, revenue, transactionCount }
export const getDailyRevenue = (lotId, from, to) =>
  api.get(`/api/v1/analytics/revenue/${lotId}/daily`, { params: { from, to } });

// ── Utilisation & Duration ────────────────────────────────────────────

// GET /api/v1/analytics/spot-types/{lotId}
// Role: MANAGER (own lot), ADMIN
// Response 200: SpotTypeUtilisationResponse[]
// Each entry: { spotType, bookingCount, percentage }
export const getSpotTypeUtilisation = (lotId) =>
  api.get(`/api/v1/analytics/spot-types/${lotId}`);

// GET /api/v1/analytics/avg-duration/{lotId}
// Role: MANAGER (own lot), ADMIN
// Response 200: AvgDurationResponse
// { lotId, averageDurationMinutes, averageDurationFormatted: "1h 35m" }
export const getAvgDuration = (lotId) =>
  api.get(`/api/v1/analytics/avg-duration/${lotId}`);

// ── Daily Report ──────────────────────────────────────────────────────

// GET /api/v1/analytics/report/{lotId}/daily
// Role: MANAGER (own lot), ADMIN
// Response 200: DailyReportResponse
// Comprehensive report: occupancy + revenue + bookings + spot types + avg duration
// Only 1 Feign call internally (payment-service) — rest from local analytics DB
export const getDailyReport = (lotId) =>
  api.get(`/api/v1/analytics/report/${lotId}/daily`);

/*
  OccupancyRateResponse shape:
  {
    lotId          : "uuid",
    occupancyRate  : 75.50,
    availableSpots : 25,
    totalSpots     : 100,
    computedAt     : "2026-04-07T14:30:45"
  }

  HourlyOccupancyResponse shape:
  { hour: 0, averageOccupancyRate: 15.25 }   ← 24 items (0–23)

  PeakHourResponse shape:
  { hour: 18, averageOccupancyRate: 89.50, label: "18:00 - 19:00" }

  RevenueDto shape:
  {
    lotId            : "uuid",
    from             : "2026-04-01T00:00:00",
    to               : "2026-04-07T23:59:59",
    totalRevenue     : 5250.75,
    currency         : "INR",
    transactionCount : 142
  }

  DailyRevenueDto shape:
  { date: "2026-04-07", revenue: 950.50, transactionCount: 35 }

  SpotTypeUtilisationResponse shape:
  { spotType: "STANDARD", bookingCount: 450, percentage: 45.50 }

  AvgDurationResponse shape:
  {
    lotId                      : "uuid",
    averageDurationMinutes     : 95,
    averageDurationFormatted   : "1h 35m"
  }
*/