import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarCheck, Clock, Car,
  ChevronRight, LogIn, LogOut,
  XCircle, RefreshCw, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMyBookings,
  checkIn, checkOut, cancelBooking,
} from '../../api/bookingApi';
import { getLotById } from '../../api/lotApi';
import { formatDateTime, formatDate } from '../../utils/formatDateTime';
import { formatCurrency }  from '../../utils/formatCurrency';
import StatusBadge         from '../../components/booking/StatusBadge';
import FareTimer           from '../../components/booking/FareTimer';
import LoadingSpinner      from '../../components/common/LoadingSpinner';
import ErrorMessage        from '../../components/common/ErrorMessage';

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'active',  label: 'Active',  statuses: ['RESERVED', 'ACTIVE'] },
  { id: 'history', label: 'History', statuses: ['COMPLETED', 'CANCELLED'] },
  { id: 'all',     label: 'All',     statuses: null },
];

export default function MyBookingsPage() {
  const navigate = useNavigate();

  const [bookings,      setBookings]      = useState([]);
  const [lotNames,      setLotNames]      = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [activeTab,     setActiveTab]     = useState('active');
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch all bookings ────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMyBookings();
        const bks = res.data;
        setBookings(bks);

        // Fetch lot names in background
        const lotIds = [...new Set(bks.map((b) => b.lotId).filter(Boolean))];
        lotIds.forEach(async (id) => {
          try {
            const r = await getLotById(id);
            setLotNames((prev) => ({ ...prev, [id]: r.data.name }));
          } catch { /* silent */ }
        });
      } catch {
        setError('Failed to load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAction = async (type, bookingId) => {
    if (type === 'cancel') {
      if (!window.confirm('Cancel this booking?')) return;
    }
    setActionLoading(bookingId + type);
    try {
      let res;
      if (type === 'checkin')  res = await checkIn(bookingId);
      if (type === 'checkout') res = await checkOut(bookingId);
      if (type === 'cancel')   res = await cancelBooking(bookingId);

      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? res.data : b))
      );

      if (type === 'checkin')  toast.success('Checked in! 🅿️');
      if (type === 'checkout') {
        toast.success('Checked out! Proceed to payment. 💳');
        navigate(`/driver/bookings/${bookingId}`);
      }
      if (type === 'cancel') toast.success('Booking cancelled.');
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered bookings ─────────────────────────────────────────────────────
  const currentTab    = TABS.find((t) => t.id === activeTab);
  const filteredBks   = currentTab.statuses
    ? bookings.filter((b) => currentTab.statuses.includes(b.status))
    : bookings;
  const sortedBks     = [...filteredBks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = {
    active:  bookings.filter((b) =>
               ['RESERVED','ACTIVE'].includes(b.status)).length,
    history: bookings.filter((b) =>
               ['COMPLETED','CANCELLED'].includes(b.status)).length,
    all:     bookings.length,
  };

  if (loading) return <LoadingSpinner text="Loading your bookings..." />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center 
                      sm:justify-between gap-3">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">
            Manage all your parking reservations
          </p>
        </div>
        <button
          onClick={() => navigate('/driver/find-parking')}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <CalendarCheck className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 
                      border border-[#ADBBDA] shadow-sm w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl 
                        text-sm font-semibold transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-[#3D52A0] text-white shadow-sm'
                          : 'text-[#8697C4] hover:text-[#3D52A0] hover:bg-[#EDE8F5]'
                        }`}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                               ${activeTab === tab.id
                                 ? 'bg-white/20 text-white'
                                 : 'bg-[#EDE8F5] text-[#3D52A0]'
                               }`}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Booking List ───────────────────────────────────────────────── */}
      {sortedBks.length === 0 ? (
        <div className="card flex flex-col items-center justify-center 
                        py-16 text-center border-dashed border-2 
                        border-[#ADBBDA]">
          <CalendarCheck className="w-12 h-12 text-[#ADBBDA] mb-4" />
          <h3 className="font-bold text-[#3D52A0] text-base mb-2">
            No bookings here
          </h3>
          <p className="text-[#8697C4] text-sm mb-5 max-w-xs">
            {activeTab === 'active'
              ? "You don't have any active reservations right now."
              : activeTab === 'history'
                ? "Your completed and cancelled bookings will appear here."
                : "You haven't made any bookings yet."
            }
          </p>
          <button
            onClick={() => navigate('/driver/find-parking')}
            className="btn-primary flex items-center gap-2"
          >
            Find Parking
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBks.map((booking) => (
            <BookingCard
              key={booking.bookingId}
              booking={booking}
              lotName={lotNames[booking.lotId]}
              actionLoading={actionLoading}
              onAction={handleAction}
              onNavigate={() =>
                navigate(`/driver/bookings/${booking.bookingId}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, lotName, actionLoading, onAction, onNavigate }) {
  const isActionLoading = (type) =>
    actionLoading === booking.bookingId + type;

  const VEHICLE_TYPE_LABEL = {
    TWO_WHEELER: '2-Wheeler', FOUR_WHEELER: '4-Wheeler', HEAVY: 'Heavy',
  };

  return (
    <div className={`card transition-all duration-200
                    ${booking.status === 'ACTIVE'
                      ? 'border-l-4 border-l-green-500'
                      : booking.status === 'RESERVED'
                        ? 'border-l-4 border-l-[#7091E6]'
                        : ''
                    }`}>

      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-start 
                      sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-[#3D52A0] text-base truncate">
              {lotName ?? `Booking #${booking.bookingId.slice(-8).toUpperCase()}`}
            </h3>
            <StatusBadge status={booking.status} />
            <span className="text-xs bg-[#EDE8F5] text-[#8697C4] 
                             font-semibold px-2.5 py-0.5 rounded-full">
              {booking.bookingType === 'WALK_IN' ? 'Walk-In' : 'Pre-Booked'}
            </span>
          </div>
          <p className="text-xs text-[#8697C4]">
            Booked on {formatDate(booking.createdAt)}
          </p>
        </div>

        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 text-sm font-semibold 
                     text-[#7091E6] hover:text-[#3D52A0] 
                     bg-[#EDE8F5] px-3.5 py-2 rounded-xl 
                     transition-all duration-200 self-start flex-shrink-0"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <InfoCell
          icon={Car}
          label="Vehicle"
          value={booking.vehiclePlate ?? '—'}
        />
        <InfoCell
          icon={Clock}
          label="Start"
          value={formatDateTime(booking.startTime)}
        />
        <InfoCell
          icon={Clock}
          label="End"
          value={formatDateTime(booking.endTime)}
        />
        <InfoCell
          icon={Wallet}
          label={booking.status === 'COMPLETED' ? 'Total Paid' : 'Rate'}
          value={
            booking.status === 'COMPLETED'
              ? formatCurrency(booking.totalAmount)
              : `${formatCurrency(booking.pricePerHour)}/hr`
          }
        />
      </div>

      {/* Active — fare timer */}
      {booking.status === 'ACTIVE' && (
        <div className="mb-4">
          <FareTimer
            bookingId={booking.bookingId}
            checkInTime={booking.checkInTime}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EDE8F5]">

        {booking.status === 'RESERVED' && (
          <>
            <ActionBtn
              icon={LogIn}
              label="Check In"
              loading={isActionLoading('checkin')}
              onClick={() => onAction('checkin', booking.bookingId)}
              variant="primary"
            />
            <ActionBtn
              icon={XCircle}
              label="Cancel"
              loading={isActionLoading('cancel')}
              onClick={() => onAction('cancel', booking.bookingId)}
              variant="danger"
            />
          </>
        )}

        {booking.status === 'ACTIVE' && (
          <>
            <ActionBtn
              icon={LogOut}
              label="Check Out"
              loading={isActionLoading('checkout')}
              onClick={() => onAction('checkout', booking.bookingId)}
              variant="primary"
            />
            <ActionBtn
              icon={XCircle}
              label="Cancel"
              loading={isActionLoading('cancel')}
              onClick={() => onAction('cancel', booking.bookingId)}
              variant="danger"
            />
          </>
        )}

        {booking.status === 'COMPLETED' && (
          <Link
            to={`/driver/payments`}
            className="flex items-center gap-2 text-sm font-semibold 
                       text-[#3D52A0] bg-[#EDE8F5] hover:bg-[#ADBBDA]/40 
                       px-4 py-2 rounded-xl transition-all duration-200"
          >
            <Wallet className="w-4 h-4" />
            View Receipt
          </Link>
        )}

        {booking.status === 'CANCELLED' && (
          <span className="text-sm text-red-400 font-medium 
                           flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            Booking cancelled
          </span>
        )}
      </div>
    </div>
  );
}

// ── Reusable info cell ────────────────────────────────────────────────────────
function InfoCell({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#EDE8F5] rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-[#8697C4]" />
        <span className="text-[10px] text-[#8697C4] font-semibold uppercase 
                         tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold text-[#3D52A0] truncate">{value}</p>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, loading, onClick, variant }) {
  const base = `flex items-center gap-2 text-sm font-semibold 
                px-4 py-2 rounded-xl transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed`;

  const styles = {
    primary: 'bg-[#3D52A0] text-white hover:bg-[#7091E6]',
    danger:  `border-2 border-red-200 text-red-500 
              hover:bg-red-50 hover:border-red-400`,
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${base} ${styles[variant]}`}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full 
                        border-2 border-current/30 border-t-current" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}