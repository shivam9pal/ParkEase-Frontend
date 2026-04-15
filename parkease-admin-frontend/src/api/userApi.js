import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

/**
 * Get all users with optional role filter
 * @param {string} role - Optional filter: "DRIVER" | "MANAGER" | "ADMIN"
 * @returns Promise<AxiosResponse> with List<UserProfileResponse>
 */
export const getAllUsers = (role = null) => {
  const params = role ? { role } : {};
  return axiosInstance
    .get("/api/v1/auth/users", { params })
    .then((res) => {
      logger.log("✅ getAllUsers successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      logger.error("❌ getAllUsers failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Deactivate a user (soft delete)
 * @param {string} userId - User UUID
 * @returns Promise<AxiosResponse> with UserProfileResponse (isActive=false)
 */
export const deactivateUser = (userId) => {
  logger.log("📤 Deactivating user:", userId);
  return axiosInstance
    .put(`/api/v1/auth/users/${userId}/deactivate`)
    .then((res) => {
      logger.log("✅ User deactivated successfully:", res.data);
      return res;
    })
    .catch((err) => {
      logger.error("❌ Deactivate user failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Reactivate a user
 * @param {string} userId - User UUID
 * @returns Promise<AxiosResponse> with UserProfileResponse (isActive=true)
 */
export const reactivateUser = (userId) => {
  logger.log("📤 Reactivating user:", userId);
  return axiosInstance
    .put(`/api/v1/auth/users/${userId}/reactivate`)
    .then((res) => {
      logger.log("✅ User reactivated successfully:", res.data);
      return res;
    })
    .catch((err) => {
      logger.error("❌ Reactivate user failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};
