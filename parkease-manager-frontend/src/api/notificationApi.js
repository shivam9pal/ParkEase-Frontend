import api from './axiosInstance';

// GET /api/v1/notifications/my
// Role: DRIVER, MANAGER
// Response 200: NotificationResponse[] — all APP channel notifications, newest first
export const getMyNotifications = () =>
  api.get('/api/v1/notifications/my');

// GET /api/v1/notifications/my/unread
// Role: DRIVER, MANAGER
// Response 200: NotificationResponse[] — unread notifications only
export const getUnreadNotifications = () =>
  api.get('/api/v1/notifications/my/unread');

// GET /api/v1/notifications/my/unread/count
// Role: DRIVER, MANAGER
// Response 200: { recipientId: "uuid", count: 5 }
// POLL THIS every 30 seconds for notification bell badge
export const getUnreadCount = () =>
  api.get('/api/v1/notifications/my/unread/count');

// PUT /api/v1/notifications/{notificationId}/read
// Role: MANAGER (own only)
// Response 200: NotificationResponse (isRead: true)
export const markAsRead = (notificationId) =>
  api.put(`/api/v1/notifications/${notificationId}/read`);

// PUT /api/v1/notifications/my/read-all
// Role: MANAGER
// Response 204: No Content
export const markAllAsRead = () =>
  api.put('/api/v1/notifications/my/read-all');

/*
  NotificationResponse shape:
  {
    notificationId : "uuid",
    recipientId    : "uuid",
    type           : "BOOKING_CREATED",
    title          : "New Booking 🅿️",
    message        : "A driver has booked spot A-05 at MG Road Parking.",
    channel        : "APP",
    relatedId      : "uuid",
    relatedType    : "BOOKING",
    isRead         : false,
    sentAt         : "2026-04-07T10:00:00"
  }

  NotificationType values for Manager:
  BOOKING_CREATED | CHECKIN | CHECKOUT | BOOKING_CANCELLED | LOT_APPROVED
*/