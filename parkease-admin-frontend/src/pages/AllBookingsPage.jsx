import { useEffect, useState, useMemo } from "react";
import {
  CalendarCheck, RefreshCw, LogOut, XCircle,
  Clock, Activity, CheckCircle2, Ban,
} from "lucide-react";
import { getAllBookings, forceCheckout, cancelBooking } from "../api/bookingApi";
import { formatCurrency, formatDateTime, truncateId } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { toast } from "../store/notificationStore";

// Multi-select filter pill
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
        ${active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-secondary border-muted/60 hover:border-primary hover:text-primary"
        }
      `}
    >
      {label}
    </button>
  );
}

const STATUS_OPTIONS      = ["ALL", "RESERVED", "ACTIVE", "COMPLETED", "CANCELLED"];
const BOOKING_TYPE_OPTIONS = ["ALL", "PRE_BOOKING", "WALK_IN"];

export default function AllBookingsPage() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter]     = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false, bookingId: null, action: null,
  });

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getAllBookings();
      const data = res.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const statusOk = statusFilter === "ALL" || b.status === statusFilter;
      const typeOk   = typeFilter   === "ALL" || b.bookingType === typeFilter;
      return statusOk && typeOk;
    });
  }, [bookings, statusFilter, typeFilter]);

  // Status counts
  const counts = useMemo(() => {
    const c = { ALL: bookings.length };
    STATUS_OPTIONS.slice(1).forEach((s) => {
      c[s] = bookings.filter((b) => b.status === s).length;
    });
    return c;
  }, [bookings]);

  const openConfirm = (bookingId, action) => {
    setConfirm({ open: true, bookingId, action });
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      if (confirm.action === "force-checkout") {
        const res = await forceCheckout(confirm.bookingId);
        toast.success("Booking force-checked out successfully");
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === confirm.bookingId ? res.data : b
          )
        );
      } else if (confirm.action === "cancel") {
        const res = await cancelBooking(confirm.bookingId);
        toast.success("Booking cancelled successfully");
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === confirm.bookingId ? res.data : b
          )
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, bookingId: null, action: null });
    }
  };

  const columns = [
    {
      key: "bookingId",
      label: "Booking ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.bookingId)}
        </span>
      ),
    },
    {
      key: "vehiclePlate",
      label: "Vehicle",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800 text-xs tracking-wide uppercase">
            {row.vehiclePlate}
          </p>
          <p className="text-[10px] text-secondary mt-0.5">{row.vehicleType}</p>
        </div>
      ),
    },
    {
      key: "lotId",
      label: "Lot ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.lotId)}
        </span>
      ),
    },
    {
      key: "bookingType",
      label: "Type",
      render: (row) => (
        <Badge
          variant={row.bookingType?.toLowerCase()}
          label={row.bookingType === "PRE_BOOKING" ? "Pre-Booking" : "Walk-In"}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status?.toLowerCase()}
          label={row.status}
          dot
        />
      ),
    },
    {
      key: "startTime",
      label: "Start Time",
      render: (row) => (
        <span className="text-xs text-secondary">
          {formatDateTime(row.startTime)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (row) => (
        <span className={`text-sm font-semibold ${row.totalAmount ? "text-gray-800" : "text-secondary"}`}>
          {row.totalAmount ? formatCurrency(row.totalAmount) : "Pending"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "ACTIVE" && (
            <button
              onClick={() => openConfirm(row.bookingId, "force-checkout")}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <LogOut size={12} /> Force Checkout
            </button>
          )}
          {row.status === "RESERVED" && (
            <button
              onClick={() => openConfirm(row.bookingId, "cancel")}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <XCircle size={12} /> Cancel
            </button>
          )}
          {(row.status === "COMPLETED" || row.status === "CANCELLED") && (
            <span className="text-xs text-secondary italic">No actions</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="All Bookings"
        subtitle="View and manage every booking across the platform"
        actions={
          <button
            onClick={fetchBookings}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Status summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { status: "ALL",       label: "Total",     icon: CalendarCheck, color: "text-primary",    bg: "bg-primary/5" },
          { status: "RESERVED",  label: "Reserved",  icon: Clock,         color: "text-yellow-600", bg: "bg-yellow-50" },
          { status: "ACTIVE",    label: "Active",    icon: Activity,      color: "text-blue-600",   bg: "bg-blue-50" },
          { status: "COMPLETED", label: "Completed", icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50" },
          { status: "CANCELLED", label: "Cancelled", icon: Ban,           color: "text-red-500",    bg: "bg-red-50" },
        ].map(({ status, label, icon: Icon, color, bg }) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`
              bg-white rounded-lg border shadow-card px-4 py-3 flex items-center gap-3
              text-left transition-all
              ${statusFilter === status
                ? "border-primary ring-2 ring-primary/20"
                : "border-muted/40 hover:border-primary/40"
              }
            `}
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{counts[status] ?? 0}</p>
              <p className="text-xs text-secondary">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Booking type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-secondary font-medium">Booking type:</span>
        {BOOKING_TYPE_OPTIONS.map((t) => (
          <FilterPill
            key={t}
            label={t === "ALL" ? "All Types" : t === "PRE_BOOKING" ? "Pre-Booking" : "Walk-In"}
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
        searchKeys={["vehiclePlate", "bookingId", "lotId"]}
        searchPlaceholder="Search by plate, booking ID or lot ID..."
        rowKey="bookingId"
        defaultRowsPerPage={10}
        emptyMessage="No bookings found"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({ open: false, bookingId: null, action: null })
        }
        onConfirm={handleConfirm}
        loading={actionLoading}
        title={
          confirm.action === "force-checkout"
            ? "Force Checkout Booking?"
            : "Cancel Booking?"
        }
        description={
          confirm.action === "force-checkout"
            ? "Force checkout this active booking? The total fare will be calculated based on current time and marked as COMPLETED."
            : "Cancel this reserved booking? This action cannot be undone."
        }
        confirmLabel={
          confirm.action === "force-checkout" ? "Yes, Force Checkout" : "Yes, Cancel"
        }
        confirmVariant="destructive"
      />
    </div>
  );
}