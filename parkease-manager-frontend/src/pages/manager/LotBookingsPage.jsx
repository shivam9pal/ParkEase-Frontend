import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, Filter, CalendarDays, RefreshCw,
  CheckCircle2, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getLotById }         from '../../api/lotApi';
import { getBookingsByLot, cancelBooking, checkOutBooking, getFareEstimate }
  from '../../api/bookingApi';
import StatusBadge    from '../../components/common/StatusBadge';
import ConfirmDialog  from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';
import EmptyState     from '../../components/common/EmptyState';
import PageHeader     from '../../components/common/PageHeader';
import { formatDate, formatDateOnly, calcDuration }
  from '../../utils/formatDateTime';
import { formatCurrency } from '../../utils/formatCurrency';

// ── Booking Status filter tabs ────────────────────────────────────────
const STATUS_TABS = [
  { key: 'ALL',       label: 'All' },
  { key: 'ACTIVE',    label: '🚗 Active' },
  { key: 'RESERVED',  label: '📅 Reserved' },
  { key: 'COMPLETED', label: '✅ Completed' },
  { key: 'CANCELLED', label: '❌ Cancelled' },
];

const BOOKING_TYPE_LABELS = {
  PRE_BOOKING: 'Pre-Booking',
  WALK_IN    : 'Walk-In',
};

