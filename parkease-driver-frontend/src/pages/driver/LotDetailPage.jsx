import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, Car, Zap, Accessibility,
  X, ChevronLeft, AlertTriangle, CheckCircle2,
  Layers, Info,
} from 'lucide-react';
import { getLotById }    from '../../api/lotApi';
import { getSpotsByLot } from '../../api/spotApi';
import { getMyVehicles } from '../../api/vehicleApi';
import { createBooking } from '../../api/bookingApi';
import { formatCurrency }    from '../../utils/formatCurrency';
import { formatDateTime, toBackendDateTime } from '../../utils/formatDateTime';
import StatusBadge       from '../../components/booking/StatusBadge';
import LoadingSpinner    from '../../components/common/LoadingSpinner';
import ErrorMessage      from '../../components/common/ErrorMessage';

// ── Spot type display map ──────────────────────────────────────────────────────
const SPOT_TYPE_MAP = {
  COMPACT:  { label: 'Compact',   color: 'bg-purple-100 text-purple-700' },
  STANDARD: { label: 'Standard',  color: 'bg-blue-100 text-[#7091E6]'   },
  LARGE:    { label: 'Large',     color: 'bg-green-100 text-green-700'   },
  MOTORBIKE:{ label: 'Motorbike', color: 'bg-amber-100 text-amber-700'   },
  EV:       { label: 'EV',        color: 'bg-emerald-100 text-emerald-700'},
};

const VEHICLE_TYPE_LABEL = {
  TWO_WHEELER:  '2-Wheeler',
  FOUR_WHEELER: '4-Wheeler',
  HEAVY:        'Heavy',
};

// ── Spot status → style ───────────────────────────────────────────────────────
const SPOT_STATUS_STYLE = {
  AVAILABLE:   'border-green-400 bg-green-50 hover:border-green-600 cursor-pointer',
  RESERVED:    'border-amber-400 bg-amber-50 cursor-not-allowed opacity-70',
  OCCUPIED:    'border-red-400   bg-red-50   cursor-not-allowed opacity-70',
  MAINTENANCE: 'border-gray-300  bg-gray-100 cursor-not-allowed opacity-60',
};

