import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Car, Zap, Accessibility,
  ChevronLeft, Layers,
} from 'lucide-react';
import { getLotById } from '../../api/lotApi';
import { getSpotsByLot } from '../../api/spotApi';
import { formatCurrency } from '../../utils/formatCurrency';
import StatusBadge from '../../components/booking/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const SPOT_TYPE_MAP = {
  COMPACT: { label: 'Compact', color: 'bg-purple-100 text-purple-700' },
  STANDARD: { label: 'Standard', color: 'bg-blue-100 text-[#7091E6]' },
  LARGE: { label: 'Large', color: 'bg-green-100 text-green-700' },
  MOTORBIKE: { label: 'Motorbike', color: 'bg-amber-100 text-amber-700' },
  EV: { label: 'EV', color: 'bg-emerald-100 text-emerald-700' },
};

const SPOT_STATUS_STYLE = {
  AVAILABLE: 'border-green-400 bg-green-50',
  RESERVED: 'border-amber-400 bg-amber-50',
  OCCUPIED: 'border-red-400 bg-red-50',
  MAINTENANCE: 'border-gray-300 bg-gray-100',
};

export default function PublicLotDetailPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [lotRes, spotsRes] = await Promise.all([
          getLotById(lotId),
          getSpotsByLot(lotId),
        ]);
        setLot(lotRes.data);
        setSpots(spotsRes.data);
      } catch {
        setError('Failed to load lot details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [lotId]);

  const filteredSpots = spots.filter((s) => {
    const typeOk = typeFilter === 'ALL' || s.spotType === typeFilter;
    const statusOk = statusFilter === 'ALL' || s.status === statusFilter;
    return typeOk && statusOk;
  });

  const availableCount = spots.filter((s) => s.status === 'AVAILABLE').length;

  if (loading) return <LoadingSpinner text="Loading lot details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!lot) return <ErrorMessage message="Lot not found." />;

  return (
    <div className="min-h-screen bg-[#EDE8F5]">
      <div className="container mx-auto px-4 max-w-6xl py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center 
                        sm:justify-between gap-3">
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 text-sm font-semibold 
                   text-[#7091E6] hover:text-[#3D52A0] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Explore
          </button>
          <button
            onClick={() => navigate('/auth/login')}
            className="btn-primary text-sm py-2 px-4"
          >
            Sign in to Book
          </button>
        </div>

        <div className="card overflow-hidden !p-0">
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                {
                  icon: Car,
                  label: 'Available',
                  value: `${availableCount} / ${lot.totalSpots}`,
                  color: availableCount > 0 ? 'text-green-600' : 'text-red-500',
                  bg: availableCount > 0 ? 'bg-green-50' : 'bg-red-50',
                },
                {
                  icon: Clock,
                  label: 'Hours',
                  value: `${lot.openTime?.slice(0,5)} – ${lot.closeTime?.slice(0,5)}`,
                  color: 'text-[#3D52A0]',
                  bg: 'bg-[#EDE8F5]',
                },
                {
                  icon: Zap,
                  label: 'EV Spots',
                  value: spots.filter((s) => s.isEVCharging).length,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  icon: Accessibility,
                  label: 'Accessible',
                  value: spots.filter((s) => s.isHandicapped).length,
                  color: 'text-[#7091E6]',
                  bg: 'bg-blue-50',
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
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center 
                        sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-[#3D52A0]">
                Parking Spots
              </h2>
              <p className="text-xs text-[#8697C4] mt-0.5">
                Browse spot types and statuses. Sign in to book.
              </p>
            </div>

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
                  onClick={() => navigate(`/explore/spots/${spot.spotId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpotCard({ spot, onClick }) {
  const statusStyle = SPOT_STATUS_STYLE[spot.status] ??
                      SPOT_STATUS_STYLE.MAINTENANCE;
  const typeConfig = SPOT_TYPE_MAP[spot.spotType] ??
                      { label: spot.spotType, color: 'bg-gray-100 text-gray-600' };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 text-center 
                  transition-all duration-200 ${statusStyle}
                  hover:shadow-card-hover hover:scale-105 cursor-pointer`}
    >
      <p className="text-sm font-black text-[#3D52A0] mb-1">
        {spot.spotNumber}
      </p>

      <span className={`text-[10px] font-bold px-2 py-0.5 
                        rounded-full ${typeConfig.color} mb-2 
                        inline-block`}>
        {typeConfig.label}
      </span>

      <p className="text-xs font-bold text-[#3D52A0]">
        {formatCurrency(spot.pricePerHour)}/hr
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        {spot.isEVCharging && (
          <Zap className="w-3 h-3 text-emerald-600" title="EV Charging" />
        )}
        {spot.isHandicapped && (
          <Accessibility className="w-3 h-3 text-[#7091E6]"
                         title="Accessible" />
        )}
      </div>

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
