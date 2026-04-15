import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

/**
 * Get all parking lots (approved and pending)
 * @returns Promise<AxiosResponse> with List<LotResponse>
 */
export const getAllLots = () => {
  logger.log("📤 Fetching all parking lots");
  return axiosInstance
    .get("/api/v1/lots/all")
    .then((res) => {
      logger.log("✅ getAllLots successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      logger.error("❌ getAllLots failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Get pending parking lots awaiting admin approval
 * @returns Promise<AxiosResponse> with List<LotResponse>
 */
export const getPendingLots = () => {
  logger.log("📤 Fetching pending parking lots");
  return axiosInstance
    .get("/api/v1/lots/pending")
    .then((res) => {
      logger.log("✅ getPendingLots successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      logger.error("❌ getPendingLots failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Approve a parking lot (changes isApproved from false to true)
 * @param {string} lotId - Lot UUID
 * @returns Promise<AxiosResponse> with LotResponse (isApproved=true)
 */
export const approveLot = (lotId) => {
  logger.log("📤 Approving parking lot:", lotId);
  return axiosInstance
    .put(`/api/v1/lots/${lotId}/approve`)
    .then((res) => {
      logger.log("✅ Lot approved successfully:", res.data);
      return res;
    })
    .catch((err) => {
      logger.error("❌ Approve lot failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Deactivate a parking lot (soft delete)
 * @param {string} lotId - Lot UUID
 * @returns Promise<AxiosResponse> with success message or LotResponse
 */
export const deactivateLot = (lotId) => {
  logger.log("📤 Deactivating parking lot:", lotId);
  return axiosInstance
    .delete(`/api/v1/lots/${lotId}`)
    .then((res) => {
      logger.log("✅ Lot deactivated successfully");
      return res;
    })
    .catch((err) => {
      logger.error("❌ Deactivate lot failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};