export default function LotBookingsPage() {
  const { lotId } = useParams();

  // ── State ─────────────────────────────────────────────────────────
  const [lot, setLot]             = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir]     = useState('desc');   // "asc" | "desc"
  const [expandedId, setExpandedId] = useState(null);  // expanded row
  const [fareMap, setFareMap]     = useState({});       // { bookingId: FareResponse }

  // ── Action dialogs ────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lotRes, bookingsRes] = await Promise.all([
        getLotById(lotId),
        getBookingsByLot(lotId),
      ]);
      setLot(lotRes.data);
      setBookings(bookingsRes.data ?? []);
    } catch {
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Cancel Booking ─────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await cancelBooking(cancelTarget.bookingId);
      setBookings((prev) =>
        prev.map((b) => b.bookingId === cancelTarget.bookingId ? res.data : b)
      );
      toast.success('Booking cancelled successfully.');
    } catch (err) {
      toast.error(
        err.response?.status === 409
          ? 'Booking cannot be cancelled at this stage.'
          : 'Failed to cancel booking.'
      );
    } finally {
      setActionLoading(false);
      setCancelTarget(null);
    }
  };

  // ── Check Out Booking ──────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!checkoutTarget) return;
    setActionLoading(true);
    try {
      const res = await checkOutBooking(checkoutTarget.bookingId);
      setBookings((prev) =>
        prev.map((b) => b.bookingId === checkoutTarget.bookingId ? res.data : b)
      );
      toast.success(
        `Checked out! Total: ${formatCurrency(res.data.totalAmount)} ✅`
      );
    } catch {
      toast.error('Failed to check out booking.');
    } finally {
      setActionLoading(false);
      setCheckoutTarget(null);
    }
  };

  // ── Load Fare Estimate for expanded ACTIVE booking ─────────────────
  const handleExpand = async (booking) => {
    const id = booking.bookingId;
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);

    if (booking.status === 'ACTIVE' && !fareMap[id]) {
      try {
        const res = await getFareEstimate(id);
        setFareMap((prev) => ({ ...prev, [id]: res.data }));
      } catch {
        // Non-critical
      }
    }
  };

  // ── Sort toggle ────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-accent" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  // ── Filter + Sort ──────────────────────────────────────────────────
  const processed = bookings
    .filter((b) => statusFilter === 'ALL' || b.status === statusFilter)
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.vehiclePlate?.toLowerCase().includes(q) ||
        b.bookingId?.toLowerCase().includes(q) ||
        b.spotId?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── Status counts ──────────────────────────────────────────────────
  const counts = STATUS_TABS.reduce((acc, { key }) => {
    acc[key] = key === 'ALL'
      ? bookings.length
      : bookings.filter((b) => b.status === key).length;
    return acc;
  }, {});

  // ── Revenue summary ────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === 'COMPLETED' && b.totalAmount)
    .reduce((sum, b) => sum + b.totalAmount, 0);

  if (loading) return <LoadingSpinner fullPage text="Loading bookings..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchData} fullPage />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="All Bookings"
        subtitle={`${lot?.name ?? ''} — ${bookings.length} total bookings`}
        showBack
        backTo={`/manager/lots/${lotId}`}
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted
                       border border-accent rounded-lg hover:text-primary
                       hover:border-primary transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label   : 'Total Bookings',
            value   : bookings.length,
            color   : 'bg-parkease-bg border-accent/30 text-primary',
          },
          {
            label   : 'Active Now',
            value   : counts.ACTIVE,
            color   : 'bg-blue-50 border-blue-200 text-blue-700',
          },
          {
            label   : 'Completed',
            value   : counts.COMPLETED,
            color   : 'bg-green-50 border-green-200 text-green-700',
          },
          {
            label   : 'Total Revenue',
            value   : formatCurrency(totalRevenue),
            color   : 'bg-purple-50 border-purple-200 text-purple-700',
          },
        ].map(({ label, value, color }) => (
          <div key={label}
               className={`card border-2 ${color} py-4 px-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center
                      gap-3 flex-wrap">

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 bg-white border border-accent/40
                        rounded-lg p-1">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md
                          transition-colors whitespace-nowrap
                          ${statusFilter === key
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-muted hover:text-primary hover:bg-background'}`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plate / booking ID..."
            className="input-field pl-8 py-1.5 text-sm w-56"
          />
        </div>
      </div>

      {/* ── Bookings Table ── */}
      {processed.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={
            statusFilter !== 'ALL' || search
              ? 'Try clearing the filters.'
              : 'Bookings will appear here once drivers start booking spots.'
          }
          icon={<CalendarDays size={28} className="text-accent" />}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/60 border-b border-accent/20">
                  {[
                    { label: 'Vehicle Plate',  field: 'vehiclePlate'  },
                    { label: 'Type',           field: 'bookingType'   },
                    { label: 'Status',         field: 'status'        },
                    { label: 'Check-In',       field: 'checkInTime'   },
                    { label: 'Check-Out',      field: 'checkOutTime'  },
                    { label: 'Duration',       field: null            },
                    { label: 'Amount',         field: 'totalAmount'   },
                    { label: 'Actions',        field: null            },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && handleSort(field)}
                      className={`text-left px-4 py-3 text-xs font-semibold
                                  text-muted uppercase tracking-wider whitespace-nowrap
                                  ${field ? 'cursor-pointer hover:text-primary select-none' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-accent/10">
                {processed.map((booking) => (
                  <>
                    {/* ── Main Row ── */}
                    <tr
                      key={booking.bookingId}
                      className={`transition-colors hover:bg-background/40
                                  ${expandedId === booking.bookingId
                                    ? 'bg-background/60'
                                    : ''}`}
                    >
                      {/* Vehicle Plate */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-gray-800 tracking-wide">
                            {booking.vehiclePlate ?? '—'}
                          </p>
                          <p className="text-xs text-muted">
                            {booking.vehicleType?.replace('_', ' ')}
                          </p>
                        </div>
                      </td>

                      {/* Booking Type */}
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.bookingType} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>

                      {/* Check-In */}
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {booking.checkInTime
                          ? formatDate(booking.checkInTime)
                          : booking.status === 'RESERVED'
                          ? <span className="text-muted italic">Not checked in</span>
                          : '—'}
                      </td>

                      {/* Check-Out */}
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {booking.checkOutTime
                          ? formatDate(booking.checkOutTime)
                          : booking.status === 'ACTIVE'
                          ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <span className="w-1.5 h-1.5 rounded-full
                                              bg-blue-500 animate-pulse" />
                              Parked
                            </span>
                          )
                          : '—'}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {booking.checkInTime && booking.checkOutTime
                          ? calcDuration(booking.checkInTime, booking.checkOutTime)
                          : booking.status === 'ACTIVE' && booking.checkInTime
                          ? calcDuration(booking.checkInTime, new Date().toISOString())
                          : '—'}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {booking.totalAmount != null ? (
                          <span className="font-semibold text-green-700">
                            {formatCurrency(booking.totalAmount)}
                          </span>
                        ) : booking.status === 'ACTIVE' ? (
                          <span className="text-xs text-blue-600 font-medium">
                            Live fare...
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">

                          {/* Expand details */}
                          <button
                            onClick={() => handleExpand(booking)}
                            className={`p-1.5 rounded-lg transition-colors border
                                        ${expandedId === booking.bookingId
                                          ? 'bg-primary text-white border-primary'
                                          : 'text-muted border-accent/40 hover:text-primary hover:border-primary'}`}
                            title="View details"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Checkout (ACTIVE only) */}
                          {booking.status === 'ACTIVE' && (
                            <button
                              onClick={() => setCheckoutTarget(booking)}
                              className="flex items-center gap-1 px-2 py-1 text-[11px]
                                         font-semibold text-green-700 border
                                         border-green-300 rounded-lg
                                         hover:bg-green-500 hover:text-white
                                         transition-colors"
                            >
                              <CheckCircle2 size={11} />
                              Checkout
                            </button>
                          )}

                          {/* Cancel (RESERVED or ACTIVE) */}
                          {(booking.status === 'RESERVED' ||
                            booking.status === 'ACTIVE') && (
                            <button
                              onClick={() => setCancelTarget(booking)}
                              className="flex items-center gap-1 px-2 py-1 text-[11px]
                                         font-semibold text-red-600 border
                                         border-red-200 rounded-lg
                                         hover:bg-red-500 hover:text-white
                                         transition-colors"
                            >
                              <XCircle size={11} />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded Detail Row ── */}
                    {expandedId === booking.bookingId && (
                      <tr key={`${booking.bookingId}-detail`}
                          className="bg-background/70 border-b border-accent/20">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">

                            <div>
                              <p className="text-muted font-semibold uppercase
                                            tracking-wider mb-1">
                                Booking ID
                              </p>
                              <p className="text-gray-700 font-mono text-[11px]
                                            break-all">
                                {booking.bookingId}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted font-semibold uppercase
                                            tracking-wider mb-1">
                                Spot ID
                              </p>
                              <p className="text-gray-700 font-mono text-[11px]
                                            break-all">
                                {booking.spotId}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted font-semibold uppercase
                                            tracking-wider mb-1">
                                Rate
                              </p>
                              <p className="text-gray-700 font-semibold">
                                {formatCurrency(booking.pricePerHour)}/hr
                              </p>
                            </div>

                            <div>
                              <p className="text-muted font-semibold uppercase
                                            tracking-wider mb-1">
                                Booked At
                              </p>
                              <p className="text-gray-700">
                                {formatDate(booking.createdAt)}
                              </p>
                            </div>

                            {/* Live fare estimate for ACTIVE bookings */}
                            {booking.status === 'ACTIVE' &&
                             fareMap[booking.bookingId] && (
                              <div className="col-span-2 sm:col-span-4 mt-2 p-3
                                              bg-blue-50 border border-blue-200
                                              rounded-xl">
                                <p className="text-blue-700 font-semibold text-xs mb-2">
                                  💰 Live Fare Estimate
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-muted text-[11px]">Check-In</p>
                                    <p className="font-medium text-gray-700">
                                      {formatDate(fareMap[booking.bookingId].checkInTime)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted text-[11px]">Duration</p>
                                    <p className="font-semibold text-blue-700">
                                      {fareMap[booking.bookingId].estimatedHours?.toFixed(2)}h
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted text-[11px]">Estimated Fare</p>
                                    <p className="font-bold text-green-700 text-base">
                                      {formatCurrency(
                                        fareMap[booking.bookingId].estimatedFare
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-accent/20 bg-background/40
                          flex items-center justify-between">
            <p className="text-xs text-muted">
              Showing{' '}
              <span className="font-semibold text-gray-700">{processed.length}</span>
              {' '}of {bookings.length} bookings
            </p>
            <p className="text-xs text-muted">
              Revenue shown is for completed bookings only
            </p>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Dialog ── */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={actionLoading}
        title="Cancel Booking?"
        description={`Cancel booking for vehicle ${cancelTarget?.vehiclePlate ?? ''}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel"
        variant="danger"
      />

      {/* ── Checkout Confirm Dialog ── */}
      <ConfirmDialog
        open={!!checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onConfirm={handleCheckout}
        loading={actionLoading}
        title="Check Out Vehicle?"
        description={`Check out vehicle ${checkoutTarget?.vehiclePlate ?? ''}? Final fare will be calculated based on actual parking duration.`}
        confirmLabel="Confirm Checkout"
        variant="primary"
      />
    </div>
  );
}