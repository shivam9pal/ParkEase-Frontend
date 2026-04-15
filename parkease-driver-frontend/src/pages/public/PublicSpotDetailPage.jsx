import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ChevronLeft, Zap, Accessibility } from 'lucide-react';
import { getSpotById } from '../../api/spotApi';
import { formatCurrency } from '../../utils/formatCurrency';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const SPOT_TYPE_LABEL = {
  COMPACT: 'Compact',
  STANDARD: 'Standard',
  LARGE: 'Large',
  MOTORBIKE: 'Motorbike',
  EV: 'EV',
};

const VEHICLE_TYPE_LABEL = {
  TWO_WHEELER: '2-Wheeler',
  FOUR_WHEELER: '4-Wheeler',
  HEAVY: 'Heavy',
};

export default function PublicSpotDetailPage() {
  const { spotId } = useParams();
  const navigate = useNavigate();

  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpot = async () => {
      setLoading(true);
      try {
        const res = await getSpotById(spotId);
        setSpot(res.data);
      } catch {
        setError('Failed to load spot details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSpot();
  }, [spotId]);

  if (loading) return <LoadingSpinner text="Loading spot details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!spot) return <ErrorMessage message="Spot not found." />;

  return (
    <div className="min-h-screen bg-[#EDE8F5]">
      <div className="container mx-auto px-4 max-w-4xl py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center 
                        sm:justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold 
                   text-[#7091E6] hover:text-[#3D52A0] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => navigate('/auth/login')}
            className="btn-primary text-sm py-2 px-4"
          >
            Sign in to Book
          </button>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-[#3D52A0]">
                Spot {spot.spotNumber}
              </h1>
              <p className="text-sm text-[#8697C4]">
                {SPOT_TYPE_LABEL[spot.spotType] ?? spot.spotType} spot
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold 
                            bg-[#EDE8F5] text-[#3D52A0]">
              {spot.status}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#EDE8F5] rounded-2xl p-4">
              <p className="text-xs text-[#8697C4] font-semibold">Price</p>
              <p className="text-lg font-black text-[#3D52A0]">
                {formatCurrency(spot.pricePerHour)}/hr
              </p>
            </div>
            <div className="bg-[#EDE8F5] rounded-2xl p-4">
              <p className="text-xs text-[#8697C4] font-semibold">
                Vehicle Type
              </p>
              <p className="text-lg font-black text-[#3D52A0]">
                {VEHICLE_TYPE_LABEL[spot.vehicleType] ?? spot.vehicleType}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {spot.isEVCharging && (
              <span className="inline-flex items-center gap-1.5 text-xs 
                               font-semibold bg-emerald-50 text-emerald-700 
                               border border-emerald-200 px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                EV Charging
              </span>
            )}
            {spot.isHandicapped && (
              <span className="inline-flex items-center gap-1.5 text-xs 
                               font-semibold bg-blue-50 text-[#7091E6] 
                               border border-[#ADBBDA] px-3 py-1 rounded-full">
                <Accessibility className="w-3 h-3" />
                Accessible
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-[#8697C4]">
            <Car className="w-4 h-4" />
            Sign in to book this spot.
          </div>
        </div>
      </div>
    </div>
  );
}
