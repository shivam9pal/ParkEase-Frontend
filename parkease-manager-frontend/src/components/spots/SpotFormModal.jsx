import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Zap, Accessibility } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSpot, updateSpot } from '../../api/spotApi';

// ── Zod Schema ────────────────────────────────────────────────────────
const spotSchema = z.object({
  floor        : z.coerce.number().int('Floor must be an integer'),
  spotNumber   : z.string().min(1, 'Spot number is required').max(20),
  spotType     : z.enum(['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'],
                  { errorMap: () => ({ message: 'Select a spot type' }) }),
  vehicleType  : z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'HEAVY'],
                  { errorMap: () => ({ message: 'Select a vehicle type' }) }),
  pricePerHour : z.coerce.number().positive('Price must be greater than 0'),
  isEVCharging : z.boolean().default(false),
  isHandicapped: z.boolean().default(false),
});

const SPOT_TYPES    = ['COMPACT', 'STANDARD', 'LARGE', 'MOTORBIKE', 'EV'];
const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER',  label: '🏍️ Two Wheeler' },
  { value: 'FOUR_WHEELER', label: '🚗 Four Wheeler' },
  { value: 'HEAVY',        label: '🚛 Heavy Vehicle' },
];
const SPOT_TYPE_ICONS = {
  COMPACT : '🔹',
  STANDARD: '🔷',
  LARGE   : '🔶',
  MOTORBIKE: '🏍️',
  EV      : '⚡',
};

/**
 * SpotFormModal
 * @param {string}   mode     - "create" | "edit"
 * @param {string}   lotId    - parent lot ID
 * @param {object}   spot     - existing spot data (edit mode)
 * @param {Function} onClose
 * @param {Function} onSuccess
 */
export default function SpotFormModal({
  mode = 'create', lotId, spot, onClose, onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const isEdit                = mode === 'edit';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(spotSchema),
    defaultValues: isEdit && spot ? {
      floor        : spot.floor,
      spotNumber   : spot.spotNumber,
      spotType     : spot.spotType,
      vehicleType  : spot.vehicleType,
      pricePerHour : spot.pricePerHour,
      isEVCharging : spot.isEVCharging,
      isHandicapped: spot.isHandicapped,
    } : {
      floor        : 0,
      spotType     : 'STANDARD',
      vehicleType  : 'FOUR_WHEELER',
      isEVCharging : false,
      isHandicapped: false,
    },
  });

  const watchEV = watch('isEVCharging');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await updateSpot(spot.spotId, data);
        toast.success(`Spot ${data.spotNumber} updated ✅`);
      } else {
        res = await createSpot({ ...data, lotId });
        toast.success(`Spot ${data.spotNumber} added ✅`);
      }
      onSuccess(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You can only manage spots in your own lots.');
      } else if (err.response?.status === 409) {
        toast.error(`Spot number "${data.spotNumber}" already exists in this lot.`);
      } else {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} spot.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEdit ? '✏️ Edit Spot' : '➕ Add New Spot'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 mt-2">

          {/* Floor */}
          <div>
            <label className="label">Floor *</label>
            <div className="flex gap-3">
              <input
                {...register('floor')}
                type="number"
                placeholder="e.g. 0, 1, 2, -1 (Basement)"
                className={`input-field flex-1 ${errors.floor ? 'border-red-400' : ''}`}
              />
              <div className="text-xs text-muted space-y-1 pt-2">
                <p>0 = Ground</p>
                <p>1 = First</p>
                <p>-1 = Basement 1</p>
              </div>
            </div>
            {errors.floor && (
              <p className="text-xs text-red-500 mt-1">{errors.floor.message}</p>
            )}
          </div>

          {/* Spot Number */}
          <div>
            <label className="label">Spot Number *</label>
            <input
              {...register('spotNumber')}
              placeholder="e.g. A-01, B-12, P-005"
              className={`input-field ${errors.spotNumber ? 'border-red-400' : ''}`}
            />
            {errors.spotNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.spotNumber.message}</p>
            )}
          </div>

          {/* Spot Type */}
          <div>
            <label className="label">Spot Type *</label>
            <div className="grid grid-cols-5 gap-2">
              {SPOT_TYPES.map((type) => (
                <label
                  key={type}
                  className="cursor-pointer"
                >
                  <input
                    {...register('spotType')}
                    type="radio"
                    value={type}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center gap-1 p-2 border-2
                                  rounded-lg text-center transition-all
                                  border-accent/40 text-muted
                                  peer-checked:border-primary peer-checked:bg-primary/5
                                  peer-checked:text-primary hover:border-primary/50
                                  cursor-pointer">
                    <span className="text-base">{SPOT_TYPE_ICONS[type]}</span>
                    <span className="text-[10px] font-semibold leading-tight">
                      {type}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.spotType && (
              <p className="text-xs text-red-500 mt-1">{errors.spotType.message}</p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="label">Vehicle Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map(({ value, label }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    {...register('vehicleType')}
                    type="radio"
                    value={value}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center gap-1 p-2.5 border-2
                                  rounded-lg text-center transition-all
                                  border-accent/40 text-muted text-xs font-medium
                                  peer-checked:border-primary peer-checked:bg-primary/5
                                  peer-checked:text-primary hover:border-primary/50
                                  cursor-pointer">
                    {label}
                  </div>
                </label>
              ))}
            </div>
            {errors.vehicleType && (
              <p className="text-xs text-red-500 mt-1">{errors.vehicleType.message}</p>
            )}
          </div>

          {/* Price Per Hour */}
          <div>
            <label className="label">Price Per Hour (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-muted font-semibold text-sm">₹</span>
              <input
                {...register('pricePerHour')}
                type="number"
                min="1"
                step="0.50"
                placeholder="e.g. 50"
                className={`input-field pl-7
                  ${errors.pricePerHour ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.pricePerHour && (
              <p className="text-xs text-red-500 mt-1">
                {errors.pricePerHour.message}
              </p>
            )}
          </div>

          {/* Checkboxes: EV Charging + Handicapped */}
          <div className="grid grid-cols-2 gap-3">
            {/* EV Charging */}
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg
                               cursor-pointer transition-all
                               border-accent/40 hover:border-primary/50
                               has-[:checked]:border-yellow-400
                               has-[:checked]:bg-yellow-50">
              <input
                {...register('isEVCharging')}
                type="checkbox"
                className="w-4 h-4 accent-yellow-500"
              />
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-xs font-semibold text-gray-700">
                  EV Charging
                </span>
              </div>
            </label>

            {/* Handicapped */}
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg
                               cursor-pointer transition-all
                               border-accent/40 hover:border-primary/50
                               has-[:checked]:border-blue-400
                               has-[:checked]:bg-blue-50">
              <input
                {...register('isHandicapped')}
                type="checkbox"
                className="w-4 h-4 accent-blue-500"
              />
              <div className="flex items-center gap-1.5">
                <Accessibility size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-700">
                  Accessible
                </span>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-accent/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-gray-600
                         bg-gray-100 hover:bg-gray-200 rounded-lg
                         transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-5 py-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                  {isEdit ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                isEdit ? '💾 Save Spot' : '➕ Add Spot'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}