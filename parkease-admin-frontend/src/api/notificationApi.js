import axiosInstance from "./axiosInstance";
import logger from "../utils/logger";

export const getAllNotifications = () =>
  axiosInstance.get("/api/v1/notifications/all");

export const deleteNotification = (notificationId) =>
  axiosInstance.delete(`/api/v1/notifications/${notificationId}`);

export const sendBroadcast = (data) =>
  axiosInstance.post("/api/v1/notifications/broadcast", data);