// ── Booking form schema ───────────────────────────────────────────────────────
const bookingSchema = z.object({
  vehicleId:   z.string().min(1, 'Please select a vehicle'),
  bookingType: z.enum(['PRE_BOOKING', 'WALK_IN']),
  startTime:   z.string().optional(),
  endTime:     z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.bookingType === 'PRE_BOOKING') {
    if (!data.startTime) {
      ctx.addIssue({
        path: ['startTime'],
        message: 'Start time is required for pre-booking',
        code: z.ZodIssueCode.custom,
      });
    } else if (new Date(data.startTime) <= new Date()) {
      ctx.addIssue({
        path: ['startTime'],
        message: 'Start time must be in the future',
        code: z.ZodIssueCode.custom,
      });
    }
    if (!data.endTime) {
      ctx.addIssue({
        path: ['endTime'],
        message: 'End time is required for pre-booking',
        code: z.ZodIssueCode.custom,
      });
    } else if (data.startTime && new Date(data.endTime) <= new Date(data.startTime)) {
      ctx.addIssue({
        path: ['endTime'],
        message: 'End time must be after start time',
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

// ── Min datetime-local value (now + 5 min) ────────────────────────────────────
const getMinDateTime = () => {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

export default function LotDetailPage() {
  const { lotId } = useParams();
  const navigate  = useNavigate();

  const [lot,          setLot]          = useState(null);
  const [spots,        setSpots]        = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── Booking modal state ───────────────────────────────────────────────────
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [booking,      setBooking]      = useState(false);
  const [evWarning,    setEvWarning]    = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [typeFilter,   setTypeFilter]   = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { bookingType: 'PRE_BOOKING' },
  });

  const bookingType   = watch('bookingType');
  const watchVehicleId = watch('vehicleId');

  // ── EV warning check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!watchVehicleId || !selectedSpot) {
      setEvWarning(false);
      return;
    }
    const vehicle = vehicles.find((v) => v.vehicleId === watchVehicleId);
    if (vehicle?.isEV && !selectedSpot.isEVCharging) {
      setEvWarning(true);
    } else {
      setEvWarning(false);
    }
  }, [watchVehicleId, selectedSpot, vehicles]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [lotRes, spotsRes, vehiclesRes] = await Promise.all([
          getLotById(lotId),
          getSpotsByLot(lotId),
          getMyVehicles(),
        ]);
        setLot(lotRes.data);
        setSpots(spotsRes.data);
        setVehicles(vehiclesRes.data);
      } catch {
        setError('Failed to load lot details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [lotId]);

  // ── Open booking modal ────────────────────────────────────────────────────
  const openBookingModal = (spot) => {
    if (spot.status !== 'AVAILABLE') return;
    setSelectedSpot(spot);
    reset({ bookingType: 'PRE_BOOKING', vehicleId: '', startTime: '', endTime: '' });
    setEvWarning(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSpot(null);
    setEvWarning(false);
  };

  // ── WALK_IN: auto-set times ───────────────────────────────────────────────
  useEffect(() => {
    if (bookingType === 'WALK_IN') {
      const now    = new Date();
      const startTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes ahead
      const twoHrs = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Format as local datetime string (without timezone conversion)
      const formatLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${min}`;
      };
      
      setValue('startTime', formatLocal(startTime));
      setValue('endTime',   formatLocal(twoHrs));
    }
  }, [bookingType, setValue]);

  // ── Submit booking ────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (evWarning) return;

    // Validate vehicle type matches spot
    const vehicle = vehicles.find((v) => v.vehicleId === data.vehicleId);
    if (vehicle && vehicle.vehicleType !== selectedSpot.vehicleType) {
      toast.error(
        `This spot requires a ${VEHICLE_TYPE_LABEL[selectedSpot.vehicleType]}. ` +
        `Your vehicle is a ${VEHICLE_TYPE_LABEL[vehicle.vehicleType]}.`
      );
      return;
    }

    setBooking(true);
    try {
      const payload = {
        spotId:      selectedSpot.spotId,
        vehicleId:   data.vehicleId,
        bookingType: data.bookingType,
        startTime:   toBackendDateTime(data.startTime),
        endTime:     toBackendDateTime(data.endTime),
      };

      const res = await createBooking(payload);
      toast.success('Booking confirmed! 🅿️');
      closeModal();
      navigate(`/driver/bookings/${res.data.bookingId}`);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? '';
      if (status === 409) {
        toast.error('Spot no longer available. Please choose another.');
      } else {
        toast.error(msg || 'Booking failed. Please try again.');
      }
    } finally {
      setBooking(false);
    }
  };

  // ── Filtered spots ────────────────────────────────────────────────────────
  const filteredSpots = spots.filter((s) => {
    const typeOk   = typeFilter   === 'ALL' || s.spotType   === typeFilter;
    const statusOk = statusFilter === 'ALL' || s.status === statusFilter;
    return typeOk && statusOk;
  });

  const availableCount = spots.filter((s) => s.status === 'AVAILABLE').length;

  if (loading) return <LoadingSpinner text="Loading lot details..." />;
  if (error)   return <ErrorMessage message={error} />;
  if (!lot)    return <ErrorMessage message="Lot not found." />;

  return (
    <div className="space-y-6">

      {/* ── Back button ────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold 
                   text-[#7091E6] hover:text-[#3D52A0] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Search
      </button>

      {/* ── Lot Info Card ─────────────────────────────────────────────── */}
      <div className="card overflow-hidden !p-0">

        {/* Lot image */}
        {lot.imageUrl ? (
          <div className="h-48 md:h-64 overflow-hidden">
            <img
              src={lot.imageUrl}
              alt={lot.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-hero-gradient flex items-center 
                          justify-center">
            <div className="text-center">
              <Layers className="w-10 h-10 text-white/50 mx-auto mb-2" />
              <p className="text-white/60 text-sm">No image available</p>
            </div>
          </div>
        )}

        {/* Lot details */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start 
                          sm:justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl font-black text-[#3D52A0] mb-1">
                {lot.name}
              </h1>
              <p className="text-[#8697C4] flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {lot.address}, {lot.city}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={lot.isOpen ? 'OPEN' : 'CLOSED'} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              {
                icon: Car,
                label: 'Available',
                value: `${availableCount} / ${lot.totalSpots}`,
                color: availableCount > 0 ? 'text-green-600' : 'text-red-500',
                bg:    availableCount > 0 ? 'bg-green-50'    : 'bg-red-50',
              },
              {
                icon: Clock,
                label: 'Hours',
                value: `${lot.openTime?.slice(0,5)} – ${lot.closeTime?.slice(0,5)}`,
                color: 'text-[#3D52A0]',
                bg:    'bg-[#EDE8F5]',
              },
              {
                icon: Zap,
                label: 'EV Spots',
                value: spots.filter((s) => s.isEVCharging).length,
                color: 'text-emerald-600',
                bg:    'bg-emerald-50',
              },
              {
                icon: Accessibility,
                label: 'Accessible',
                value: spots.filter((s) => s.isHandicapped).length,
                color: 'text-[#7091E6]',
                bg:    'bg-blue-50',
              },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label}
                className={`${bg} rounded-xl p-3 flex flex-col gap-1`}>
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-[10px] text-[#8697C4] font-medium">
                  {label}
                </p>
                <p className={`text-sm font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#8697C4] font-medium">
                Lot Occupancy
              </span>
              <span className="text-xs font-bold text-[#3D52A0]">
                {lot.totalSpots > 0
                  ? Math.round(
                      ((lot.totalSpots - availableCount) / lot.totalSpots) * 100
                    )
                  : 0}%
              </span>
            </div>
            <div className="h-2.5 bg-[#EDE8F5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                           ${availableCount === 0
                             ? 'bg-red-500'
                             : availableCount < lot.totalSpots * 0.2
                               ? 'bg-amber-500'
                               : 'bg-[#3D52A0]'
                           }`}
                style={{
                  width: `${lot.totalSpots > 0
                    ? ((lot.totalSpots - availableCount) / lot.totalSpots) * 100
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Spot Grid ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center 
                        sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-black text-[#3D52A0]">
              Available Spots
            </h2>
            <p className="text-xs text-[#8697C4] mt-0.5">
              Click an available spot to book
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input !py-1.5 !px-3 text-xs w-auto"
            >
              <option value="ALL">All Types</option>
              {['COMPACT','STANDARD','LARGE','MOTORBIKE','EV'].map((t) => (
                <option key={t} value={t}>
                  {SPOT_TYPE_MAP[t]?.label ?? t}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input !py-1.5 !px-3 text-xs w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { color: 'bg-green-200 border-green-400', label: 'Available'   },
            { color: 'bg-amber-100 border-amber-400', label: 'Reserved'    },
            { color: 'bg-red-100   border-red-400',   label: 'Occupied'    },
            { color: 'bg-gray-100  border-gray-300',  label: 'Maintenance' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded border-2 ${color}`} />
              <span className="text-xs text-[#8697C4]">{label}</span>
            </div>
          ))}
        </div>

        {/* No spots */}
        {filteredSpots.length === 0 ? (
          <div className="card flex flex-col items-center justify-center 
                          py-12 text-center border-dashed">
            <Car className="w-10 h-10 text-[#ADBBDA] mb-3" />
            <p className="font-semibold text-[#3D52A0]">No spots found</p>
            <p className="text-sm text-[#8697C4] mt-1">
              Try changing the filters above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 
                          lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredSpots.map((spot) => (
              <SpotCard
                key={spot.spotId}
                spot={spot}
                onClick={() => openBookingModal(spot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Modal ─────────────────────────────────────────────── */}
      {modalOpen && selectedSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center 
                        p-4 bg-black/50 backdrop-blur-sm"
             onClick={closeModal}>
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
                <h3 className="text-lg font-black text-[#3D52A0]">
                  Book Spot {selectedSpot.spotNumber}
                </h3>
                <p className="text-xs text-[#8697C4] mt-0.5">
                  {SPOT_TYPE_MAP[selectedSpot.spotType]?.label} ·{' '}
                  {VEHICLE_TYPE_LABEL[selectedSpot.vehicleType]} ·{' '}
                  {formatCurrency(selectedSpot.pricePerHour)}/hr
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

            {/* Spot badges */}
            <div className="px-6 pt-4 flex gap-2 flex-wrap">
              {selectedSpot.isEVCharging && (
                <span className="inline-flex items-center gap-1.5 text-xs 
                                 font-semibold bg-emerald-50 text-emerald-700 
                                 border border-emerald-200 px-3 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  EV Charging
                </span>
              )}
              {selectedSpot.isHandicapped && (
                <span className="inline-flex items-center gap-1.5 text-xs 
                                 font-semibold bg-blue-50 text-[#7091E6] 
                                 border border-[#ADBBDA] px-3 py-1 rounded-full">
                  <Accessibility className="w-3 h-3" />
                  Accessible
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-xs 
                               font-semibold px-3 py-1 rounded-full 
                               border ${SPOT_TYPE_MAP[selectedSpot.spotType]?.color}`}>
                {SPOT_TYPE_MAP[selectedSpot.spotType]?.label}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

              {/* Booking Type */}
              <div>
                <label className="form-label">Booking Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      val: 'PRE_BOOKING',
                      label: 'Pre-Booking',
                      desc: 'Reserve in advance',
                    },
                    {
                      val: 'WALK_IN',
                      label: 'Walk-In',
                      desc: 'Park right now',
                    },
                  ].map(({ val, label, desc }) => (
                    <label
                      key={val}
                      className={`flex items-start gap-3 p-3.5 rounded-xl 
                                  border-2 cursor-pointer transition-all
                                  ${bookingType === val
                                    ? 'border-[#3D52A0] bg-[#EDE8F5]'
                                    : 'border-[#ADBBDA] hover:border-[#7091E6]'
                                  }`}
                    >
                      <input
                        type="radio"
                        value={val}
                        {...register('bookingType')}
                        className="mt-0.5 accent-[#3D52A0]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#3D52A0]">
                          {label}
                        </p>
                        <p className="text-xs text-[#8697C4]">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vehicle Select */}
              <div>
                <label className="form-label">Select Vehicle</label>
                {vehicles.length === 0 ? (
                  <div className="flex items-start gap-3 bg-amber-50 
                                  border border-amber-200 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 
                                             flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">
                        No vehicles found
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          closeModal();
                          navigate('/driver/vehicles');
                        }}
                        className="text-sm text-[#3D52A0] font-semibold 
                                   underline mt-1"
                      >
                        Add a vehicle first →
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      {...register('vehicleId')}
                      className={`form-input ${
                        errors.vehicleId
                          ? 'border-red-400 focus:ring-red-300' : ''
                      }`}
                    >
                      <option value="">Choose your vehicle...</option>
                      {vehicles
                        .filter((v) => v.isActive !== false)
                        .map((v) => (
                          <option key={v.vehicleId} value={v.vehicleId}>
                            {v.vehiclePlate}
                            {v.brand ? ` — ${v.brand}` : ''}
                            {v.model ? ` ${v.model}` : ''}
                            {` (${VEHICLE_TYPE_LABEL[v.vehicleType]})`}
                            {v.isEV ? ' ⚡' : ''}
                          </option>
                        ))}
                    </select>
                    {errors.vehicleId && (
                      <p className="form-error">{errors.vehicleId.message}</p>
                    )}
                  </>
                )}
              </div>

              {/* EV Warning */}
              {evWarning && (
                <div className="flex items-start gap-3 bg-amber-50 
                                border border-amber-300 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 
                                           flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 font-medium">
                    This spot does not support EV charging. 
                    Please select a different spot or vehicle.
                  </p>
                </div>
              )}

              {/* Pre-booking times */}
              {bookingType === 'PRE_BOOKING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Time</label>
                    <input
                      type="datetime-local"
                      min={getMinDateTime()}
                      {...register('startTime')}
                      className={`form-input ${
                        errors.startTime
                          ? 'border-red-400 focus:ring-red-300' : ''
                      }`}
                    />
                    {errors.startTime && (
                      <p className="form-error">
                        {errors.startTime.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">End Time</label>
                    <input
                      type="datetime-local"
                      min={getMinDateTime()}
                      {...register('endTime')}
                      className={`form-input ${
                        errors.endTime
                          ? 'border-red-400 focus:ring-red-300' : ''
                      }`}
                    />
                    {errors.endTime && (
                      <p className="form-error">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Walk-in info */}
              {bookingType === 'WALK_IN' && (
                <div className="flex items-start gap-3 bg-[#EDE8F5] 
                                border border-[#ADBBDA] rounded-xl p-4">
                  <Info className="w-5 h-5 text-[#7091E6] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#3D52A0] font-medium">
                    Walk-in booking will start now and end in 2 hours. 
                    You can extend later from your booking details.
                  </p>
                </div>
              )}

              {/* Price estimate (PRE_BOOKING) */}
              {bookingType === 'PRE_BOOKING' &&
                watch('startTime') && watch('endTime') &&
                new Date(watch('endTime')) > new Date(watch('startTime')) && (
                  <div className="bg-[#3D52A0] rounded-xl p-4 
                                  flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
                        Estimated Total
                      </p>
                      <p className="text-xl font-black text-white">
                        {formatCurrency(
                          Math.max(1,
                            (new Date(watch('endTime')) -
                              new Date(watch('startTime'))) / 3600000
                          ) * selectedSpot.pricePerHour
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
                        Duration
                      </p>
                      <p className="text-sm font-bold text-white">
                        {Math.max(1,
                          Math.round(
                            (new Date(watch('endTime')) -
                              new Date(watch('startTime'))) / 3600000 * 10
                          ) / 10
                        ).toFixed(1)}h
                      </p>
                    </div>
                  </div>
                )
              }

              {/* Submit */}
              <button
                type="submit"
                disabled={booking || vehicles.length === 0 || evWarning}
                className="btn-primary w-full flex items-center 
                           justify-center gap-2 py-3.5 text-base"
              >
                {booking ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full 
                                    border-2 border-white/30 border-t-white" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm Booking
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Spot Card ─────────────────────────────────────────────────────────────────
function SpotCard({ spot, onClick }) {
  const statusStyle = SPOT_STATUS_STYLE[spot.status] ??
                      SPOT_STATUS_STYLE.MAINTENANCE;
  const typeConfig  = SPOT_TYPE_MAP[spot.spotType] ??
                      { label: spot.spotType, color: 'bg-gray-100 text-gray-600' };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 text-center 
                  transition-all duration-200 ${statusStyle}
                  ${spot.status === 'AVAILABLE'
                    ? 'hover:shadow-card-hover hover:scale-105' : ''
                  }`}
    >
      {/* Spot number */}
      <p className="text-sm font-black text-[#3D52A0] mb-1">
        {spot.spotNumber}
      </p>

      {/* Type badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 
                        rounded-full ${typeConfig.color} mb-2 
                        inline-block`}>
        {typeConfig.label}
      </span>

      {/* Price */}
      <p className="text-xs font-bold text-[#3D52A0]">
        {formatCurrency(spot.pricePerHour)}/hr
      </p>

      {/* Feature icons */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        {spot.isEVCharging && (
          <Zap className="w-3 h-3 text-emerald-600" title="EV Charging" />
        )}
        {spot.isHandicapped && (
          <Accessibility className="w-3 h-3 text-[#7091E6]"
                         title="Accessible" />
        )}
      </div>

      {/* Status label */}
      <p className={`text-[9px] font-bold mt-1.5 uppercase tracking-wide
                    ${spot.status === 'AVAILABLE' ? 'text-green-700'
                      : spot.status === 'RESERVED' ? 'text-amber-700'
                      : spot.status === 'OCCUPIED' ? 'text-red-700'
                      : 'text-gray-500'
                    }`}>
        {spot.status}
      </p>
    </div>
  );
}