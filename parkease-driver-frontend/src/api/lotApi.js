import api from './axiosInstance';

// GET /api/v1/lots/nearby?lat=&lng=&radius=
// Public — no auth required
// Returns: LotResponse[] sorted by distance (closest first)
// Only isApproved=true AND isOpen=true lots
export const getNearbyLots = (lat, lng, radius = 5.0) =>
  api.get('/api/v1/lots/nearby', { params: { lat, lng, radius } });

// GET /api/v1/lots/search?keyword=
// Public — no auth required
// Matches: name, address, city (case-insensitive)
// Returns: LotResponse[] (isApproved=true only)
export const searchLots = (keyword) =>
  api.get('/api/v1/lots/search', { params: { keyword } });

// GET /api/v1/lots/city/{city}
// Public — no auth required
// Returns: LotResponse[] (isApproved=true only)
export const getLotsByCity = (city) =>
  api.get(`/api/v1/lots/city/${encodeURIComponent(city)}`);

// GET /api/v1/lots/{lotId}
// Public — no auth required
// Response 200: LotResponse
// Response 404: lot not found
export const getLotById = (lotId) => api.get(`/api/v1/lots/${lotId}`);

/* ── LotResponse shape ────────────────────────────────────────────────────────
{
  lotId, name, address, city,
  latitude, longitude,
  totalSpots, availableSpots,
  managerId, isOpen,
  openTime, closeTime,
  imageUrl, isApproved, createdAt
}
────────────────────────────────────────────────────────────────────────────── */