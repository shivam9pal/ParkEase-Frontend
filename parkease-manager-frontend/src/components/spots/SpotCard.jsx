import { useState } from 'react';
import { Pencil, Trash2, Wrench, CheckCircle2, Zap, Accessibility } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import { deleteSpot, setSpotMaintenance } from '../../api/spotApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const SPOT_TYPE_ICONS = {
  COMPACT : '🔹',
  STANDARD: '🔷',
  LARGE   : '🔶',
  MOTORBIKE:'🏍️',
  EV      : '⚡',
};

const VEHICLE_TYPE_LABELS = {
  TWO_WHEELER : '🏍️ Two Wheeler',
  FOUR_WHEELER: '🚗 Four Wheeler',
  HEAVY       : '🚛 Heavy',
};

const STATUS_BG = {
  AVAILABLE  : 'border-green-200 bg-green-50/30',
  RESERVED   : 'border-blue-200 bg-blue-50/30',
  OCCUPIED   : 'border-red-200 bg-red-50/30',
  MAINTENANCE: 'border-gray-200 bg-gray-50/30',
};

/**
 * SpotCard
 * @param {object}   spot
 * @param {Function} onEdit
 * @param {Function} onDeleted
 * @param {Function} onUpdated
 */
export default function SpotCard({ spot, onEdit, onDeleted, onUpdated }) {
  const [loading, setLoading]             = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // ── Toggle Maintenance Status ───────────────────────────────────
  // Single toggle endpoint: AVAILABLE ↔ MAINTENANCE
  const handleToggleMaintenance = async () => {
    setLoading(true);
    try {
      const res = await setSpotMaintenance(spot.spotId);
      const newStatus = res.data.status;
      onUpdated(res.data);
      
      if (newStatus === 'MAINTENANCE') {
        toast.success(`Spot ${spot.spotNumber} set to Maintenance 🔧`);
      } else if (newStatus === 'AVAILABLE') {
        toast.success(`Spot ${spot.spotNumber} is now Available ✅`);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Cannot change status — spot is currently reserved or occupied.');
      } else {
        toast.error('Failed to update maintenance status.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Delete Spot ──────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSpot(spot.spotId);
      onDeleted(spot.spotId);
      toast.success(`Spot ${spot.spotNumber} deleted.`);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Cannot delete — spot is currently reserved or occupied.');
      } else {
        toast.error('Failed to delete spot.');
      }
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className={`card border-2 ${STATUS_BG[spot.status] ?? ''}
                       hover:shadow-card-hover transition-shadow duration-200
                       flex flex-col gap-3`}>

        {/* ── Header: Spot Number + Status ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {SPOT_TYPE_ICONS[spot.spotType] ?? '🔷'}
            </span>
            <div>
              <p className="text-xl font-bold text-gray-800 leading-tight">
                {spot.spotNumber}
              </p>
              <p className="text-xs text-muted">{spot.spotType}</p>
            </div>
          </div>
          <StatusBadge status={spot.status} />
        </div>

        {/* ── Details ── */}
        <div className="space-y-2">
          {/* Vehicle type */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted text-xs">Vehicle</span>
            <span className="text-gray-700 font-medium text-xs">
              {VEHICLE_TYPE_LABELS[spot.vehicleType] ?? spot.vehicleType}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted text-xs">Rate</span>
            <span className="font-bold text-primary">
              {formatCurrency(spot.pricePerHour)}
              <span className="text-xs text-muted font-normal">/hr</span>
            </span>
          </div>
        </div>

        {/* ── Feature Badges ── */}
        {(spot.isEVCharging || spot.isHandicapped) && (
          <div className="flex items-center gap-2">
            {spot.isEVCharging && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                               bg-yellow-100 text-yellow-700 text-[10px] font-semibold
                               border border-yellow-200">
                <Zap size={10} />
                EV Charging
              </span>
            )}
            {spot.isHandicapped && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                               bg-blue-100 text-blue-700 text-[10px] font-semibold
                               border border-blue-200">
                <Accessibility size={10} />
                Accessible
              </span>
            )}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="pt-2 border-t border-accent/20 grid grid-cols-3 gap-2">

          {/* Edit */}
          <button
            onClick={() => onEdit(spot)}
            disabled={loading}
            className="flex items-center justify-center gap-1 py-1.5 text-xs
                       font-medium text-secondary border border-secondary/40
                       rounded-lg hover:bg-secondary hover:text-white
                       transition-colors disabled:opacity-40"
          >
            <Pencil size={11} />
            Edit
          </button>

          {/* Maintenance / Restore Toggle */}
          {(spot.status === 'AVAILABLE' || spot.status === 'MAINTENANCE') && (
            <button
              onClick={handleToggleMaintenance}
              disabled={loading}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs
                         font-medium border rounded-lg transition-colors disabled:opacity-40
                         ${
                           spot.status === 'AVAILABLE'
                             ? 'text-orange-600 border-orange-200 hover:bg-orange-500'
                             : 'text-green-600 border-green-200 hover:bg-green-500'
                         } hover:text-white`}
            >
              {loading ? (
                <div className="w-3 h-3 border border-current border-t-transparent
                                rounded-full animate-spin" />
              ) : spot.status === 'AVAILABLE' ? (
                <><Wrench size={11} /> Maint.</>
              ) : (
                <><CheckCircle2 size={11} /> Restore</>
              )}
            </button>
          )}

          {/* Reserved/Occupied — no action available */}
          {(spot.status === 'RESERVED' || spot.status === 'OCCUPIED') && (
            <div className="flex items-center justify-center py-1.5 text-[10px]
                            text-muted border border-accent/20 rounded-lg
                            bg-background/50">
              In Use
            </div>
          )}

          {/* Delete (only AVAILABLE spots) */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={spot.status !== 'AVAILABLE' || loading}
            title={spot.status !== 'AVAILABLE'
              ? 'Can only delete available spots'
              : 'Delete spot'}
            className="flex items-center justify-center gap-1 py-1.5 text-xs
                       font-medium text-red-500 border border-red-200
                       rounded-lg hover:bg-red-500 hover:text-white
                       transition-colors disabled:opacity-30
                       disabled:cursor-not-allowed"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      </div>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Spot?"
        description={`Spot "${spot.spotNumber}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Spot"
        variant="danger"
      />
    </>
  );
}