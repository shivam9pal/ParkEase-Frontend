import axiosInstance from "./axiosInstance";

/**
 * Get all bookings across the platform
 * @returns Promise<AxiosResponse> with List<BookingResponse>
 */
export const getAllBookings = () => {
  console.log("📤 Fetching all bookings");
  return axiosInstance
    .get("/api/v1/bookings/all")
    .then((res) => {
      console.log("✅ getAllBookings successful, count:", res.data?.length ?? 0);
      return res;
    })
    .catch((err) => {
      console.error("❌ getAllBookings failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Force checkout a booking (admin action)
 * @param {string} bookingId - Booking UUID
 * @returns Promise<AxiosResponse> with updated BookingResponse
 */
export const forceCheckout = (bookingId) => {
  console.log("📤 Force checking out booking:", bookingId);
  return axiosInstance
    .put(`/api/v1/bookings/${bookingId}/checkout`)
    .then((res) => {
      console.log("✅ Booking force checked out successfully:", res.data);
      return res;
    })
    .catch((err) => {
      console.error("❌ Force checkout failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};

/**
 * Cancel a booking (admin action)
 * @param {string} bookingId - Booking UUID
 * @returns Promise<AxiosResponse> with updated BookingResponse (status=CANCELLED)
 */
export const cancelBooking = (bookingId) => {
  console.log("📤 Cancelling booking:", bookingId);
  return axiosInstance
    .put(`/api/v1/bookings/${bookingId}/cancel`)
    .then((res) => {
      console.log("✅ Booking cancelled successfully:", res.data);
      return res;
    })
    .catch((err) => {
      console.error("❌ Cancel booking failed:", err.message);
      console.error("  Status:", err.response?.status);
      console.error("  Data:", err.response?.data);
      throw err;
    });
};
