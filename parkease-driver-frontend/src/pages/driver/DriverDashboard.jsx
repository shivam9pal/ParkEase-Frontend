import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, CalendarCheck, Car, CreditCard,
  ArrowRight, CheckCircle, XCircle, LogIn,
  TrendingUp, Clock, Wallet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';
import { getMyBookings }      from '../../api/bookingApi';
import { checkIn, checkOut, cancelBooking } from '../../api/bookingApi';
import { getMyPayments }      from '../../api/paymentApi';
import { getUnreadCount }     from '../../api/notificationApi';
import { getLotById }         from '../../api/lotApi';
import { useAuthStore }       from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime, formatDate } from '../../utils/formatDateTime';
import { formatCurrency }     from '../../utils/formatCurrency';
import FareTimer              from '../../components/booking/FareTimer';
import StatusBadge            from '../../components/booking/StatusBadge';
import LoadingSpinner         from '../../components/common/LoadingSpinner';
import ErrorMessage           from '../../components/common/ErrorMessage';

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#ADBBDA] rounded-xl 
                      shadow-card px-4 py-3">
        <p className="text-xs text-[#8697C4] font-medium mb-1">{label}</p>
        <p className="text-base font-black text-[#3D52A0]">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// ── Quick action cards ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    to: '/driver/find-parking',
    icon: MapPin,
    label: 'Find Parking',
    desc: 'Search nearby lots',
    color: 'bg-[#EDE8F5] text-[#3D52A0] hover:bg-[#3D52A0] hover:text-white',
  },
  {
    to: '/driver/bookings',
    icon: CalendarCheck,
    label: 'My Bookings',
    desc: 'View all reservations',
    color: 'bg-blue-50 text-[#7091E6] hover:bg-[#7091E6] hover:text-white',
  },
  {
    to: '/driver/vehicles',
    icon: Car,
    label: 'My Vehicles',
    desc: 'Manage your fleet',
    color: 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white',
  },
  {
    to: '/driver/payments',
    icon: CreditCard,
    label: 'Payments',
    desc: 'History & receipts',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white',
  },
];

