import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

export const adminLogin = (email, password) => {
  logger.log("📤 Calling admin login endpoint with email:", email);
  return axiosInstance
    .post("/api/v1/auth/admin/login", { email, password })
    .then(res => {
      logger.log("✅ Admin login successful, response:", res.data);
      return res;
    })
    .catch(err => {
      logger.error("❌ Admin login failed:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      throw err;
    });
};

export const getAllAdmins = () =>
  axiosInstance.get("/api/v1/auth/admin/all").then(res => {
    logger.log("✅ getAllAdmins successful, count:", res.data?.length ?? 0);
    return res;
  }).catch(err => {
    logger.error("❌ getAllAdmins failed:", err.message);
    logger.error("  Status:", err.response?.status);
    logger.error("  Data:", err.response?.data);
    throw err;
  });

export const createAdmin = (data) =>
  axiosInstance.post("/api/v1/auth/admin/create", data);

export const deleteAdmin = (adminId) =>
  axiosInstance.delete(`/api/v1/auth/admin/${adminId}`);

export const reactivateAdmin = (adminId) =>
  axiosInstance.put(`/api/v1/auth/admin/${adminId}/reactivate`).then(res => {
    logger.log("✅ Admin reactivated successfully:", res.data.fullName);
    return res;
  }).catch(err => {
    logger.error("❌ Reactivate failed:", err.response?.data?.message || err.message);
    throw err;
  });
  