import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity, RefreshCw, CheckCircle2, XCircle,
  Car, Clock, Zap, Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getLotById }         from '../../api/lotApi';
import { getSpotsByLot }      from '../../api/spotApi';
import {
  getActiveBookingsByLot,
  checkOutBooking,
  cancelBooking,
  getFareEstimate,
} from '../../api/bookingApi';
import { getOccupancyRate, getHourlyOccupancy } from '../../api/analyticsApi';
import OccupancyMeter  from '../../components/bookings/OccupancyMeter';
import StatusBadge     from '../../components/common/StatusBadge';
import ConfirmDialog   from '../../components/common/ConfirmDialog';
import LoadingSpinner  from '../../components/common/LoadingSpinner';
import ErrorMessage    from '../../components/common/ErrorMessage';
import PageHeader      from '../../components/common/PageHeader';
import { formatDate, calcDuration } from '../../utils/formatDateTime';
import { formatCurrency }           from '../../utils/formatCurrency';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell,
} from 'recharts';

// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL_MS = 30_000;

// Spot status colors for grid
const SPOT_GRID_CONFIG = {
  AVAILABLE  : { bg: 'bg-green-500', text: 'text-white', label: 'Available' },
  RESERVED   : { bg: 'bg-blue-500',  text: 'text-white', label: 'Reserved' },
  OCCUPIED   : { bg: 'bg-red-500',   text: 'text-white', label: 'Occupied' },
  MAINTENANCE: { bg: 'bg-gray-400',  text: 'text-white', label: 'Maintenance' },
};

// ── Live Duration Timer ───────────────────────────────────────────────
function LiveTimer({ checkInTime }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      if (!checkInTime) return;
      const start = new Date(checkInTime);
      const now   = new Date();
      const mins  = Math.floor((now - start) / 60000);
      const h     = Math.floor(mins / 60);
      const m     = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };

    calc();
    const interval = setInterval(calc, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [checkInTime]);

  return (
    <span className="flex items-center gap-1 text-blue-600 font-semibold text-sm">
      <Timer size={13} className="animate-pulse" />
      {elapsed || '—'}
    </span>
  );
}

