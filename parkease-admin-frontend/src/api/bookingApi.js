import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

/**
 * Get all bookings across the platform
 * @returns Promise<AxiosResponse> with List<BookingResponse>
 */
export const getAllBookings = () => {
  logger.log("📤 Fetching all bookings");
  return axiosInstance
    .get("/api/v1/bookings/all")
    .then((res) => {
      logger.log("✅ getAllBookings successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      logger.error("❌ getAllBookings failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Force checkout a booking (admin action)
 * @param {string} bookingId - Booking UUID
 * @returns Promise<AxiosResponse> with updated BookingResponse
 */
export const forceCheckout = (bookingId) => {
  logger.log("📤 Force checking out booking:", bookingId);
  return axiosInstance
    .put(`/api/v1/bookings/${bookingId}/checkout`)
    .then((res) => {
      logger.log("✅ Booking force checked out successfully:", res.data);
      return res;
    })
    .catch((err) => {
      logger.error("❌ Force checkout failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Cancel a booking (admin action)
 * @param {string} bookingId - Booking UUID
 * @returns Promise<AxiosResponse> with updated BookingResponse (status=CANCELLED)
 */
export const cancelBooking = (bookingId) => {
  logger.log("📤 Cancelling booking:", bookingId);
  return axiosInstance
    .put(`/api/v1/bookings/${bookingId}/cancel`)
    .then((res) => {
      logger.log("✅ Booking cancelled successfully:", res.data);
      return res;
    })
    .catch((err) => {
      logger.error("❌ Cancel booking failed:", err.message);
      logger.error("  Status:", err.response?.status);
      logger.error("  Data:", err.response?.data);
      throw err;
    });
};
