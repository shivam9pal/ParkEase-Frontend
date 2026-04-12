import axiosInstance from "./axiosInstance";

export const getAllNotifications = () =>
  axiosInstance.get("/api/v1/notifications/all").catch(err => {
    console.error("❌ getAllNotifications failed:", err.message);
    return { data: [] }; // Return empty list if endpoint fails
  });

export const deleteNotification = (notificationId) =>
  axiosInstance.delete(`/api/v1/notifications/${notificationId}`);

export const sendBroadcast = (data) =>
  axiosInstance.post("/api/v1/notifications/broadcast", data);