// ── Custom Tooltip for hourly chart ──────────────────────────────────
function HourlyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-accent/40 rounded-lg px-3 py-2
                    shadow-card text-xs">
      <p className="font-semibold text-primary">
        {payload[0].payload.label}
      </p>
      <p className="text-gray-600 mt-0.5">
        Avg occupancy:{' '}
        <span className="font-bold text-secondary">
          {payload[0].value?.toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

export default function ActiveOccupancyPage() {
  const { lotId } = useParams();
  const timerRef  = useRef(null);

  // ── State ─────────────────────────────────────────────────────────
  const [lot, setLot]                   = useState(null);
  const [spots, setSpots]               = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [occupancy, setOccupancy]       = useState(null);
  const [hourlyData, setHourlyData]     = useState([]);
  const [fareMap, setFareMap]           = useState({});      // { bookingId: fare }
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh]   = useState(true);

  // Action dialogs
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [cancelTarget, setCancelTarget]     = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);

  // ── Fetch Live Data ────────────────────────────────────────────────
  const fetchLive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [lotRes, spotsRes, activeRes, occRes] = await Promise.all([
        getLotById(lotId),
        getSpotsByLot(lotId),
        getActiveBookingsByLot(lotId),
        getOccupancyRate(lotId).catch(() => ({ data: null })),
      ]);

      setLot(lotRes.data);
      setSpots(spotsRes.data ?? []);
      setActiveBookings(activeRes.data ?? []);
      setOccupancy(occRes.data);
      setLastRefreshed(new Date());

      // Fetch fare estimates for all active bookings
      const activeList = activeRes.data ?? [];
      const fareResults = await Promise.allSettled(
        activeList.map((b) =>
          getFareEstimate(b.bookingId).then((r) => ({
            id  : b.bookingId,
            data: r.data,
          }))
        )
      );
      const newFareMap = {};
      fareResults.forEach((r) => {
        if (r.status === 'fulfilled') {
          newFareMap[r.value.id] = r.value.data;
        }
      });
      setFareMap(newFareMap);

    } catch {
      if (!silent) setError('Failed to load live occupancy data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [lotId]);

  // Fetch hourly analytics (one-time, less critical)
  const fetchHourly = useCallback(async () => {
    try {
      const res = await getHourlyOccupancy(lotId);
      const data = (res.data ?? []).map((item) => ({
        hour   : item.hour,
        rate   : parseFloat(item.averageOccupancyRate?.toFixed(1) ?? 0),
        label  : `${String(item.hour).padStart(2,'0')}:00`,
      }));
      setHourlyData(data);
    } catch {
      // Non-critical
    }
  }, [lotId]);

  useEffect(() => {
    fetchLive();
    fetchHourly();
  }, [fetchLive, fetchHourly]);

  // ── Auto-refresh timer ─────────────────────────────────────────────
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchLive(true), REFRESH_INTERVAL_MS);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, fetchLive]);

  // ── Checkout ───────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!checkoutTarget) return;
    setActionLoading(true);
    try {
      await checkOutBooking(checkoutTarget.bookingId);
      toast.success(
        `Vehicle ${checkoutTarget.vehiclePlate} checked out ✅`
      );
      fetchLive(true);
    } catch {
      toast.error('Failed to checkout.');
    } finally {
      setActionLoading(false);
      setCheckoutTarget(null);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await cancelBooking(cancelTarget.bookingId);
      toast.success(`Booking for ${cancelTarget.vehiclePlate} cancelled.`);
      fetchLive(true);
    } catch {
      toast.error('Failed to cancel booking.');
    } finally {
      setActionLoading(false);
      setCancelTarget(null);
    }
  };

  // ── Spot counts ────────────────────────────────────────────────────
  const spotCounts = {
    AVAILABLE  : spots.filter((s) => s.status === 'AVAILABLE').length,
    RESERVED   : spots.filter((s) => s.status === 'RESERVED').length,
    OCCUPIED   : spots.filter((s) => s.status === 'OCCUPIED').length,
    MAINTENANCE: spots.filter((s) => s.status === 'MAINTENANCE').length,
  };

  if (loading) return <LoadingSpinner fullPage text="Loading live occupancy..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchLive} fullPage />;

  const occRate = occupancy?.occupancyRate ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="Live Occupancy"
        subtitle={`${lot?.name ?? ''} — Real-time view`}
        showBack
        backTo={`/manager/lots/${lotId}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                          rounded-lg border transition-colors
                          ${autoRefresh
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              <span className={`w-2 h-2 rounded-full
                                ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={() => fetchLive()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted
                         border border-accent rounded-lg hover:text-primary
                         hover:border-primary transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Last refreshed */}
      {lastRefreshed && (
        <p className="text-xs text-muted -mt-2">
          Last updated:{' '}
          <span className="text-gray-600 font-medium">
            {lastRefreshed.toLocaleTimeString('en-IN')}
          </span>
          {autoRefresh && ' · Auto-refreshes every 30s'}
        </p>
      )}

      {/* ── Occupancy Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Occupancy Meter */}
        <div className="card">
          <h2 className="section-title">Current Occupancy</h2>
          <OccupancyMeter
            total={occupancy?.totalSpots ?? lot?.totalSpots ?? 0}
            available={occupancy?.availableSpots ?? lot?.availableSpots ?? 0}
            size="lg"
          />
          <p className="text-xs text-muted mt-3">
            📸 Snapshot taken at:{' '}
            {occupancy?.computedAt
              ? formatDate(occupancy.computedAt)
              : 'N/A'}
          </p>
        </div>

        {/* Spot Status Distribution */}
        <div className="card">
          <h2 className="section-title">Spot Status Breakdown</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SPOT_GRID_CONFIG).map(([status, config]) => (
              <div key={status}
                   className={`p-4 rounded-xl ${config.bg} ${config.text}
                               flex items-center justify-between`}>
                <span className="text-sm font-semibold opacity-90">
                  {config.label}
                </span>
                <span className="text-2xl font-bold">
                  {spotCounts[status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full Spot Grid ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            Spot Map
            <span className="text-sm text-muted font-normal ml-2">
              ({spots.length} spots)
            </span>
          </h2>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(SPOT_GRID_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${config.bg}`} />
                <span className="text-xs text-muted">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {spots.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No spots configured for this lot.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {spots.map((spot) => {
              const config = SPOT_GRID_CONFIG[spot.status] ?? SPOT_GRID_CONFIG.AVAILABLE;
              // Find active booking for this spot
              const booking = activeBookings.find(
                (b) => b.spotId === spot.spotId
              );
              return (
                <div
                  key={spot.spotId}
                  title={`${spot.spotNumber} — ${spot.status}${booking ? ` | ${booking.vehiclePlate}` : ''}`}
                  className={`w-12 h-12 rounded-xl flex flex-col items-center
                              justify-center ${config.bg} ${config.text}
                              cursor-default transition-transform
                              hover:scale-110 hover:shadow-md`}
                >
                  <span className="text-[10px] font-bold leading-tight text-center
                                   px-1 truncate w-full">
                    {spot.spotNumber.length > 4
                      ? spot.spotNumber.slice(-3)
                      : spot.spotNumber}
                  </span>
                  {booking && (
                    <span className="text-[8px] opacity-80 leading-none">
                      🚗
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Active Vehicles Table ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-accent/30 flex items-center
                        justify-between">
          <h2 className="section-title mb-0">
            Currently Parked
            <span className="ml-2 px-2.5 py-0.5 text-xs font-bold bg-blue-100
                             text-blue-700 rounded-full">
              {activeBookings.length} vehicles
            </span>
          </h2>
        </div>

        {activeBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Car size={36} className="text-accent" />
            <p className="text-sm text-muted font-medium">
              No vehicles currently parked
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/60 border-b border-accent/20">
                  {['Vehicle Plate', 'Type', 'Check-In', 'Duration',
                    'Live Fare', 'Actions'].map((h) => (
                    <th key={h}
                        className="text-left px-4 py-3 text-xs font-semibold
                                   text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/10">
                {activeBookings.map((booking) => {
                  const fare = fareMap[booking.bookingId];
                  return (
                    <tr key={booking.bookingId}
                        className="hover:bg-background/40 transition-colors">

                      {/* Vehicle Plate */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex
                                          items-center justify-center shrink-0">
                            <Car size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 tracking-wide">
                              {booking.vehiclePlate ?? '—'}
                            </p>
                            <p className="text-[11px] text-muted">
                              {booking.bookingType === 'WALK_IN'
                                ? '🚶 Walk-in'
                                : '📅 Pre-booked'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle Type */}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {booking.vehicleType?.replace('_', ' ')}
                      </td>

                      {/* Check-In */}
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {booking.checkInTime
                          ? formatDate(booking.checkInTime)
                          : '—'}
                      </td>

                      {/* Live Duration Timer */}
                      <td className="px-4 py-3">
                        <LiveTimer checkInTime={booking.checkInTime} />
                      </td>

                      {/* Live Fare */}
                      <td className="px-4 py-3">
                        {fare ? (
                          <div>
                            <p className="font-bold text-green-700">
                              {formatCurrency(fare.estimatedFare)}
                            </p>
                            <p className="text-[11px] text-muted">
                              {fare.estimatedHours?.toFixed(2)}h @{' '}
                              {formatCurrency(fare.pricePerHour)}/hr
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <div className="w-3 h-3 border border-muted
                                            border-t-transparent rounded-full
                                            animate-spin" />
                            Calculating...
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCheckoutTarget(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                                       font-semibold text-white bg-green-500
                                       rounded-lg hover:bg-green-600
                                       transition-colors"
                          >
                            <CheckCircle2 size={12} />
                            Checkout
                          </button>
                          <button
                            onClick={() => setCancelTarget(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                                       font-semibold text-red-600 border
                                       border-red-200 rounded-lg
                                       hover:bg-red-500 hover:text-white
                                       transition-colors"
                          >
                            <XCircle size={12} />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Hourly Occupancy Chart ── */}
      {hourlyData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">
              Average Hourly Occupancy
              <span className="text-sm text-muted font-normal ml-2">
                (last 30 days)
              </span>
            </h2>
          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ADBBDA"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<HourlyTooltip />} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((entry) => (
                    <Cell
                      key={entry.hour}
                      fill={
                        entry.rate >= 90 ? '#ef4444' :
                        entry.rate >= 70 ? '#f59e0b' :
                        entry.rate >= 40 ? '#7091E6' :
                        '#ADBBDA'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-4 mt-2 justify-end">
            {[
              { color: 'bg-red-500',    label: '≥90% (Full)' },
              { color: 'bg-yellow-500', label: '≥70% (Busy)' },
              { color: 'bg-secondary',  label: '≥40% (Moderate)' },
              { color: 'bg-accent',     label: '<40% (Light)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Checkout Confirm ── */}
      <ConfirmDialog
        open={!!checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onConfirm={handleCheckout}
        loading={actionLoading}
        title="Check Out Vehicle?"
        description={`Check out ${checkoutTarget?.vehiclePlate ?? ''}? Final fare will be calculated from check-in time.`}
        confirmLabel="Confirm Checkout"
        variant="primary"
      />

      {/* ── Cancel Confirm ── */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={actionLoading}
        title="Cancel Booking?"
        description={`Cancel active booking for ${cancelTarget?.vehiclePlate ?? ''}? The spot will be freed immediately.`}
        confirmLabel="Yes, Cancel"
        variant="danger"
      />
    </div>
  );
}