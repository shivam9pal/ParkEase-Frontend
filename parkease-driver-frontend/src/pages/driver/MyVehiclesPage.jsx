import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Car, Plus, Pencil, Trash2, X,
  Zap, CheckCircle2, AlertTriangle,
  Hash, Palette, Tag, Layers,
} from 'lucide-react';
import {
  getMyVehicles, createVehicle,
  updateVehicle, deleteVehicle,
} from '../../api/vehicleApi';
import { formatDate } from '../../utils/formatDateTime';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';

// ── Vehicle types ─────────────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  {
    value: 'TWO_WHEELER',
    label: '2-Wheeler',
    desc: 'Motorbike, Scooter',
    emoji: '🏍️',
    color: 'bg-amber-50 border-amber-300 text-amber-700',
    activeColor: 'bg-amber-100 border-amber-500',
  },
  {
    value: 'FOUR_WHEELER',
    label: '4-Wheeler',
    desc: 'Car, SUV, Sedan',
    emoji: '🚗',
    color: 'bg-[#EDE8F5] border-[#ADBBDA] text-[#3D52A0]',
    activeColor: 'bg-[#EDE8F5] border-[#3D52A0]',
  },
  {
    value: 'HEAVY',
    label: 'Heavy Vehicle',
    desc: 'Truck, Bus, Van',
    emoji: '🚛',
    color: 'bg-gray-50 border-gray-300 text-gray-700',
    activeColor: 'bg-gray-100 border-gray-500',
  },
];

// ── Zod schema ────────────────────────────────────────────────────────────────
const vehicleSchema = z.object({
  vehiclePlate: z
    .string()
    .min(4,  'Plate number must be at least 4 characters')
    .max(20, 'Plate number too long')
    .regex(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers allowed'),
  vehicleType: z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'HEAVY']),
  brand: z.string().max(50, 'Brand too long').optional().or(z.literal('')),
  model: z.string().max(50, 'Model too long').optional().or(z.literal('')),
  color: z.string().max(30, 'Color too long').optional().or(z.literal('')),
  isEV:  z.boolean(),
});

