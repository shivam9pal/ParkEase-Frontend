import api from './axiosInstance';

// GET /api/v1/spots/lot/{lotId}
// Role: MANAGER, ADMIN
// Response 200: SpotResponse[] — ALL spots for this lot (all statuses)
export const getSpotsByLot = (lotId) =>
  api.get(`/api/v1/spots/lot/${lotId}`);

// GET /api/v1/spots/{spotId}
// Role: authenticated
// Response 200: SpotResponse
export const getSpotById = (spotId) =>
  api.get(`/api/v1/spots/${spotId}`);

// POST /api/v1/spots?lotId={lotId}
// Role: MANAGER only
// Body: CreateSpotRequest (without lotId)
// Response 201: SpotResponse
// Backend enforces: manager can only create spots in their OWN lots
export const createSpot = (data) => {
  const { lotId, ...spotData } = data;
  return api.post(`/api/v1/spots?lotId=${lotId}`, spotData);
};

// PUT /api/v1/spots/{spotId}
// Role: MANAGER (own lot) or ADMIN
// Body: UpdateSpotRequest — all optional (partial update)
// Response 200: SpotResponse
export const updateSpot = (spotId, data) =>
  api.put(`/api/v1/spots/${spotId}`, data);

// DELETE /api/v1/spots/{spotId}
// Role: MANAGER (own lot) or ADMIN
// Response 204: No Content
// NOTE: Backend rejects if spot is RESERVED or OCCUPIED — only AVAILABLE spots deletable
export const deleteSpot = (spotId) => api.delete(`/api/v1/spots/${spotId}`);

// PUT /api/v1/spots/{spotId}/maintenance
// Role: MANAGER (own lot) or ADMIN
// Response 200: SpotResponse (status → MAINTENANCE)
// Use when a physical spot needs repair — blocks new bookings for this spot
export const setSpotMaintenance = (spotId) =>
  api.put(`/api/v1/spots/${spotId}/maintenance`);

// PUT /api/v1/spots/{spotId}/available
// Role: MANAGER (own lot) or ADMIN
// Response 200: SpotResponse (MAINTENANCE → AVAILABLE)
// Use to bring a spot back from maintenance
export const setSpotAvailable = (spotId) =>
  api.put(`/api/v1/spots/${spotId}/available`);

/*
  CreateSpotRequest shape:
  {
    lotId         : "uuid",
    spotNumber    : "A-01",
    spotType      : "STANDARD",       // COMPACT | STANDARD | LARGE | MOTORBIKE | EV
    vehicleType   : "FOUR_WHEELER",   // TWO_WHEELER | FOUR_WHEELER | HEAVY
    pricePerHour  : 50.00,
    isEVCharging  : false,
    isHandicapped : false
  }

  UpdateSpotRequest shape: (all optional)
  {
    spotNumber    : "A-01",
    spotType      : "COMPACT",
    vehicleType   : "TWO_WHEELER",
    pricePerHour  : 30.00,
    isEVCharging  : true,
    isHandicapped : false
  }

  SpotResponse shape:
  {
    spotId        : "uuid",
    lotId         : "uuid",
    spotNumber    : "A-01",
    spotType      : "STANDARD",
    vehicleType   : "FOUR_WHEELER",
    status        : "AVAILABLE",   // AVAILABLE | RESERVED | OCCUPIED | MAINTENANCE
    pricePerHour  : 50.00,
    isEVCharging  : false,
    isHandicapped : false
  }
*/