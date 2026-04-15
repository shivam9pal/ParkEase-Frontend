import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, Users,
  Plus, ArrowRight, ToggleLeft, ToggleRight,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getMyLots, toggleLotOpen } from '../../api/lotApi';
import { getActiveBookingsByLot } from '../../api/bookingApi';
import { getMyNotifications } from '../../api/notificationApi';
import { getOccupancyRate } from '../../api/analyticsApi';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import LotFormModal from '../../components/lots/LotFormModal';
import { formatTimeString } from '../../utils/formatDateTime';
import { timeAgo } from '../../utils/formatDateTime';

// Notification type → emoji
const NOTIF_ICON = {
  BOOKING_CREATED  : '🅿️',
  CHECKIN          : '🚗',
  CHECKOUT         : '✅',
  BOOKING_CANCELLED: '❌',
  LOT_APPROVED     : '🎉',
};

export default function ManagerDashboard() {
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────
  const [lots, setLots]                     = useState([]);
  const [activeBookings, setActiveBookings] = useState({});   // { lotId: count }
  const [occupancy, setOccupancy]           = useState({});   // { lotId: OccupancyRateResponse }
  const [notifications, setNotifications]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [togglingLot, setTogglingLot]       = useState(null); // lotId being toggled
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Fetch All Dashboard Data ─────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Load all manager lots
      const lotsRes = await getMyLots(user.userId);
      const fetchedLots = lotsRes.data ?? [];
      setLots(fetchedLots);

      const approvedLots = fetchedLots.filter((l) => l.isApproved);

      // 2. For each approved lot — fetch active bookings + occupancy in parallel
      const [bookingResults, occupancyResults] = await Promise.all([
        Promise.allSettled(
          approvedLots.map((l) =>
            getActiveBookingsByLot(l.lotId).then((r) => ({
              lotId: l.lotId,
              count: r.data?.length ?? 0,
            }))
          )
        ),
        Promise.allSettled(
          approvedLots.map((l) =>
            getOccupancyRate(l.lotId).then((r) => ({
              lotId: l.lotId,
              data : r.data,
            }))
          )
        ),
      ]);

      // Build bookings map
      const bookingsMap = {};
      bookingResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          bookingsMap[result.value.lotId] = result.value.count;
        }
      });
      setActiveBookings(bookingsMap);

      // Build occupancy map
      const occupancyMap = {};
      occupancyResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          occupancyMap[result.value.lotId] = result.value.data;
        }
      });
      setOccupancy(occupancyMap);

      // 3. Load recent notifications (last 3)
      const notifRes = await getMyNotifications();
      setNotifications((notifRes.data ?? []).slice(0, 3));

    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Toggle Lot Open/Close ────────────────────────────────────────
  const handleToggle = async (lotId, currentIsOpen) => {
    setTogglingLot(lotId);
    try {
      const res = await toggleLotOpen(lotId);
      setLots((prev) =>
        prev.map((l) => (l.lotId === lotId ? res.data : l))
      );
      toast.success(
        res.data.isOpen ? 'Lot is now OPEN ✅' : 'Lot is now CLOSED 🔒'
      );
    } catch {
      toast.error('Failed to toggle lot status.');
    } finally {
      setTogglingLot(null);
    }
  };

  // ── Handle Lot Created ───────────────────────────────────────────
  const handleLotCreated = (newLot) => {
    setLots((prev) => [newLot, ...prev]);
    setShowCreateModal(false);
    toast.success('Lot submitted for admin approval! ⏳');
  };

  // ── Computed Stats ────────────────────────────────────────────────
  const totalLots        = lots.length;
  const approvedLots     = lots.filter((l) => l.isApproved).length;
  const pendingLots      = lots.filter((l) => !l.isApproved).length;
  const totalActiveNow   = Object.values(activeBookings).reduce((a, b) => a + b, 0);

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchDashboard} fullPage />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="Dashboard"
        subtitle={`Overview of your parking operations — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted
                       hover:text-primary border border-accent rounded-lg
                       hover:border-primary transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Lots"
          value={totalLots}
          color="primary"
          icon={<Building2 size={22} />}
          subtitle="All your parking lots"
        />
        <StatCard
          title="Approved Lots"
          value={approvedLots}
          color="green"
          icon={<CheckCircle2 size={22} />}
          subtitle="Live & visible to drivers"
        />
        <StatCard
          title="Pending Approval"
          value={pendingLots}
          color="yellow"
          icon={<Clock size={22} />}
          subtitle="Awaiting admin review"
        />
        <StatCard
          title="Active Now"
          value={totalActiveNow}
          color="blue"
          icon={<Users size={22} />}
          subtitle="Drivers currently parked"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Lots Overview Table (2/3 width) ── */}
        <div className="xl:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-accent/30">
            <h2 className="section-title mb-0">Lots Overview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary
                           text-white text-xs font-semibold rounded-lg
                           hover:bg-primary-hover transition-colors"
              >
                <Plus size={13} />
                Add Lot
              </button>
              <button
                onClick={() => navigate('/manager/lots')}
                className="flex items-center gap-1 text-xs text-secondary
                           font-medium hover:text-primary transition-colors"
              >
                View All
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {lots.length === 0 ? (
            <EmptyState
              title="No lots yet"
              description="Create your first parking lot to get started."
              action={
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={14} />
                  Add Your First Lot
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background/60 border-b border-accent/20">
                    {['Lot Name', 'City', 'Status', 'Spots', 'Hours', 'Active', 'Open', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                             text-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/10">
                  {lots.map((lot) => (
                    <tr
                      key={lot.lotId}
                      className="hover:bg-background/40 transition-colors"
                    >
                      {/* Lot Name */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 truncate max-w-[140px]">
                          {lot.name}
                        </p>
                        <p className="text-xs text-muted truncate max-w-[140px]">
                          {lot.address}
                        </p>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lot.city}
                      </td>

                      {/* Approval Status */}
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={lot.isApproved ? 'APPROVED' : 'PENDING'}
                        />
                      </td>

                      {/* Available / Total Spots */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-green-600 font-semibold">
                          {lot.availableSpots}
                        </span>
                        <span className="text-muted"> / {lot.totalSpots}</span>
                      </td>

                      {/* Operating Hours */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatTimeString(lot.openTime)} –{' '}
                        {formatTimeString(lot.closeTime)}
                      </td>

                      {/* Active Now */}
                      <td className="px-4 py-3">
                        {lot.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-sm
                                           font-semibold text-blue-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500
                                             animate-pulse" />
                            {activeBookings[lot.lotId] ?? 0}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Open Toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(lot.lotId, lot.isOpen)}
                          disabled={togglingLot === lot.lotId || !lot.isApproved}
                          className="disabled:opacity-40 disabled:cursor-not-allowed
                                     transition-colors"
                          title={!lot.isApproved ? 'Lot must be approved first' : ''}
                        >
                          {togglingLot === lot.lotId ? (
                            <div className="w-4 h-4 border-2 border-primary
                                            border-t-transparent rounded-full animate-spin" />
                          ) : lot.isOpen ? (
                            <ToggleRight size={24} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={24} className="text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/manager/lots/${lot.lotId}`)}
                          className="flex items-center gap-1 text-xs text-secondary
                                     font-semibold hover:text-primary transition-colors
                                     whitespace-nowrap"
                        >
                          View
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* ── Recent Notifications ── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-accent/30">
              <h2 className="section-title mb-0">Recent Notifications</h2>
            </div>

            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted">No recent notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-accent/10">
                {notifications.map((n) => (
                  <div
                    key={n.notificationId}
                    className={`px-5 py-3.5 transition-colors
                                ${!n.isRead ? 'bg-parkease-bg/50' : ''}`}
                  >
                    <div className="flex gap-3">
                      <span className="text-base shrink-0">
                        {NOTIF_ICON[n.type] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug
                                      ${!n.isRead
                                        ? 'font-semibold text-gray-800'
                                        : 'text-gray-600'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-accent mt-1">
                          {timeAgo(n.sentAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary
                                         shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Occupancy Snapshot ── */}
          {lots.filter((l) => l.isApproved).length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-accent/30">
                <h2 className="section-title mb-0">Live Occupancy</h2>
              </div>
              <div className="divide-y divide-accent/10">
                {lots
                  .filter((l) => l.isApproved)
                  .slice(0, 4)
                  .map((lot) => {
                    const occ      = occupancy[lot.lotId];
                    const rate     = occ?.occupancyRate ?? 0;
                    const barColor = rate >= 90
                      ? 'bg-red-500'
                      : rate >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500';

                    return (
                      <div
                        key={lot.lotId}
                        className="px-5 py-3 cursor-pointer hover:bg-background/40
                                   transition-colors"
                        onClick={() =>
                          navigate(`/manager/lots/${lot.lotId}/occupancy`)
                        }
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-gray-700 truncate
                                        max-w-[140px]">
                            {lot.name}
                          </p>
                          <span className="text-xs font-bold text-gray-600">
                            {rate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-accent/30 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 ${barColor} rounded-full
                                        transition-all duration-500`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[11px] text-muted">
                            {occ?.availableSpots ?? lot.availableSpots} available
                          </span>
                          <span className="text-[11px] text-muted">
                            {occ?.totalSpots ?? lot.totalSpots} total
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Lot Modal ── */}
      {showCreateModal && (
        <LotFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleLotCreated}
        />
      )}
    </div>
  );
}