export default function MyVehiclesPage() {
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null); // vehicle obj | null
  const [saving,       setSaving]       = useState(false);
  const [deletingId,   setDeletingId]   = useState(null);
  const [plateInput,   setPlateInput]   = useState('');

  const {
    register, handleSubmit, watch, setValue,
    reset, formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehiclePlate: '',
      vehicleType:  'FOUR_WHEELER',
      brand: '', model: '', color: '',
      isEV: false,
    },
  });

  const selectedType = watch('vehicleType');
  const isEV         = watch('isEV');

  // ── Fetch vehicles ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMyVehicles();
        setVehicles(res.data);
      } catch {
        setError('Failed to load vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditTarget(null);
    setPlateInput('');
    reset({
      vehiclePlate: '',
      vehicleType:  'FOUR_WHEELER',
      brand: '', model: '', color: '',
      isEV: false,
    });
    setModalOpen(true);
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEditModal = (vehicle) => {
    setEditTarget(vehicle);
    // Backend returns licensePlate, make — map to frontend field names
    setPlateInput(vehicle.licensePlate ?? '');
    reset({
      vehiclePlate: vehicle.licensePlate ?? '',
      vehicleType:  vehicle.vehicleType  ?? 'FOUR_WHEELER',
      brand:        vehicle.make  ?? '',
      model:        vehicle.model  ?? '',
      color:        vehicle.color  ?? '',
      isEV:         vehicle.isEV   ?? false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setPlateInput('');
  };

  // ── Plate input handler — force uppercase ─────────────────────────────────
  const handlePlateChange = (e) => {
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlateInput(upper);
    setValue('vehiclePlate', upper, { shouldValidate: true });
  };

  // ── Submit: create or update ──────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        vehiclePlate: data.vehiclePlate,
        vehicleType:  data.vehicleType,
        brand:  data.brand  || undefined,
        model:  data.model  || undefined,
        color:  data.color  || undefined,
        isEV:   data.isEV,
      };

      if (editTarget) {
        // Update
        const res = await updateVehicle(editTarget.vehicleId, payload);
        setVehicles((prev) =>
          prev.map((v) =>
            v.vehicleId === editTarget.vehicleId ? res.data : v
          )
        );
        toast.success('Vehicle updated! 🚗');
      } else {
        // Create
        const res = await createVehicle(payload);
        setVehicles((prev) => [...prev, res.data]);
        toast.success('Vehicle added! 🎉');
      }
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('plate') ||
          msg.toLowerCase().includes('already')) {
        toast.error('This plate number is already registered.');
      } else {
        toast.error(msg || 'Failed to save vehicle. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete vehicle ────────────────────────────────────────────────────────
  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Remove this vehicle? You can always re-add it later.'))
      return;
    setDeletingId(vehicleId);
    try {
      await deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.vehicleId !== vehicleId));
      toast.success('Vehicle removed.');
    } catch {
      toast.error('Failed to remove vehicle. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your vehicles..." />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center 
                      sm:justify-between gap-3">
        <div>
          <h1 className="page-title">My Vehicles</h1>
          <p className="page-subtitle">
            Manage the vehicles linked to your account
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────── */}
      <div className="bg-[#EDE8F5] border border-[#ADBBDA] rounded-2xl 
                      p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#7091E6] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#3D52A0]">
          <strong>Tip:</strong> Make sure your vehicle type matches the parking 
          spot type when booking. EV vehicles should book EV-charging spots 
          for charging support.
        </p>
      </div>

      {/* ── Vehicles Grid ──────────────────────────────────────────────── */}
      {vehicles.length === 0 ? (
        <div className="card flex flex-col items-center justify-center 
                        py-20 text-center border-dashed border-2 
                        border-[#ADBBDA]">
          <div className="w-20 h-20 bg-[#EDE8F5] rounded-3xl flex items-center 
                          justify-center mb-5">
            <Car className="w-10 h-10 text-[#8697C4]" />
          </div>
          <h3 className="font-bold text-[#3D52A0] text-lg mb-2">
            No vehicles added yet
          </h3>
          <p className="text-[#8697C4] text-sm mb-6 max-w-xs">
            Add your vehicles to make booking faster. 
            Your plate, type, and EV status are used to match 
            the right parking spots.
          </p>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.vehicleId}
              vehicle={vehicle}
              deleting={deletingId === vehicle.vehicleId}
              onEdit={() => openEditModal(vehicle)}
              onDelete={() => handleDelete(vehicle.vehicleId)}
            />
          ))}

          {/* Add vehicle card */}
          <button
            onClick={openAddModal}
            className="border-2 border-dashed border-[#ADBBDA] rounded-2xl 
                       p-6 flex flex-col items-center justify-center gap-3
                       text-[#8697C4] hover:text-[#3D52A0] 
                       hover:border-[#3D52A0] hover:bg-[#EDE8F5]/50
                       transition-all duration-200 min-h-[200px]"
          >
            <div className="w-14 h-14 bg-[#EDE8F5] rounded-2xl flex items-center 
                            justify-center">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Add Vehicle</p>
              <p className="text-xs text-[#ADBBDA] mt-0.5">
                Car, Bike, Truck...
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center 
                     p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg 
                       max-h-[90vh] overflow-y-auto
                       animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 
                            border-b border-[#EDE8F5]">
              <div>
                <h3 className="text-xl font-black text-[#3D52A0]">
                  {editTarget ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h3>
                <p className="text-xs text-[#8697C4] mt-0.5">
                  {editTarget
                    ? 'Update your vehicle details'
                    : 'Fill in your vehicle information'
                  }
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-[#8697C4] 
                           hover:text-[#3D52A0] hover:bg-[#EDE8F5] 
                           transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

              {/* ── Vehicle Plate ─────────────────────────────────── */}
              <div>
                <label className="form-label">
                  Vehicle Plate Number *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#8697C4]" />
                  <input
                    type="text"
                    value={plateInput}
                    onChange={handlePlateChange}
                    placeholder="DL01AB1234"
                    maxLength={20}
                    className={`form-input pl-10 font-mono tracking-widest 
                                uppercase text-lg font-bold
                                ${errors.vehiclePlate
                                  ? 'border-red-400 focus:ring-red-300' : ''
                                }`}
                  />
                </div>
                {errors.vehiclePlate ? (
                  <p className="form-error">{errors.vehiclePlate.message}</p>
                ) : (
                  <p className="text-xs text-[#8697C4] mt-1.5">
                    Only uppercase letters and numbers — no spaces or hyphens
                  </p>
                )}
              </div>

              {/* ── Vehicle Type ──────────────────────────────────── */}
              <div>
                <label className="form-label">Vehicle Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {VEHICLE_TYPES.map(
                    ({ value, label, desc, emoji, color, activeColor }) => (
                      <label
                        key={value}
                        className={`flex flex-col items-center text-center 
                                    gap-2 p-4 rounded-2xl border-2 
                                    cursor-pointer transition-all duration-200
                                    ${selectedType === value
                                      ? activeColor
                                      : `${color} hover:border-[#7091E6]`
                                    }`}
                      >
                        <input
                          type="radio"
                          value={value}
                          {...register('vehicleType')}
                          className="sr-only"
                        />
                        <span className="text-3xl">{emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-[#3D52A0]">
                            {label}
                          </p>
                          <p className="text-[10px] text-[#8697C4]">
                            {desc}
                          </p>
                        </div>
                        {selectedType === value && (
                          <CheckCircle2 className="w-4 h-4 text-[#3D52A0]" />
                        )}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* ── Optional Details Row ──────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">
                    Brand
                    <span className="text-[#8697C4] font-normal ml-1">
                      (opt)
                    </span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 
                                    w-4 h-4 text-[#8697C4]" />
                    <input
                      type="text"
                      placeholder="Toyota"
                      {...register('brand')}
                      className="form-input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">
                    Model
                    <span className="text-[#8697C4] font-normal ml-1">
                      (opt)
                    </span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 
                                       w-4 h-4 text-[#8697C4]" />
                    <input
                      type="text"
                      placeholder="Fortuner"
                      {...register('model')}
                      className="form-input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">
                    Color
                    <span className="text-[#8697C4] font-normal ml-1">
                      (opt)
                    </span>
                  </label>
                  <div className="relative">
                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 
                                        w-4 h-4 text-[#8697C4]" />
                    <input
                      type="text"
                      placeholder="Silver"
                      {...register('color')}
                      className="form-input pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* ── EV Toggle ─────────────────────────────────────── */}
              <div>
                <div
                  className={`flex items-center justify-between gap-4 p-4 
                              rounded-2xl border-2 
                              transition-all duration-200
                              ${isEV
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-[#ADBBDA] hover:border-[#7091E6]'
                              }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center 
                                    justify-center transition-colors
                                    ${isEV
                                      ? 'bg-emerald-100'
                                      : 'bg-[#EDE8F5]'
                                    }`}>
                      <Zap className={`w-5 h-5 transition-colors
                                      ${isEV
                                        ? 'text-emerald-600'
                                        : 'text-[#8697C4]'
                                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#3D52A0]">
                        Electric Vehicle (EV)
                      </p>
                      <p className="text-xs text-[#8697C4]">
                        Enables EV charging spot booking
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      {...register('isEV')}
                      className="sr-only"
                      id="isEV"
                    />
                  </label>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => setValue('isEV', !isEV)}
                    className="flex-shrink-0 flex items-center"
                  >
                    <div
                      className={`w-12 h-6 rounded-full cursor-pointer 
                                  transition-all duration-300 relative
                                  ${isEV ? 'bg-emerald-500' : 'bg-[#ADBBDA]'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white 
                                    rounded-full shadow-sm transition-all 
                                    duration-300
                                    ${isEV ? 'left-7' : 'left-1'}`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Submit ────────────────────────────────────────── */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center 
                             justify-center gap-2 py-3"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full 
                                      border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editTarget ? 'Save Changes' : 'Add Vehicle'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, deleting, onEdit, onDelete }) {
  const typeConfig = {
    TWO_WHEELER:  { emoji: '🏍️', label: '2-Wheeler', bg: 'bg-amber-50',
                    border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    FOUR_WHEELER: { emoji: '🚗', label: '4-Wheeler', bg: 'bg-[#EDE8F5]',
                    border: 'border-[#ADBBDA]', badge: 'bg-[#EDE8F5] text-[#3D52A0]' },
    HEAVY:        { emoji: '🚛', label: 'Heavy',     bg: 'bg-gray-50',
                    border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' },
  }[vehicle.vehicleType] ?? {
    emoji: '🚙', label: vehicle.vehicleType,
    bg: 'bg-[#EDE8F5]', border: 'border-[#ADBBDA]',
    badge: 'bg-[#EDE8F5] text-[#3D52A0]',
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${typeConfig.border} 
                     shadow-card hover:shadow-card-hover 
                     transition-all duration-200 overflow-hidden`}>

      {/* Card header */}
      <div className={`${typeConfig.bg} px-5 pt-5 pb-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{typeConfig.emoji}</span>
            <div>
              {/* Plate */}
              <p className="text-xl font-black text-[#3D52A0] 
                            font-mono tracking-widest leading-tight">
                {vehicle.vehiclePlate}
              </p>
              {/* Brand + Model */}
              {(vehicle.brand || vehicle.model) && (
                <p className="text-xs text-[#8697C4] font-medium mt-0.5">
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>

          {/* Edit + Delete */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 rounded-xl text-[#8697C4] hover:text-[#3D52A0] 
                         hover:bg-white/60 transition-all duration-200"
              title="Edit vehicle"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-xl text-[#8697C4] hover:text-red-500 
                         hover:bg-red-50 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove vehicle"
            >
              {deleting ? (
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-red-300 border-t-red-500" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 
                           rounded-full ${typeConfig.badge}`}>
            {typeConfig.label}
          </span>

          {vehicle.isEV && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full 
                             bg-emerald-100 text-emerald-700 
                             flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Electric
            </span>
          )}

          {vehicle.color && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full 
                             bg-[#EDE8F5] text-[#8697C4]">
              {vehicle.color}
            </span>
          )}
        </div>

        {/* Added date */}
        <p className="text-xs text-[#ADBBDA] font-medium">
          Added {formatDate(vehicle.createdAt)}
        </p>
      </div>
    </div>
  );
}