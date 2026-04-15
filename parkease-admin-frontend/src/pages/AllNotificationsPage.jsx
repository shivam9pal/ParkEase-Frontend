import { useEffect, useState, useMemo } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { getAllNotifications, deleteNotification } from "../api/notificationApi";
import { formatDateTime, truncateId } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import { toast } from "../store/notificationStore";

/* ───────────── CONSTANTS ───────────── */

const CHANNEL_OPTIONS = ["ALL", "APP", "EMAIL", "SMS"];

const TYPE_OPTIONS = [
  "ALL", "BOOKING_CREATED", "CHECK_IN", "CHECK_OUT",
  "BOOKING_CANCELLED", "BOOKING_EXTENDED",
  "PAYMENT_COMPLETED", "PAYMENT_REFUNDED", "PROMO",
];

const TYPE_META = {
  BOOKING_CREATED:   { label: "Booking Created", color: "blue" },
  CHECK_IN:          { label: "Check In",         color: "green" },
  CHECK_OUT:         { label: "Check Out",        color: "green" },
  BOOKING_CANCELLED: { label: "Cancelled",        color: "red" },
  BOOKING_EXTENDED:  { label: "Extended",         color: "purple" },
  PAYMENT_COMPLETED: { label: "Payment",          color: "green" },
  PAYMENT_REFUNDED:  { label: "Refunded",         color: "blue" },
  PROMO:             { label: "Promo",            color: "yellow" },
};

const CHANNEL_META = {
  APP:   { variant: "app",   icon: "📱" },
  EMAIL: { variant: "email", icon: "✉️" },
  SMS:   { variant: "sms",   icon: "💬" },
};

/* ───────────── COMPONENTS ───────────── */

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
      ${active
        ? "bg-primary text-white border-primary shadow-sm"
        : "bg-white text-secondary border-muted/60 hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

/* ───────────── MAIN PAGE ───────────── */

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getAllNotifications();
      const data = res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  /* ───────── FILTERS ───────── */

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const channelOk = channelFilter === "ALL" || n.channel === channelFilter;
      const typeOk = typeFilter === "ALL" || n.type === typeFilter;
      return channelOk && typeOk;
    });
  }, [notifications, channelFilter, typeFilter]);

  const channelCounts = useMemo(() => {
    const counts = { ALL: notifications.length };
    CHANNEL_OPTIONS.slice(1).forEach((ch) => {
      counts[ch] = notifications.filter((n) => n.channel === ch).length;
    });
    return counts;
  }, [notifications]);

  /* ───────── ACTIONS ───────── */

  const handleDelete = async (notificationId) => {
    setDeletingId(notificationId);
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  /* ───────── TABLE ───────── */

  const columns = [
    {
      key: "recipientId",
      label: "Recipient ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.recipientId)}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => {
        const meta = TYPE_META[row.type] ?? { label: row.type, color: "gray" };
        return <Badge variant={meta.color} label={meta.label} />;
      },
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <div className="max-w-[200px]">
          <p className="font-medium text-sm truncate">{row.title}</p>
          <p className="text-xs text-secondary truncate">{row.message}</p>
        </div>
      ),
    },
    {
      key: "channel",
      label: "Channel",
      render: (row) => {
        const meta = CHANNEL_META[row.channel] ?? { icon: "🔔", variant: "gray" };
        return (
          <div className="flex items-center gap-1.5">
            <span>{meta.icon}</span>
            <Badge variant={meta.variant} label={row.channel} />
          </div>
        );
      },
    },
    {
      key: "isRead",
      label: "Read",
      render: (row) =>
        row.channel === "APP" ? (
          <span className={row.isRead ? "text-green-600 text-xs" : "text-secondary text-xs"}>
            {row.isRead ? "✓ Read" : "Unread"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">N/A</span>
        ),
    },
    {
      key: "sentAt",
      label: "Sent At",
      render: (row) => (
        <span className="text-xs whitespace-nowrap">
          {formatDateTime(row.sentAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => handleDelete(row.notificationId)}
          disabled={deletingId === row.notificationId}
          className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
        >
          {deletingId === row.notificationId ? (
            <span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
          Delete
        </button>
      ),
    },
  ];

  /* ───────── UI ───────── */

  return (
    <div className="page-container">

      <PageHeader
        title="Notifications Log"
        subtitle="Audit log of all notifications"
        actions={
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1 text-xs border px-3 py-1 rounded"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Channel Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CHANNEL_OPTIONS.map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={`p-3 border rounded ${
              channelFilter === ch ? "border-primary" : "border-muted"
            }`}
          >
            <p className="text-lg font-bold">{channelCounts[ch]}</p>
            <p className="text-xs">{ch}</p>
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {TYPE_OPTIONS.map((t) => (
          <FilterPill
            key={t}
            label={t === "ALL" ? "All" : TYPE_META[t]?.label || t}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
          />
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey="notificationId"
      />
    </div>
  );
}