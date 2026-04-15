import api from './axiosInstance';
import { useAuthStore } from '../store/authStore';

// GET /api/v1/vehicles/owner/{userId}
// Role: DRIVER
// Returns: VehicleResponse[] — all active vehicles owned by logged-in driver
export const getMyVehicles = () => {
  const userId = useAuthStore.getState().user?.userId;
  return api.get(`/api/v1/vehicles/owner/${userId}`);
};

// POST /api/v1/vehicles/register
// Role: DRIVER
// Body: CreateVehicleRequest
// Response 201: VehicleResponse
export const createVehicle = (data) => {
  // Transform field names to match backend expectations
  const transformedData = {
    licensePlate: data.vehiclePlate,
    vehicleType: data.vehicleType,
    make: data.brand,
    model: data.model,
    color: data.color,
    isEV: data.isEV,
  };
  return api.post('/api/v1/vehicles/register', transformedData);
};

// PUT /api/v1/vehicles/{vehicleId}
// Role: DRIVER (own only)
// Body: UpdateVehicleRequest — all fields optional (partial update)
// Response 200: VehicleResponse
export const updateVehicle = (vehicleId, data) =>
  api.put(`/api/v1/vehicles/${vehicleId}`, data);

// DELETE /api/v1/vehicles/{vehicleId}
// Role: DRIVER (own only)
// Response 204: No Content (soft delete — sets isActive=false)
export const deleteVehicle = (vehicleId) =>
  api.delete(`/api/v1/vehicles/${vehicleId}`);

/* ── CreateVehicleRequest shape ───────────────────────────────────────────────
{
  vehiclePlate: "DL01AB1234",            ← uppercase
  vehicleType:  "TWO_WHEELER" | "FOUR_WHEELER" | "HEAVY",
  brand:        "Toyota",               ← optional
  model:        "Camry",                ← optional
  color:        "Silver",               ← optional
  isEV:         false                   ← boolean
}

── VehicleResponse shape ─────────────────────────────────────────────────────
{
  vehicleId, userId,
  vehiclePlate, vehicleType,
  brand, model, color,
  isEV, isActive, createdAt
}
────────────────────────────────────────────────────────────────────────────── */