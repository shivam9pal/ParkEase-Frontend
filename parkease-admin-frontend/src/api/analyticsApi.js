import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";
import { buildAnalyticsErrorDisplay, logAnalyticsError } from "../utils/errorHandler";

export const getPlatformSummary = () =>
  axiosInstance.get("/api/v1/analytics/platform/summary").catch(err => {
    logAnalyticsError("getPlatformSummary", err);
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
      const errorMessage = buildAnalyticsErrorDisplay(err);
      logger.warn(`⚠️ /api/v1/analytics/platform/occupancy endpoint error:`);
      logger.warn(`   ${errorMessage}`);
      logAnalyticsError("getPlatformOccupancy", err);
      throw err;  // Let component handle the error with proper messaging
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
      const errorMessage = buildAnalyticsErrorDisplay(err);
      logger.warn(`⚠️ /api/v1/payments/revenue/platform failed:`);
      logger.warn(`   ${errorMessage}`);
      logAnalyticsError("getPlatformRevenueTrend", err);
      throw err;  // Let component handle the error with proper messaging
    });
};

export const getLotAnalyticsSummary = (lotId) =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/summary`)
    .catch(err => {
      logAnalyticsError("getLotAnalyticsSummary", err);
      throw err;
    });

export const getLotRevenueTrend = (lotId, period = "WEEKLY") =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/revenue`, {
    params: { period },
  })
    .catch(err => {
      logAnalyticsError("getLotRevenueTrend", err);
      throw err;
    });

export const getLotOccupancyTrend = (lotId, period = "WEEKLY") =>
  axiosInstance.get(`/api/v1/analytics/lots/${lotId}/occupancy`, {
    params: { period },
  })
    .catch(err => {
      logAnalyticsError("getLotOccupancyTrend", err);
      throw err;
    });