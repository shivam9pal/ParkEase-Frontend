import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Car, ToggleLeft, ToggleRight,
  Pencil, Trash2, ArrowRight, ImageOff,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import { toggleLotOpen, deleteLot } from '../../api/lotApi';
import { formatTimeString } from '../../utils/formatDateTime';
import toast from 'react-hot-toast';

/**
 * LotCard — used in MyLotsPage grid
 * @param {object}   lot
 * @param {Function} onEdit    - opens edit modal
 * @param {Function} onDeleted - removes lot from parent list
 * @param {Function} onUpdated - updates lot in parent list
 */
export default function LotCard({ lot, onEdit, onDeleted, onUpdated }) {
  const navigate               = useNavigate();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ── Toggle Open/Close ─────────────────────────────────────────────
  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await toggleLotOpen(lot.lotId);
      onUpdated(res.data);
      toast.success(res.data.isOpen ? 'Lot opened ✅' : 'Lot closed 🔒');
    } catch {
      toast.error('Failed to toggle lot status.');
    } finally {
      setToggling(false);
    }
  };

  // ── Delete Lot ────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLot(lot.lotId);
      onDeleted(lot.lotId);
      toast.success(`"${lot.name}" has been deleted.`);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You can only delete your own lots.');
      } else {
        toast.error('Failed to delete lot. It may have active bookings.');
      }
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Occupancy percentage
  const occupied    = lot.totalSpots - lot.availableSpots;
  const occupancyPct = lot.totalSpots > 0
    ? Math.round((occupied / lot.totalSpots) * 100)
    : 0;
  const barColor = occupancyPct >= 90
    ? 'bg-red-500'
    : occupancyPct >= 70
    ? 'bg-yellow-500'
    : 'bg-green-500';

  return (
    <>
      <div className="card shadow-card hover:shadow-card-hover transition-shadow
                      duration-200 flex flex-col gap-4">

        {/* ── Lot Image ── */}
        <div className="relative h-36 rounded-lg overflow-hidden bg-background
                        border border-accent/30">
          {lot.imageUrl ? (
            <img
              src={lot.imageUrl}
              alt={lot.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center
                            justify-center gap-2">
              <ImageOff size={28} className="text-accent" />
              <p className="text-xs text-muted">No image</p>
            </div>
          )}

          {/* Approval badge overlay */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={lot.isApproved ? 'APPROVED' : 'PENDING'} />
          </div>

          {/* Open/Close overlay */}
          <div className="absolute top-2 right-2">
            <StatusBadge status={lot.isOpen ? 'OPEN' : 'CLOSED'} />
          </div>
        </div>

        {/* ── Info ── */}
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-gray-800 text-base leading-tight">
            {lot.name}
          </h3>

          <div className="flex items-start gap-1.5 text-xs text-muted">
            <MapPin size={12} className="mt-0.5 shrink-0 text-secondary" />
            <span className="line-clamp-1">{lot.address}, {lot.city}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} className="shrink-0 text-secondary" />
            <span>
              {formatTimeString(lot.openTime)} – {formatTimeString(lot.closeTime)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Car size={12} className="shrink-0 text-secondary" />
            <span>
              <span className="font-semibold text-green-600">{lot.availableSpots}</span>
              {' '}available /{' '}
              <span className="font-semibold text-gray-700">{lot.totalSpots}</span>
              {' '}total
            </span>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-accent/30 rounded-full overflow-hidden">
              <div
                className={`h-1.5 ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-[11px] text-muted text-right">
              {occupancyPct}% occupied
            </p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 pt-2 border-t border-accent/20">

          {/* View Details */}
          <button
            onClick={() => navigate(`/manager/lots/${lot.lotId}`)}
            className="btn-primary w-full flex items-center justify-center
                       gap-2 py-2 text-sm"
          >
            View Details
            <ArrowRight size={14} />
          </button>

          {/* Edit + Toggle + Delete */}
          <div className="grid grid-cols-3 gap-2">
            {/* Edit */}
            <button
              onClick={() => onEdit(lot)}
              className="flex items-center justify-center gap-1 py-1.5 text-xs
                         font-medium text-secondary border border-secondary/40
                         rounded-lg hover:bg-secondary hover:text-white
                         transition-colors"
            >
              <Pencil size={12} />
              Edit
            </button>

            {/* Toggle Open */}
            <button
              onClick={handleToggle}
              disabled={toggling || !lot.isApproved}
              title={!lot.isApproved ? 'Lot must be approved first' : ''}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs
                          font-medium rounded-lg border transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${lot.isOpen
                            ? 'border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white'
                            : 'border-green-300 text-green-600 hover:bg-green-500 hover:text-white'}`}
            >
              {toggling ? (
                <div className="w-3 h-3 border border-current border-t-transparent
                                rounded-full animate-spin" />
              ) : lot.isOpen ? (
                <><ToggleRight size={12} /> Close</>
              ) : (
                <><ToggleLeft size={12} /> Open</>
              )}
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center justify-center gap-1 py-1.5 text-xs
                         font-medium text-red-500 border border-red-200
                         rounded-lg hover:bg-red-500 hover:text-white
                         transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Parking Lot?"
        description={`"${lot.name}" will be permanently deleted. This cannot be undone. All spots and historical data will be removed.`}
        confirmLabel="Yes, Delete"
        variant="danger"
      />
    </>
  );
}