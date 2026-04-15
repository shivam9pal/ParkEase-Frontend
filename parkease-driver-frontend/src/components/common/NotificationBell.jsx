import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import {
  getUnreadCount,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
} from '../../api/notificationApi';
import { useNotificationStore } from '../../store/notificationStore';
import { timeAgo } from '../../utils/formatDateTime';

// ── Notification type → color/icon mapping ────────────────────────────────────
const TYPE_STYLES = {
  BOOKING_CREATED:   { dot: 'bg-[#3D52A0]', label: 'Booking'   },
  CHECKIN:           { dot: 'bg-green-500',  label: 'Check In'  },
  CHECKOUT:          { dot: 'bg-[#7091E6]',  label: 'Check Out' },
  BOOKING_CANCELLED: { dot: 'bg-red-500',    label: 'Cancelled' },
  BOOKING_EXTENDED:  { dot: 'bg-amber-500',  label: 'Extended'  },
  PAYMENT_COMPLETED: { dot: 'bg-emerald-500',label: 'Payment'   },
  PAYMENT_REFUNDED:  { dot: 'bg-orange-500', label: 'Refund'    },
  PROMO:             { dot: 'bg-pink-500',   label: 'Promo'     },
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { unreadCount, notifications, setUnreadCount, setNotifications,
          decrementUnread, clearUnread } = useNotificationStore();

  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Poll unread count every 30s ──────────────────────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.count ?? 0);
      } catch { /* silent */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Open dropdown → fetch unread list ────────────────────────────────────────
  const handleBellClick = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const res = await getUnreadNotifications();
        setNotifications(res.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
  };

  // ── Mark single notification as read ────────────────────────────────────────
  const handleMarkRead = async (notif, e) => {
    e.stopPropagation();
    try {
      await markAsRead(notif.notificationId);
      decrementUnread();
      setNotifications(
        notifications.map((n) =>
          n.notificationId === notif.notificationId
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch { /* silent */ }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      clearUnread();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  // ── Click notification → navigate if booking related ─────────────────────────
  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.notificationId);
        decrementUnread();
      } catch { /* silent */ }
    }
    setOpen(false);
    if (notif.relatedType === 'BOOKING' && notif.relatedId) {
      navigate(`/driver/bookings/${notif.relatedId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Button ─────────────────────────────────────────────────────── */}
      <button
        onClick={handleBellClick}
        className="relative p-2.5 rounded-xl text-white/80 
                   hover:text-white hover:bg-white/10
                   transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                           bg-red-500 text-white text-[10px] font-bold 
                           rounded-full flex items-center justify-center 
                           px-1 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white 
                        rounded-2xl shadow-[0_8px_40px_rgba(61,82,160,0.18)] 
                        border border-[#ADBBDA] z-50 overflow-hidden
                        animate-in slide-in-from-top-2 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 
                          border-b border-[#EDE8F5] bg-[#EDE8F5]/60">
            <div>
              <h3 className="font-semibold text-[#3D52A0] text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs text-[#8697C4] mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-medium 
                             text-[#7091E6] hover:text-[#3D52A0] 
                             transition-colors duration-200"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-[#8697C4] hover:text-[#3D52A0]
                           hover:bg-[#EDE8F5] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="h-5 w-5 animate-spin rounded-full 
                                border-2 border-[#ADBBDA] border-t-[#3D52A0]" />
                <span className="text-sm text-[#8697C4]">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center 
                              py-12 px-4 text-center">
                <div className="w-12 h-12 bg-[#EDE8F5] rounded-2xl 
                                flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-[#8697C4]" />
                </div>
                <p className="text-sm font-medium text-[#3D52A0]">
                  All caught up!
                </p>
                <p className="text-xs text-[#8697C4] mt-1">
                  No new notifications
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = TYPE_STYLES[notif.type] ?? 
                              { dot: 'bg-[#8697C4]', label: 'Info' };
                return (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleNotifClick(notif)}
                    className={`flex items-start gap-3 px-5 py-4 
                                border-b border-[#EDE8F5] last:border-0
                                cursor-pointer transition-all duration-150
                                ${notif.isRead
                                  ? 'hover:bg-gray-50'
                                  : 'bg-[#EDE8F5]/40 hover:bg-[#EDE8F5]/70'
                                }`}
                  >
                    {/* Dot indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <span
                        className={`block w-2.5 h-2.5 rounded-full 
                                    ${notif.isRead
                                      ? 'bg-gray-200'
                                      : style.dot
                                    }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug
                                    ${notif.isRead
                                      ? 'font-normal text-gray-600'
                                      : 'font-semibold text-[#3D52A0]'
                                    }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-[#8697C4] mt-0.5 
                                    line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-[#ADBBDA] mt-1.5 
                                    font-medium">
                        {timeAgo(notif.sentAt)}
                      </p>
                    </div>

                    {/* Mark as read btn */}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(notif, e)}
                        className="flex-shrink-0 p-1.5 rounded-lg 
                                   text-[#7091E6] hover:bg-[#EDE8F5] 
                                   transition-all duration-200"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-[#EDE8F5] bg-[#EDE8F5]/40
                            text-center">
              <button
                onClick={() => { setOpen(false); navigate('/driver'); }}
                className="text-xs font-semibold text-[#7091E6] 
                           hover:text-[#3D52A0] transition-colors duration-200"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}