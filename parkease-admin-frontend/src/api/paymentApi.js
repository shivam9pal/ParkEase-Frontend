import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

/**
 * Calculate date range based on period
 * @param {string} period - "DAILY", "WEEKLY", or "MONTHLY"
 * @returns {object} - { from: ISO string, to: ISO string }
 */
const getDateRange = (period) => {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);

  if (period === "DAILY") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "WEEKLY") {
    const dayOfWeek = from.getDay();
    const diff = from.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    from.setDate(diff);
    from.setHours(0, 0, 0, 0);
  } else if (period === "MONTHLY") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const getAllPayments = () =>
  axiosInstance
    .get("/api/v1/payments/all")
    .then((res) => {
      logger.log("✅ getAllPayments successful, count:", Array.isArray(res.data) ? res.data.length : 0);
      return res;
    })
    .catch((err) => {
      logger.error("❌ getAllPayments failed:", err.message);
      return { data: [] }; // Return empty list if endpoint fails
    });

/**
 * Get platform revenue for a period
 * @param {string} period - "DAILY", "WEEKLY", or "MONTHLY"
 * @returns Promise<AxiosResponse> with revenue data
 */
export const getPlatformRevenue = (period = "WEEKLY") => {
  const { from, to } = getDateRange(period);
  logger.log(`📤 Fetching platform revenue for ${period}: ${from} to ${to}`);
  return axiosInstance
    .get("/api/v1/payments/revenue/platform", {
      params: { from, to },
    })
    .then((res) => {
      logger.log("✅ getPlatformRevenue successful");
      // Ensure consistent response structure
      if (Array.isArray(res.data)) {
        return { data: res.data };
      }
      return res;
    })
    .catch((err) => {
      logger.error("❌ getPlatformRevenue failed:", err.message);
      return { data: { totalRevenue: 0, currency: "INR", transactionCount: 0 } };
    });
};

export const refundPayment = (paymentId) =>
  axiosInstance.post(`/api/v1/payments/${paymentId}/refund`);

export const downloadReceipt = (paymentId) =>
  axiosInstance.get(`/api/v1/payments/${paymentId}/receipt`, {
    responseType: "blob",
  });