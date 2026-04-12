import api from './axiosInstance';

// POST /api/v1/lots
// Role: MANAGER only
// Body: CreateLotRequest
// Response 201: LotResponse
// NOTE: new lot always isApproved=false — awaits admin approval
export const createLot = (data) => api.post('/api/v1/lots', data);

// GET /api/v1/lots/manager/{managerId}
// Role: MANAGER, ADMIN
// Returns ALL lots (approved + pending) for this manager
// Use user.userId from authStore as managerId
export const getMyLots = (managerId) =>
  api.get(`/api/v1/lots/manager/${managerId}`);

// GET /api/v1/lots/{lotId}
// Public — no auth required
// Response 200: LotResponse | 404: not found
export const getLotById = (lotId) => api.get(`/api/v1/lots/${lotId}`);

// PUT /api/v1/lots/{lotId}
// Role: MANAGER (own lot) or ADMIN
// Body: UpdateLotRequest — all fields optional (partial update)
// Response 200: LotResponse | 403: not the owner
// NOTE: cannot update totalSpots via this endpoint
export const updateLot = (lotId, data) =>
  api.put(`/api/v1/lots/${lotId}`, data);

// PUT /api/v1/lots/{lotId}/toggleOpen
// Role: MANAGER (own lot) or ADMIN
// Response 200: LotResponse — flips isOpen: true ↔ false
export const toggleLotOpen = (lotId) =>
  api.put(`/api/v1/lots/${lotId}/toggleOpen`);

// DELETE /api/v1/lots/{lotId}
// Role: MANAGER (own lot) or ADMIN
// Response 204: No Content (hard delete)
export const deleteLot = (lotId) => api.delete(`/api/v1/lots/${lotId}`);

/*
  CreateLotRequest shape:
  {
    name       : "MG Road Parking",
    address    : "45 MG Road",
    city       : "Bangalore",
    latitude   : 12.9716,
    longitude  : 77.5946,
    totalSpots : 80,
    openTime   : "07:00:00",
    closeTime  : "23:00:00",
    imageUrl   : "https://s3.../image.jpg"   ← optional
  }

  UpdateLotRequest shape: (all optional)
  {
    name      : "Updated Name",
    address   : "New Address",
    city      : "Bangalore",
    latitude  : 12.9720,
    longitude : 77.5950,
    openTime  : "06:00:00",
    closeTime : "00:00:00",
    imageUrl  : "https://s3.../new.jpg"
  }

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