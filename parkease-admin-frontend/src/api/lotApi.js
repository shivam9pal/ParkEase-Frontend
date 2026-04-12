import axiosInstance from "./axiosInstance";

/**
 * Get all parking lots (approved and pending)
 * @returns Promise<AxiosResponse> with List<LotResponse>
 */
export const getAllLots = () => {
  console.log("📤 Fetching all parking lots");
  return axiosInstance
    .get("/api/v1/lots/all")
    .then((res) => {
      console.log("✅ getAllLots successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      console.error("❌ getAllLots failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Get pending parking lots awaiting admin approval
 * @returns Promise<AxiosResponse> with List<LotResponse>
 */
export const getPendingLots = () => {
  console.log("📤 Fetching pending parking lots");
  return axiosInstance
    .get("/api/v1/lots/pending")
    .then((res) => {
      console.log("✅ getPendingLots successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      console.error("❌ getPendingLots failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Approve a parking lot (changes isApproved from false to true)
 * @param {string} lotId - Lot UUID
 * @returns Promise<AxiosResponse> with LotResponse (isApproved=true)
 */
export const approveLot = (lotId) => {
  console.log("📤 Approving parking lot:", lotId);
  return axiosInstance
    .put(`/api/v1/lots/${lotId}/approve`)
    .then((res) => {
      console.log("✅ Lot approved successfully:", res.data);
      return res;
    })
    .catch((err) => {
      console.error("❌ Approve lot failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Deactivate a parking lot (soft delete)
 * @param {string} lotId - Lot UUID
 * @returns Promise<AxiosResponse> with success message or LotResponse
 */
export const deactivateLot = (lotId) => {
  console.log("📤 Deactivating parking lot:", lotId);
  return axiosInstance
    .delete(`/api/v1/lots/${lotId}`)
    .then((res) => {
      console.log("✅ Lot deactivated successfully");
      return res;
    })
    .catch((err) => {
      console.error("❌ Deactivate lot failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};
