import api from './axiosInstance';

// GET /api/v1/spots/lot/{lotId}
// Auth: DRIVER, MANAGER, ADMIN
// Returns: SpotResponse[] — all spots for this lot
export const getSpotsByLot = (lotId) =>
  api.get(`/api/v1/spots/lot/${lotId}`);

// GET /api/v1/spots/{spotId}
// Auth: any authenticated user
// Response 200: SpotResponse
export const getSpotById = (spotId) =>
  api.get(`/api/v1/spots/${spotId}`);

/* ── SpotResponse shape ───────────────────────────────────────────────────────
{
  spotId, lotId, spotNumber,
  spotType:    COMPACT | STANDARD | LARGE | MOTORBIKE | EV
  vehicleType: TWO_WHEELER | FOUR_WHEELER | HEAVY
  status:      AVAILABLE | RESERVED | OCCUPIED | MAINTENANCE
  pricePerHour, isEVCharging, isHandicapped
}
────────────────────────────────────────────────────────────────────────────── */