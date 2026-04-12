import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Car, ToggleLeft, ToggleRight,
  Pencil, CalendarDays, Activity, BarChart3,
  Building2, CheckCircle2, AlertTriangle, Wrench,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { getLotById, toggleLotOpen } from '../../api/lotApi';
import { getSpotsByLot } from '../../api/spotApi';
import { getActiveBookingsByLot } from '../../api/bookingApi';
import { getDailyReport } from '../../api/analyticsApi';
import LotFormModal from '../../components/lots/LotFormModal';
import OccupancyMeter from '../../components/bookings/OccupancyMeter';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatTimeString, formatDate } from '../../utils/formatDateTime';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDuration } from '../../utils/formatDuration';

// Fix Leaflet icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl      : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl    : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Spot status → color
const SPOT_STATUS_COLOR = {
  AVAILABLE  : 'bg-green-500',
  RESERVED   : 'bg-blue-500',
  OCCUPIED   : 'bg-red-500',
  MAINTENANCE: 'bg-gray-400',
};

// Lot navigation tabs
const LOT_TABS = [
  { key: 'spots',     label: 'Manage Spots',   icon: Car },
  { key: 'bookings',  label: 'All Bookings',   icon: CalendarDays },
  { key: 'occupancy', label: 'Live Occupancy', icon: Activity },
  { key: 'revenue',   label: 'Revenue',        icon: BarChart3 },
];

