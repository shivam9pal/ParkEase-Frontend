import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Search, Filter, Layers,
  Car, Zap, Accessibility, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { getLotById } from '../../api/lotApi';
import { getSpotsByLot, createSpot, createBulkSpots } from '../../api/spotApi';
import SpotCard from '../../components/spots/SpotCard';
import SpotFormModal from '../../components/spots/SpotFormModal';
import OccupancyMeter from '../../components/bookings/OccupancyMeter';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

const SPOT_TYPES    = ['ALL', 'COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];
const SPOT_STATUSES = ['ALL', 'AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'];

const STATUS_COUNT_COLORS = {
  AVAILABLE  : 'text-green-600 bg-green-50 border-green-200',
  RESERVED   : 'text-blue-600 bg-blue-50 border-blue-200',
  OCCUPIED   : 'text-red-600 bg-red-50 border-red-200',
  MAINTENANCE: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default function ManageSpotsPage() {
  const { lotId } = useParams();

  // ── State ────────────────────────────────────────────────────────
  const [lot, setLot]           = useState(null);
  const [spots, setSpots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSpot, setEditingSpot]   = useState(null);

  // ── Bulk Add State ───────────────────────────────────────────────
  const [showBulkModal, setShowBulkModal]   = useState(false);
  const [bulkPrefix, setBulkPrefix]         = useState('');
  const [bulkStart, setBulkStart]           = useState(1);
  const [bulkEnd, setBulkEnd]               = useState(10);
  const [bulkType, setBulkType]             = useState('STANDARD');
  const [bulkVehicle, setBulkVehicle]       = useState('FOUR_WHEELER');
  const [bulkPrice, setBulkPrice]           = useState(50);
  const [bulkProgress, setBulkProgress]     = useState(null); // { done, total }
  const [bulkLoading, setBulkLoading]       = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lotRes, spotsRes] = await Promise.all([
        getLotById(lotId),
        getSpotsByLot(lotId),
      ]);
      setLot(lotRes.data);
      setSpots(spotsRes.data ?? []);
    } catch {
      setError('Failed to load spots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Spot CRUD handlers ───────────────────────────────────────────
  const handleSpotAdded = (newSpot) => {
    setSpots((prev) => [...prev, newSpot]);
    setShowAddModal(false);
  };

  const handleSpotUpdated = (updatedSpot) => {
    setSpots((prev) =>
      prev.map((s) => (s.spotId === updatedSpot.spotId ? updatedSpot : s))
    );
    setEditingSpot(null);
  };

  const handleSpotDeleted = (spotId) => {
    setSpots((prev) => prev.filter((s) => s.spotId !== spotId));
  };

  // ── Bulk Add Spots ───────────────────────────────────────────────
  const handleBulkAdd = async () => {
    const count = bulkEnd - bulkStart + 1;
    if (count <= 0 || count > 50) {
      toast.error('Bulk range must be between 1 and 50 spots.');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: count });

    try {
      // Single API call to bulk endpoint — backend generates auto-numbered spots
      const res = await createBulkSpots({
        lotId,
        spotNumberPrefix: bulkPrefix,
        count,
        floor: 0,
        spotType: bulkType,
        vehicleType: bulkVehicle,
        pricePerHour: Number(bulkPrice),
        isEVCharging: bulkType === 'EV',
        isHandicapped: false,
      });

      // Backend returns array of created spots
      const createdSpots = res.data || [];
      setSpots((prev) => [...prev, ...createdSpots]);

      setBulkLoading(false);
      setShowBulkModal(false);
      setBulkProgress(null);

      toast.success(`✅ ${createdSpots.length} spots added successfully!`);
    } catch (err) {
      setBulkLoading(false);
      setBulkProgress(null);
      const msg = err.response?.data?.message || 'Failed to add spots';
      toast.error(`❌ ${msg}`);
    }
  };

  // ── Filtered Spots ───────────────────────────────────────────────
  const filteredSpots = spots
    .filter((s) => typeFilter   === 'ALL' || s.spotType === typeFilter)
    .filter((s) => statusFilter === 'ALL' || s.status   === statusFilter)
    .filter((s) => {
      if (!search) return true;
      return s.spotNumber.toLowerCase().includes(search.toLowerCase());
    });

  // Status counts
  const counts = {
    AVAILABLE  : spots.filter((s) => s.status === 'AVAILABLE').length,
    RESERVED   : spots.filter((s) => s.status === 'RESERVED').length,
    OCCUPIED   : spots.filter((s) => s.status === 'OCCUPIED').length,
    MAINTENANCE: spots.filter((s) => s.status === 'MAINTENANCE').length,
  };

  if (loading) return <LoadingSpinner fullPage text="Loading spots..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchData} fullPage />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="Manage Spots"
        subtitle={`${lot?.name ?? ''} — ${spots.length} total spots`}
        showBack
        backTo={`/manager/lots/${lotId}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold
                         text-secondary border border-secondary/50 rounded-lg
                         hover:bg-secondary hover:text-white transition-colors"
            >
              <Layers size={15} />
              Bulk Add
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Spot
            </button>
          </div>
        }
      />

      {/* ── Occupancy Meter ── */}
      {lot && (
        <div className="card">
          <OccupancyMeter
            total={lot.totalSpots}
            available={lot.availableSpots}
            size="lg"
          />
        </div>
      )}

      {/* ── Status Summary Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter((prev) => prev === status ? 'ALL' : status)
            }
            className={`flex items-center justify-between px-4 py-3 rounded-xl
                        border-2 transition-all font-medium text-sm
                        ${STATUS_COUNT_COLORS[status]}
                        ${statusFilter === status
                          ? 'ring-2 ring-offset-1 ring-primary'
                          : 'hover:opacity-80'}`}
          >
            <span className="capitalize text-xs font-semibold">
              {status.toLowerCase()}
            </span>
            <span className="text-xl font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center
                      gap-3 flex-wrap">

        {/* Search */}
        <div className="relative w-full sm:w-48">
          <Search size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spot no..."
            className="input-field pl-8 py-1.5 text-sm"
          />
        </div>

        {/* Spot Type filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted font-medium mr-1">Type:</span>
          {SPOT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg
                          transition-colors border
                          ${typeFilter === type
                            ? 'bg-primary text-white border-primary'
                            : 'text-muted border-accent/40 hover:border-primary hover:text-primary'}`}
            >
              {type === 'ALL' ? 'All' : type}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchData}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted
                     hover:text-primary border border-accent/40 rounded-lg
                     px-3 py-1.5 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Spots Grid ── */}
      {filteredSpots.length === 0 ? (
        <EmptyState
          title={search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'No spots match your filters'
            : 'No spots added yet'}
          description={
            search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try clearing filters.'
              : 'Add spots individually or use Bulk Add to add multiple at once.'
          }
          action={
            !search && typeFilter === 'ALL' && statusFilter === 'ALL' ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={14} />
                Add First Spot
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted">
            Showing <span className="font-semibold text-gray-700">
              {filteredSpots.length}
            </span> of {spots.length} spots
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-4">
            {filteredSpots.map((spot) => (
              <SpotCard
                key={spot.spotId}
                spot={spot}
                onEdit={setEditingSpot}
                onDeleted={handleSpotDeleted}
                onUpdated={handleSpotUpdated}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Add Spot Modal ── */}
      {showAddModal && (
        <SpotFormModal
          mode="create"
          lotId={lotId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSpotAdded}
        />
      )}

      {/* ── Edit Spot Modal ── */}
      {editingSpot && (
        <SpotFormModal
          mode="edit"
          lotId={lotId}
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
          onSuccess={handleSpotUpdated}
        />
      )}

      {/* ── Bulk Add Modal ── */}
      {showBulkModal && (
        <Dialog open onOpenChange={() => !bulkLoading && setShowBulkModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary">
                🗂️ Bulk Add Spots
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted">
                Creates spots like <strong>A-01, A-02, ... A-10</strong>
              </p>

              {/* Prefix */}
              <div>
                <label className="label">Spot Prefix *</label>
                <input
                  type="text"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                  placeholder="e.g. A, B, P1"
                  className="input-field"
                />
              </div>

              {/* Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Number</label>
                  <input
                    type="number" min="1"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">End Number</label>
                  <input
                    type="number" min="1" max="50"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Preview */}
              {bulkPrefix && (
                <p className="text-xs text-secondary font-medium">
                  Preview: {bulkPrefix}-{String(bulkStart).padStart(2,'0')} →{' '}
                  {bulkPrefix}-{String(bulkEnd).padStart(2,'0')}{' '}
                  ({bulkEnd - bulkStart + 1} spots)
                </p>
              )}

              {/* Type + Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Spot Type</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value)}
                    className="input-field"
                  >
                    {['COMPACT','STANDARD','LARGE','MOTORBIKE','EV'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    value={bulkVehicle}
                    onChange={(e) => setBulkVehicle(e.target.value)}
                    className="input-field"
                  >
                    <option value="TWO_WHEELER">Two Wheeler</option>
                    <option value="FOUR_WHEELER">Four Wheeler</option>
                    <option value="HEAVY">Heavy</option>
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="label">Price Per Hour (₹)</label>
                <input
                  type="number" min="1" step="0.5"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Progress bar */}
              {bulkProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Adding spots...</span>
                    <span>{bulkProgress.done}/{bulkProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-accent/30 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-primary rounded-full transition-all duration-200"
                      style={{
                        width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-accent/30">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-600
                             bg-gray-100 rounded-lg hover:bg-gray-200
                             transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkLoading || !bulkPrefix || bulkEnd < bulkStart}
                  className="btn-primary flex items-center gap-2 px-5 py-2
                             disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white
                                      border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Layers size={15} />
                      Add {bulkEnd - bulkStart + 1} Spots
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}