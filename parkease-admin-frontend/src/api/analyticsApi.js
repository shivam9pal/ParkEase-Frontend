import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

export const getPlatformSummary = () =>
  axiosInstance.get("/api/v1/analytics/platform/summary").catch(err => {
    logger.error("❌ getPlatformSummary failed:", err.message);
    throw err;
  });

// ⚠️ NOTE: /api/v1/analytics/platform/occupancy does NOT exist in spec
// This endpoint is a fallback - if it exists on backend, remove the mock
export const getPlatformOccupancy = (period = "WEEKLY") => {
  logger.warn(`⚠️ Fetching occupancy data for period: ${period}`);
  return axiosInstance
    .get("/api/v1/analytics/platform/occupancy", { params: { period } })
    .then(res => {
      logger.log("✅ Platform occupancy fetched successfully");
      return res;
    })
    .catch(err => {
      logger.warn(`⚠️ /api/v1/analytics/platform/occupancy endpoint not available - using mock data`);
      logger.warn("  Error:", err.message);
      // Mock data as fallback
      const mockOccupancy = [
        { date: "Mon", occupancyRate: 65 },
        { date: "Tue", occupancyRate: 72 },
        { date: "Wed", occupancyRate: 68 },
        { date: "Thu", occupancyRate: 75 },
        { date: "Fri", occupancyRate: 82 },
        { date: "Sat", occupancyRate: 88 },
        { date: "Sun", occupancyRate: 78 },
      ];
      return { data: mockOccupancy };
    });
};

// ⚠️ NOTE: /api/v1/payments/revenue/platform requires from/to parameters
export const getPlatformRevenueTrend = (from, to) => {
  // If from/to are provided, use them directly; otherwise calculate default 7-day range
  let fromDate, toDate;
  
  if (from && to) {
    // Custom date range provided
    fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
  } else {
    // Default: last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    fromDate = new Date(weekAgo);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);
  }
  
  logger.log(`📊 Fetching platform revenue trend`);
  logger.log(`   From: ${fromDate.toISOString()}`);
  logger.log(`   To: ${toDate.toISOString()}`);
  
  return axiosInstance
    .get("/api/v1/payments/revenue/platform", {
      params: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    })
    .then(res => {
      logger.log("✅ Platform revenue trend fetched successfully", res.data);
      return res;
    })
    .catch(err => {
      logger.warn(`⚠️ /api/v1/payments/revenue/platform failed - using mock data`);
      logger.warn("  Error:", err.message);
      logger.warn("  Status:", err.response?.status);
      // Mock data for revenue trend as fallback
      const mockRevenue = [
        { date: "2026-04-05", revenue: 15000 },
        { date: "2026-04-06", revenue: 18000 },
        { date: "2026-04-07", revenue: 16500 },
        { date: "2026-04-08", revenue: 19000 },
        { date: "2026-04-09", revenue: 22000 },
        { date: "2026-04-10", revenue: 25000 },
        { date: "2026-04-11", revenue: 20000 },
      ];
      return { data: mockRevenue };
    });
};

export const getLotAnalyticsSummary = (lotId) =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/summary`);

export const getLotRevenueTrend = (lotId, period = "WEEKLY") =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/revenue`, {
    params: { period },
  });

export const getLotOccupancyTrend = (lotId, period = "WEEKLY") =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/occupancy`, {
    params: { period },
  });