export default function DriverDashboard() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [bookings,      setBookings]      = useState([]);
  const [payments,      setPayments]      = useState([]);
  const [lotNames,      setLotNames]      = useState({});   // lotId → name
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // bookingId

  // ── Derived states ────────────────────────────────────────────────────────
  const activeBooking   = bookings.find((b) => b.status === 'ACTIVE');
  const reservedBooking = bookings.find((b) => b.status === 'RESERVED');
  const recentBookings  = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // ── Spending chart data — group payments by month ─────────────────────────
  const spendingData = (() => {
    const map = {};
    payments.forEach((p) => {
      if (p.status !== 'PAID') return;
      const month = new Date(p.paidAt)
        .toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      map[month] = (map[month] ?? 0) + p.amount;
    });
    return Object.entries(map)
      .slice(-6)
      .map(([month, amount]) => ({ month, amount: +amount.toFixed(2) }));
  })();

  // ── Total spending stat ───────────────────────────────────────────────────
  const totalSpent = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  // ── Fetch lot name helper ─────────────────────────────────────────────────
  const fetchLotName = async (lotId) => {
    if (lotNames[lotId] || !lotId) return;
    try {
      const res = await getLotById(lotId);
      setLotNames((prev) => ({ ...prev, [lotId]: res.data.name }));
    } catch { /* silent */ }
  };

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bookRes, payRes, notifRes] = await Promise.allSettled([
          getMyBookings(),
          getMyPayments(),
          getUnreadCount(),
        ]);

        if (bookRes.status === 'fulfilled') {
          const bks = bookRes.value.data;
          setBookings(bks);
          // Pre-fetch lot names for active/reserved/recent
          const lotIds = [...new Set(bks.map((b) => b.lotId).filter(Boolean))];
          lotIds.forEach(fetchLotName);
        }
        if (payRes.status === 'fulfilled') {
          setPayments(payRes.value.data);
        }
        if (notifRes.status === 'fulfilled') {
          setUnreadCount(notifRes.value.data.count ?? 0);
        }
      } catch {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const res = await checkIn(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? res.data : b))
      );
      toast.success('Checked in successfully! 🅿️');
    } catch {
      toast.error('Check-in failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const res = await checkOut(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? res.data : b))
      );
      toast.success('Checked out! Proceed to payment. 💳');
      navigate(`/driver/bookings/${bookingId}`);
    } catch {
      toast.error('Check-out failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?'))
      return;
    setActionLoading(bookingId);
    try {
      const res = await cancelBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? res.data : b))
      );
      toast.success('Booking cancelled.');
    } catch {
      toast.error('Cancellation failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;
  if (error)   return <ErrorMessage message={error} />;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Driver';

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center 
                      sm:justify-between gap-3">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {firstName} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening with your parking today.
          </p>
        </div>
        <button
          onClick={() => navigate('/driver/find-parking')}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <MapPin className="w-4 h-4" />
          Find Parking
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: CalendarCheck,
            label: 'Total Bookings',
            value: bookings.length,
            color: 'text-[#3D52A0] bg-[#EDE8F5]',
          },
          {
            icon: CheckCircle,
            label: 'Completed',
            value: bookings.filter((b) => b.status === 'COMPLETED').length,
            color: 'text-green-600 bg-green-50',
          },
          {
            icon: Wallet,
            label: 'Total Spent',
            value: formatCurrency(totalSpent),
            color: 'text-amber-600 bg-amber-50',
          },
          {
            icon: Clock,
            label: 'Active Now',
            value: bookings.filter((b) =>
              b.status === 'ACTIVE' || b.status === 'RESERVED'
            ).length,
            color: 'text-[#7091E6] bg-blue-50',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center 
                            justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[#8697C4] text-xs font-medium truncate">
                {label}
              </p>
              <p className="text-[#3D52A0] font-black text-lg leading-tight">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active / Reserved Booking Cards ──────────────────────────────── */}
      {(activeBooking || reservedBooking) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Active booking */}
          {activeBooking && (
            <div className="card border-l-4 border-l-green-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full 
                                  animate-pulse" />
                  <span className="text-sm font-bold text-green-700">
                    Currently Parked
                  </span>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>

              {/* Lot + spot info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">Lot</p>
                  <p className="text-sm font-bold text-[#3D52A0] truncate">
                    {lotNames[activeBooking.lotId] ?? 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">
                    Vehicle
                  </p>
                  <p className="text-sm font-bold text-[#3D52A0]">
                    {activeBooking.vehiclePlate ?? '—'}
                  </p>
                </div>
              </div>

              {/* Fare timer */}
              <FareTimer
                bookingId={activeBooking.bookingId}
                checkInTime={activeBooking.checkInTime}
              />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCheckOut(activeBooking.bookingId)}
                  disabled={actionLoading === activeBooking.bookingId}
                  className="btn-primary flex-1 flex items-center 
                             justify-center gap-2"
                >
                  {actionLoading === activeBooking.bookingId ? (
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                  ) : (
                    <LogIn className="w-4 h-4 rotate-180" />
                  )}
                  Check Out
                </button>
                <button
                  onClick={() =>
                    navigate(`/driver/bookings/${activeBooking.bookingId}`)
                  }
                  className="btn-outline flex items-center gap-2"
                >
                  Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Reserved booking */}
          {reservedBooking && (
            <div className="card border-l-4 border-l-[#7091E6] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#7091E6] rounded-full" />
                  <span className="text-sm font-bold text-[#7091E6]">
                    Upcoming Reservation
                  </span>
                </div>
                <StatusBadge status="RESERVED" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">Lot</p>
                  <p className="text-sm font-bold text-[#3D52A0] truncate">
                    {lotNames[reservedBooking.lotId] ?? 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">
                    Vehicle
                  </p>
                  <p className="text-sm font-bold text-[#3D52A0]">
                    {reservedBooking.vehiclePlate ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">
                    Start Time
                  </p>
                  <p className="text-sm font-bold text-[#3D52A0]">
                    {formatDateTime(reservedBooking.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8697C4] font-medium">
                    End Time
                  </p>
                  <p className="text-sm font-bold text-[#3D52A0]">
                    {formatDateTime(reservedBooking.endTime)}
                  </p>
                </div>
              </div>

              {/* Price per hour */}
              <div className="bg-[#EDE8F5] rounded-xl px-4 py-3 
                              flex items-center justify-between">
                <span className="text-xs text-[#8697C4] font-medium">
                  Rate
                </span>
                <span className="text-[#3D52A0] font-black">
                  {formatCurrency(reservedBooking.pricePerHour)}/hr
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleCheckIn(reservedBooking.bookingId)}
                  disabled={actionLoading === reservedBooking.bookingId}
                  className="btn-primary flex-1 flex items-center 
                             justify-center gap-2"
                >
                  {actionLoading === reservedBooking.bookingId ? (
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Check In
                </button>
                <button
                  onClick={() => handleCancel(reservedBooking.bookingId)}
                  disabled={actionLoading === reservedBooking.bookingId}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                             border-2 border-red-200 text-red-500 text-sm 
                             font-semibold hover:bg-red-50 
                             transition-all duration-200"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── No active/reserved message ────────────────────────────────────── */}
      {!activeBooking && !reservedBooking && (
        <div className="card flex flex-col items-center justify-center 
                        py-12 text-center border-dashed border-2 
                        border-[#ADBBDA]">
          <div className="w-16 h-16 bg-[#EDE8F5] rounded-2xl flex items-center 
                          justify-center mb-4">
            <MapPin className="w-8 h-8 text-[#8697C4]" />
          </div>
          <h3 className="font-bold text-[#3D52A0] text-base mb-2">
            No active parking session
          </h3>
          <p className="text-[#8697C4] text-sm mb-5 max-w-xs">
            Find a nearby lot and book a spot to get started.
          </p>
          <button
            onClick={() => navigate('/driver/find-parking')}
            className="btn-primary flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Find Parking
          </button>
        </div>
      )}

      {/* ── Bottom Grid: Quick Actions + Recent Bookings + Chart ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-bold text-[#3D52A0] text-base mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ to, icon: Icon, label, desc, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 p-3 rounded-xl 
                            transition-all duration-200 group ${color}`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center 
                                justify-center bg-white/30 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {label}
                  </p>
                  <p className="text-xs opacity-70 truncate">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 
                                       group-hover:opacity-100 
                                       transition-opacity flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#3D52A0] text-base">
              Recent Bookings
            </h2>
            <Link
              to="/driver/bookings"
              className="text-xs font-semibold text-[#7091E6] 
                         hover:text-[#3D52A0] transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#8697C4] text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <Link
                  key={b.bookingId}
                  to={`/driver/bookings/${b.bookingId}`}
                  className="flex items-center justify-between p-3 
                             rounded-xl hover:bg-[#EDE8F5] 
                             transition-all duration-150 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#3D52A0] 
                                  truncate">
                      {lotNames[b.lotId] ?? `Booking #${
                        b.bookingId.slice(-6).toUpperCase()
                      }`}
                    </p>
                    <p className="text-xs text-[#8697C4] mt-0.5">
                      {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Spending Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#3D52A0] text-base">
              Monthly Spending
            </h2>
            <div className="flex items-center gap-1.5 bg-[#EDE8F5] 
                            rounded-full px-3 py-1">
              <TrendingUp className="w-3 h-3 text-[#3D52A0]" />
              <span className="text-xs font-semibold text-[#3D52A0]">
                {formatCurrency(totalSpent)} total
              </span>
            </div>
          </div>

          {spendingData.length === 0 ? (
            <div className="flex flex-col items-center justify-center 
                            h-40 text-center">
              <CreditCard className="w-8 h-8 text-[#ADBBDA] mb-2" />
              <p className="text-[#8697C4] text-sm">No payment data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={spendingData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EDE8F5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#8697C4', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  fill="#3D52A0"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: greeting by time of day ──────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}