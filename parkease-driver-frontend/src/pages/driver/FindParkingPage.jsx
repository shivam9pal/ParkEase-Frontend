import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, MapPin, SlidersHorizontal,
  Navigation, Clock, Car, ChevronRight,
  X, Wifi,
} from 'lucide-react';
import {
  getNearbyLots, searchLots, getLotsByCity,
} from '../../api/lotApi';
import { useGeolocation } from '../../hooks/useGeolocation';
import { formatCurrency }  from '../../utils/formatCurrency';
import LoadingSpinner      from '../../components/common/LoadingSpinner';
import StatusBadge         from '../../components/booking/StatusBadge';

// ── Fix Leaflet default icon in Vite ─────────────────────────────────────────
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import iconShadow    from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl, iconRetinaUrl, shadowUrl: iconShadow,
});

// ── Custom colored markers ────────────────────────────────────────────────────
const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px; height:32px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

const greenIcon = makeIcon('#22c55e');
const redIcon   = makeIcon('#ef4444');
const navyIcon  = makeIcon('#3D52A0');

// ── Fly-to helper component ───────────────────────────────────────────────────
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function FindParkingPage() {
  const navigate = useNavigate();
  const { lat, lng, loading: gpsLoading } = useGeolocation();

  const [lots,       setLots]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [keyword,    setKeyword]    = useState('');
  const [city,       setCity]       = useState('');
  const [radius,     setRadius]     = useState(5);
  const [searchMode, setSearchMode] = useState('nearby'); // 'nearby'|'keyword'|'city'
  const [selectedId, setSelectedId] = useState(null);
  const [mapCenter,  setMapCenter]  = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Fetch nearby on GPS ready ─────────────────────────────────────────────
  useEffect(() => {
    if (!gpsLoading && lat && lng) {
      fetchNearby();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsLoading, lat, lng]);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    setSearchMode('nearby');
    try {
      const res = await getNearbyLots(lat, lng, radius);
      setLots(res.data);
    } catch {
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius]);

  const handleKeywordSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setSearchMode('keyword');
    try {
      const res = await searchLots(keyword.trim());
      setLots(res.data);
    } catch {
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setSearchMode('city');
    try {
      const res = await getLotsByCity(city.trim());
      setLots(res.data);
    } catch {
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLotClick = (lot) => {
    setSelectedId(lot.lotId);
    setMapCenter([lot.latitude, lot.longitude]);
  };

  const clearSearch = () => {
    setKeyword('');
    setCity('');
    fetchNearby();
  };

  return (
    <div className="space-y-4">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Find Parking</h1>
        <p className="page-subtitle">
          Discover available parking lots near you
        </p>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-200px)] 
                      min-h-[600px]">

        {/* ── Left Panel ───────────────────────────────────────────────── */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 
                        overflow-hidden flex-shrink-0">

          {/* Search + Filters card */}
          <div className="card !p-4 space-y-3">

            {/* Keyword search */}
            <form onSubmit={handleKeywordSearch}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 
                                   w-4 h-4 text-[#8697C4]" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by name or address..."
                  className="form-input pl-10 pr-20 py-2.5 text-sm"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 
                               text-[#8697C4] hover:text-[#3D52A0]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                             bg-[#3D52A0] text-white text-xs font-semibold 
                             px-2.5 py-1.5 rounded-lg hover:bg-[#7091E6] 
                             transition-colors"
                >
                  Go
                </button>
              </div>
            </form>

            {/* Toggle filters */}
            <button
              onClick={() => setFiltersOpen((p) => !p)}
              className="flex items-center gap-2 text-sm text-[#7091E6] 
                         font-semibold hover:text-[#3D52A0] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {filtersOpen ? 'Hide filters' : 'More filters'}
            </button>

            {/* Expanded filters */}
            {filtersOpen && (
              <div className="space-y-3 pt-2 border-t border-[#EDE8F5]">

                {/* City search */}
                <form onSubmit={handleCitySearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 
                                       w-3.5 h-3.5 text-[#8697C4]" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Search by city..."
                      className="form-input pl-9 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-outline text-sm py-2 px-3"
                  >
                    Search
                  </button>
                </form>

                {/* Radius slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#8697C4]">
                      Search Radius
                    </label>
                    <span className="text-xs font-bold text-[#3D52A0]">
                      {radius} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-[#3D52A0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] 
                                  text-[#ADBBDA] mt-1">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={fetchNearby}
                    className="btn-primary text-sm py-2 flex-1 
                               flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Use My Location
                  </button>
                  <button
                    onClick={clearSearch}
                    className="btn-ghost text-sm py-2 px-3"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Results summary */}
            <div className="flex items-center justify-between 
                            pt-2 border-t border-[#EDE8F5]">
              <span className="text-xs text-[#8697C4] font-medium">
                {loading
                  ? 'Searching...'
                  : `${lots.length} lot${lots.length !== 1 ? 's' : ''} found`
                }
              </span>
              {searchMode !== 'nearby' && (
                <button
                  onClick={clearSearch}
                  className="text-xs text-[#7091E6] font-semibold 
                             hover:text-[#3D52A0] flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Back to nearby
                </button>
              )}
            </div>
          </div>

          {/* Lot list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1
                          scrollbar-thin scrollbar-track-[#EDE8F5] 
                          scrollbar-thumb-[#ADBBDA]">
            {loading ? (
              <LoadingSpinner size="sm" text="Finding lots..." />
            ) : lots.length === 0 ? (
              <div className="card flex flex-col items-center 
                              justify-center py-12 text-center">
                <MapPin className="w-10 h-10 text-[#ADBBDA] mb-3" />
                <p className="font-semibold text-[#3D52A0] text-sm mb-1">
                  No lots found
                </p>
                <p className="text-xs text-[#8697C4]">
                  Try increasing the radius or searching by city.
                </p>
              </div>
            ) : (
              lots.map((lot) => (
                <LotCard
                  key={lot.lotId}
                  lot={lot}
                  isSelected={selectedId === lot.lotId}
                  onClick={() => handleLotClick(lot)}
                  onView={() => navigate(`/driver/lots/${lot.lotId}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Map Panel ────────────────────────────────────────────────── */}
        <div className="flex-1 rounded-2xl overflow-hidden border 
                        border-[#ADBBDA] shadow-card min-h-[400px]">
          {gpsLoading ? (
            <div className="h-full flex items-center justify-center 
                            bg-[#EDE8F5]">
              <LoadingSpinner text="Getting your location..." />
            </div>
          ) : (
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              {/* Fly to selected lot */}
              {mapCenter && <FlyTo center={mapCenter} />}

              {/* OpenStreetMap tiles */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* User location marker */}
              <Marker position={[lat, lng]} icon={navyIcon}>
                <Popup>
                  <div className="text-center p-1">
                    <p className="font-bold text-[#3D52A0] text-sm">
                      📍 You are here
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Lot markers */}
              {lots.map((lot) => (
                <Marker
                  key={lot.lotId}
                  position={[lot.latitude, lot.longitude]}
                  icon={lot.availableSpots > 0 ? greenIcon : redIcon}
                  eventHandlers={{
                    click: () => handleLotClick(lot),
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] p-1">
                      <p className="font-bold text-[#3D52A0] text-sm mb-1">
                        {lot.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {lot.address}
                      </p>
                      <div className="flex items-center justify-between 
                                      mb-3">
                        <span className={`text-xs font-bold
                          ${lot.availableSpots > 0
                            ? 'text-green-600'
                            : 'text-red-500'
                          }`}>
                          {lot.availableSpots > 0
                            ? `${lot.availableSpots} spots available`
                            : 'Full'
                          }
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/driver/lots/${lot.lotId}`)
                        }
                        className="w-full bg-[#3D52A0] text-white text-xs 
                                   font-semibold py-1.5 px-3 rounded-lg 
                                   hover:bg-[#7091E6] transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lot Card Component ────────────────────────────────────────────────────────
function LotCard({ lot, isSelected, onClick, onView }) {
  return (
    <div
      onClick={onClick}
      className={`card !p-4 cursor-pointer transition-all duration-200
                  ${isSelected
                    ? 'border-[#3D52A0] shadow-card-hover ring-2 ring-[#3D52A0]/20'
                    : 'hover:border-[#7091E6] hover:shadow-card-hover'
                  }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#3D52A0] text-sm truncate">
            {lot.name}
          </h3>
          <p className="text-xs text-[#8697C4] truncate mt-0.5 
                        flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {lot.address}, {lot.city}
          </p>
        </div>
        <StatusBadge status={lot.isOpen ? 'OPEN' : 'CLOSED'} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Availability */}
        <div className={`rounded-xl px-2 py-2 text-center
                        ${lot.availableSpots > 0
                          ? 'bg-green-50'
                          : 'bg-red-50'
                        }`}>
          <p className={`text-base font-black leading-tight
                        ${lot.availableSpots > 0
                          ? 'text-green-700'
                          : 'text-red-600'
                        }`}>
            {lot.availableSpots}
          </p>
          <p className="text-[10px] text-gray-500 font-medium">Free</p>
        </div>

        {/* Total spots */}
        <div className="bg-[#EDE8F5] rounded-xl px-2 py-2 text-center">
          <p className="text-base font-black text-[#3D52A0] leading-tight">
            {lot.totalSpots}
          </p>
          <p className="text-[10px] text-[#8697C4] font-medium">Total</p>
        </div>

        {/* Hours */}
        <div className="bg-[#EDE8F5] rounded-xl px-2 py-2 text-center">
          <p className="text-[10px] font-black text-[#3D52A0] leading-tight">
            {lot.openTime?.slice(0, 5)}
          </p>
          <p className="text-[10px] text-[#8697C4] font-medium">
            {lot.closeTime?.slice(0, 5)}
          </p>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-[#8697C4] font-medium">
            Occupancy
          </span>
          <span className="text-[10px] font-bold text-[#3D52A0]">
            {lot.totalSpots > 0
              ? Math.round(
                  ((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100
                )
              : 0
            }%
          </span>
        </div>
        <div className="h-1.5 bg-[#EDE8F5] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500
                       ${lot.availableSpots === 0
                         ? 'bg-red-500'
                         : lot.availableSpots < lot.totalSpots * 0.2
                           ? 'bg-amber-500'
                           : 'bg-green-500'
                       }`}
            style={{
              width: `${lot.totalSpots > 0
                ? ((lot.totalSpots - lot.availableSpots) /
                    lot.totalSpots) * 100
                : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#8697C4]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lot.openTime?.slice(0, 5)} – {lot.closeTime?.slice(0, 5)}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="flex items-center gap-1.5 text-xs font-semibold 
                     text-[#3D52A0] hover:text-[#7091E6] 
                     bg-[#EDE8F5] hover:bg-[#ADBBDA]/40 
                     px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}