export default function LotDetailPage() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  // ── State ────────────────────────────────────────────────────────
  const [lot, setLot]                     = useState(null);
  const [spots, setSpots]                 = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [dailyReport, setDailyReport]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [toggling, setToggling]           = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Fetch Page Data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lotRes, spotsRes, activeRes] = await Promise.all([
        getLotById(lotId),
        getSpotsByLot(lotId),
        getActiveBookingsByLot(lotId),
      ]);

      setLot(lotRes.data);
      setSpots(spotsRes.data ?? []);
      setActiveBookings(activeRes.data ?? []);

      // Fetch daily report only for approved lots
      if (lotRes.data?.isApproved) {
        try {
          const reportRes = await getDailyReport(lotId);
          setDailyReport(reportRes.data);
        } catch {
          // Non-critical — analytics may not have data yet
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Parking lot not found.');
      } else {
        setError('Failed to load lot details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle Open/Close ────────────────────────────────────────────
  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await toggleLotOpen(lotId);
      setLot(res.data);
      toast.success(res.data.isOpen ? 'Lot is now OPEN ✅' : 'Lot is now CLOSED 🔒');
    } catch {
      toast.error('Failed to toggle lot status.');
    } finally {
      setToggling(false);
    }
  };

  // ── Spot counts by status ────────────────────────────────────────
  const spotCounts = {
    AVAILABLE  : spots.filter((s) => s.status === 'AVAILABLE').length,
    RESERVED   : spots.filter((s) => s.status === 'RESERVED').length,
    OCCUPIED   : spots.filter((s) => s.status === 'OCCUPIED').length,
    MAINTENANCE: spots.filter((s) => s.status === 'MAINTENANCE').length,
  };

  if (loading) return <LoadingSpinner fullPage text="Loading lot details..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchData} fullPage />;
  if (!lot)    return null;

  const occupancyPct = lot.totalSpots > 0
    ? (((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title={lot.name}
        subtitle={`${lot.address}, ${lot.city}`}
        showBack
        backTo="/manager/lots"
        actions={
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary
                       text-primary text-sm font-semibold rounded-lg
                       hover:bg-primary hover:text-white transition-colors"
          >
            <Pencil size={14} />
            Edit Lot
          </button>
        }
      />

      {/* ── Approval Status Banner ── */}
      {lot.isApproved ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border
                        border-green-200 rounded-xl">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">
              Your lot is live ✅
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Drivers can search and book spots at this location.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border
                        border-yellow-200 rounded-xl">
          <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">
              ⏳ Awaiting Admin Approval
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              This lot is not visible to drivers yet. You can still manage
              spots while approval is pending.
            </p>
          </div>
        </div>
      )}

      {/* ── Lot Header Card ── */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Lot Image */}
          <div className="lg:w-64 h-44 rounded-xl overflow-hidden bg-background
                          border border-accent/30 shrink-0">
            {lot.imageUrl ? (
              <img
                src={lot.imageUrl}
                alt={lot.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center
                              justify-center gap-2">
                <Building2 size={36} className="text-accent" />
                <p className="text-xs text-muted">No image</p>
              </div>
            )}
          </div>

          {/* Lot Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lot.isApproved ? 'APPROVED' : 'PENDING'} />
              <StatusBadge status={lot.isOpen ? 'OPEN' : 'CLOSED'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={15} className="text-secondary shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  {lot.address}, {lot.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={15} className="text-secondary shrink-0" />
                <span className="text-gray-600">
                  {formatTimeString(lot.openTime)} –{' '}
                  {formatTimeString(lot.closeTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Car size={15} className="text-secondary shrink-0" />
                <span className="text-gray-600">
                  <span className="font-semibold text-green-600">
                    {lot.availableSpots}
                  </span>
                  {' '}available /{' '}
                  <span className="font-semibold">{lot.totalSpots}</span>
                  {' '}total spots
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity size={15} className="text-secondary shrink-0" />
                <span className="text-gray-600">
                  <span className="font-semibold text-blue-600">
                    {activeBookings.length}
                  </span>
                  {' '}vehicles currently parked
                </span>
              </div>
            </div>

            {/* Occupancy Meter */}
            <OccupancyMeter
              total={lot.totalSpots}
              available={lot.availableSpots}
              size="md"
            />

            {/* Open/Close Toggle Button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleToggle}
                disabled={toggling || !lot.isApproved}
                title={!lot.isApproved ? 'Lot must be approved first' : ''}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold
                            rounded-lg border-2 transition-all duration-150
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${lot.isOpen
                              ? 'border-orange-400 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                              : 'border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500'}`}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent
                                  rounded-full animate-spin" />
                ) : lot.isOpen ? (
                  <><ToggleRight size={16} /> Close Lot</>
                ) : (
                  <><ToggleLeft size={16} /> Open Lot</>
                )}
              </button>
              <span className="text-xs text-muted">
                {lot.isOpen
                  ? 'Lot is currently accepting bookings'
                  : 'Lot is closed — no new bookings'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics Stats Row (approved lots only) ── */}
      {lot.isApproved && dailyReport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(dailyReport.todayRevenue ?? 0)}
            color="green"
            icon={<BarChart3 size={20} />}
            subtitle="Payments received today"
          />
          <StatCard
            title="Today's Checkouts"
            value={dailyReport.todayCheckouts ?? 0}
            color="blue"
            icon={<CheckCircle2 size={20} />}
            subtitle="Completed sessions today"
          />
          <StatCard
            title="Avg Duration"
            value={dailyReport.avgDurationFormatted ?? '—'}
            color="purple"
            icon={<Clock size={20} />}
            subtitle="Average parking time"
          />
          <StatCard
            title="Occupancy Rate"
            value={`${occupancyPct}%`}
            color={Number(occupancyPct) >= 90 ? 'red' : Number(occupancyPct) >= 70 ? 'yellow' : 'green'}
            icon={<Activity size={20} />}
            subtitle="Current fill rate"
          />
        </div>
      )}

      {/* ── Spot Status Summary ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Spot Status Summary</h2>
          <button
            onClick={() => navigate(`/manager/lots/${lotId}/spots`)}
            className="text-xs text-secondary font-semibold hover:text-primary
                       transition-colors flex items-center gap-1"
          >
            Manage All Spots →
          </button>
        </div>

        {/* Status count pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { status: 'AVAILABLE',   count: spotCounts.AVAILABLE,   color: 'bg-green-100 text-green-700 border-green-200' },
            { status: 'RESERVED',    count: spotCounts.RESERVED,    color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { status: 'OCCUPIED',    count: spotCounts.OCCUPIED,    color: 'bg-red-100 text-red-700 border-red-200' },
            { status: 'MAINTENANCE', count: spotCounts.MAINTENANCE, color: 'bg-gray-100 text-gray-600 border-gray-200' },
          ].map(({ status, count, color }) => (
            <div key={status}
                 className={`flex items-center justify-between px-4 py-3
                             rounded-xl border ${color}`}>
              <span className="text-sm font-medium capitalize">
                {status.toLowerCase()}
              </span>
              <span className="text-xl font-bold">{count}</span>
            </div>
          ))}
        </div>

        {/* Quick Spot Grid Preview (first 24 spots) */}
        {spots.length > 0 && (
          <>
            <p className="text-xs text-muted mb-3 font-medium">
              Quick Preview (first 24 spots)
            </p>
            <div className="flex flex-wrap gap-2">
              {spots.slice(0, 24).map((spot) => (
                <div
                  key={spot.spotId}
                  title={`${spot.spotNumber} — ${spot.status}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center
                              text-white text-[10px] font-bold cursor-default
                              transition-transform hover:scale-110
                              ${SPOT_STATUS_COLOR[spot.status] ?? 'bg-gray-400'}`}
                >
                  {spot.spotNumber.length > 4
                    ? spot.spotNumber.slice(-3)
                    : spot.spotNumber}
                </div>
              ))}
              {spots.length > 24 && (
                <div
                  onClick={() => navigate(`/manager/lots/${lotId}/spots`)}
                  className="w-10 h-10 rounded-lg bg-accent/40 flex items-center
                             justify-center text-muted text-[10px] font-bold
                             cursor-pointer hover:bg-primary hover:text-white
                             transition-colors"
                >
                  +{spots.length - 24}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { color: 'bg-green-500', label: 'Available' },
                { color: 'bg-blue-500',  label: 'Reserved' },
                { color: 'bg-red-500',   label: 'Occupied' },
                { color: 'bg-gray-400',  label: 'Maintenance' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="text-xs text-muted">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Leaflet Map ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-accent/30">
          <h2 className="section-title mb-0">📍 Lot Location</h2>
        </div>
        <div style={{ height: '280px' }}>
          <MapContainer
            center={[lot.latitude, lot.longitude]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[lot.latitude, lot.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-primary">{lot.name}</p>
                  <p className="text-gray-600 text-xs mt-1">{lot.address}</p>
                  <p className="text-gray-600 text-xs">{lot.city}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        <div className="px-6 py-3 bg-background/40 border-t border-accent/20">
          <p className="text-xs text-muted">
            📌 Lat: {lot.latitude.toFixed(6)},
            Lng: {lot.longitude.toFixed(6)}
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-accent/30">
          <h2 className="section-title mb-0">Lot Management</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-accent/20">
          {LOT_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigate(`/manager/lots/${lotId}/${key}`)}
              className="flex flex-col items-center gap-2 py-6 px-4
                         hover:bg-background transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center
                              justify-center group-hover:bg-primary transition-colors">
                <Icon
                  size={18}
                  className="text-primary group-hover:text-white transition-colors"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700
                               group-hover:text-primary transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <LotFormModal
          mode="edit"
          lot={lot}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setLot(updated);
            setShowEditModal(false);
            toast.success('Lot updated successfully ✅');
          }}
        />
      )}
    </div>
  );
}