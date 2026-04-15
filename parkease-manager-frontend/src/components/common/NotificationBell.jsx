import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import {
  getUnreadCount,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
} from '../../api/notificationApi';
import { timeAgo } from '../../utils/formatDateTime';
import toast from 'react-hot-toast';

// Notification type → emoji map
const TYPE_ICON = {
  BOOKING_CREATED  : '🅿️',
  CHECKIN          : '🚗',
  CHECKOUT         : '✅',
  BOOKING_CANCELLED: '❌',
  LOT_APPROVED     : '🎉',
};

export default function NotificationBell() {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef           = useRef(null);

  const { unreadCount, notifications, setUnreadCount, setNotifications,
          clearUnread, decrementUnread } = useNotificationStore();

  // ── Poll unread count every 30 seconds ─────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.count ?? 0);
      } catch {
        // Silently fail — don't disrupt UX
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  // ── Close dropdown on outside click ────────────────────────────────
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ── Open bell → fetch unread notifications ──────────────────────────
  const handleBellClick = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const res = await getUnreadNotifications();
        setNotifications(res.data ?? []);
      } catch {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Mark single notification as read ────────────────────────────────
  const handleMarkRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
      decrementUnread();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  // ── Mark all as read ─────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      clearUnread();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Button ── */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-background
                   transition-colors duration-150 outline-none"
        aria-label="Notifications"
      >
        <Bell
          size={20}
          className={unreadCount > 0 ? 'text-primary' : 'text-muted'}
        />
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                           bg-red-500 text-white text-[10px] font-bold rounded-full
                           flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl
                        shadow-card-hover border border-accent/40 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-accent/30 bg-background/50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-primary" />
              <span className="text-sm font-semibold text-primary">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-secondary
                             hover:text-primary font-medium transition-colors"
                >
                  <CheckCheck size={13} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent
                                rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} className="text-accent" />
                <p className="text-sm text-muted">No new notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`px-4 py-3 border-b border-accent/20 last:border-0
                              transition-colors duration-150 cursor-pointer
                              hover:bg-background/60
                              ${!n.isRead ? 'bg-parkease-bg/40' : 'bg-white'}`}
                  onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <span className="text-lg shrink-0 mt-0.5">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug
                                      ${!n.isRead
                                        ? 'font-semibold text-gray-800'
                                        : 'font-medium text-gray-600'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary
                                           shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-accent mt-1">
                        {timeAgo(n.sentAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}