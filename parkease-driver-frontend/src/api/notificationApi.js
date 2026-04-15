import api from './axiosInstance';

// GET /api/v1/notifications/my
// Role: DRIVER, MANAGER
// Returns: NotificationResponse[] — all APP channel notifications, newest first
export const getMyNotifications = () =>
  api.get('/api/v1/notifications/my');

// GET /api/v1/notifications/my/unread
// Role: DRIVER, MANAGER
// Returns: NotificationResponse[] — unread APP notifications only
export const getUnreadNotifications = () =>
  api.get('/api/v1/notifications/my/unread');

// GET /api/v1/notifications/my/unread/count
// Role: DRIVER, MANAGER
// Response 200: { recipientId: "uuid", count: 3 }
// USE THIS for bell badge — lightweight, fast
export const getUnreadCount = () =>
  api.get('/api/v1/notifications/my/unread/count');

// PUT /api/v1/notifications/{notificationId}/read
// Role: DRIVER (own only)
// Response 200: NotificationResponse (isRead: true)
// Response 403: notification belongs to another user
export const markAsRead = (notificationId) =>
  api.put(`/api/v1/notifications/${notificationId}/read`);

// PUT /api/v1/notifications/my/read-all
// Role: DRIVER, MANAGER
// Response 204: No Content
export const markAllAsRead = () =>
  api.put('/api/v1/notifications/my/read-all');

/* ── NotificationResponse shape ───────────────────────────────────────────────
{
  notificationId, recipientId,
  type:        BOOKING_CREATED | CHECKIN | CHECKOUT |
               BOOKING_CANCELLED | BOOKING_EXTENDED |
               PAYMENT_COMPLETED | PAYMENT_REFUNDED | PROMO
  title, message,
  channel:     APP | EMAIL | SMS
  relatedId, relatedType,
  isRead, sentAt
}
────────────────────────────────────────────────────────────────────────────── */