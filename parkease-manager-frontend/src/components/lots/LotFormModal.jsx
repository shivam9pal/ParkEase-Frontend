import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { MapPin, Navigation, ImageIcon, Clock, Hash, AlertTriangle, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { createLot, updateLot } from '../../api/lotApi';
import { uploadProfilePicture } from '../../api/authApi';

// Fix Leaflet default icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl      : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl    : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Zod Schema ────────────────────────────────────────────────────────
const lotSchema = z.object({
  name      : z.string().min(1, 'Lot name is required').max(100),
  address   : z.string().min(1, 'Address is required'),
  city      : z.string().min(1, 'City is required'),
  latitude  : z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude : z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  totalSpots: z.coerce.number().int().min(1, 'Must have at least 1 spot'),
  openTime  : z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  closeTime : z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  imageUrl  : z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// ── Map click handler component ───────────────────────────────────────
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * LotFormModal
 * @param {string}   mode      - "create" | "edit"
 * @param {object}   lot       - existing lot data (edit mode only)
 * @param {Function} onClose
 * @param {Function} onSuccess - called with new/updated LotResponse
 */
export default function LotFormModal({ mode = 'create', lot, onClose, onSuccess }) {
  const [loading, setLoading]         = useState(false);
  const [geoLoading, setGeoLoading]   = useState(false);
  const [markerPos, setMarkerPos]     = useState(null);
  const isEdit                        = mode === 'edit';

  // ── File upload states ────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lotSchema),
    defaultValues: isEdit && lot ? {
      name      : lot.name,
      address   : lot.address,
      city      : lot.city,
      latitude  : lot.latitude,
      longitude : lot.longitude,
      totalSpots: lot.totalSpots,
      // Strip seconds for HTML time input: "08:00:00" → "08:00"
      openTime  : lot.openTime?.slice(0, 5) ?? '',
      closeTime : lot.closeTime?.slice(0, 5) ?? '',
      imageUrl  : lot.imageUrl ?? '',
    } : {
      latitude : 20.5937,   // Default: center of India
      longitude: 78.9629,
    },
  });

  const watchLat = watch('latitude');
  const watchLng = watch('longitude');

  // Sync marker when lat/lng fields change
  useEffect(() => {
    if (watchLat && watchLng) {
      setMarkerPos([Number(watchLat), Number(watchLng)]);
    }
  }, [watchLat, watchLng]);

  // ── Use Current Geolocation ───────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue('latitude', parseFloat(latitude.toFixed(6)));
        setValue('longitude', parseFloat(longitude.toFixed(6)));
        setMarkerPos([latitude, longitude]);
        setGeoLoading(false);
        toast.success('Location detected! ✅');
      },
      () => {
        toast.error('Unable to detect location. Please enter manually.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // ── Map click → update lat/lng fields ────────────────────────────
  const handleMapClick = (lat, lng) => {
    setValue('latitude',  parseFloat(lat.toFixed(6)));
    setValue('longitude', parseFloat(lng.toFixed(6)));
    setMarkerPos([lat, lng]);
  };

  // ── Handle file selection ────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log('[LotFormModal] File selected:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    if (!file) {
      console.log('[LotFormModal] No file provided in input');
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      console.log('[LotFormModal] File too large:', file.size, 'bytes');
      setFileError('File size must be less than 10MB');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (!validTypes.includes(file.type)) {
      console.log('[LotFormModal] Invalid file type:', file.type);
      setFileError('Only JPG, PNG, and WebP images are allowed');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    console.log('[LotFormModal] File validation passed, setting selectedFile');
    setFileError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('[LotFormModal] Preview created, length:', e.target?.result?.length);
      setFilePreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // ── Submit ────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let lotImageUrl = null;

      // Step 1: Upload image if selected (for create mode)
      if (!isEdit && selectedFile) {
        console.log('[LotFormModal] 🚀 Uploading lot image...');
        setUploadingFile(true);
        const uploadRes = await uploadProfilePicture(selectedFile);
        console.log('[LotFormModal] ✅ Upload successful!', uploadRes.data);
        lotImageUrl = uploadRes.data?.profilePicUrl || null;
        toast.success('Lot image uploaded! 📸');
      }

      // Step 2: Create or update lot with image URL
      console.log('[LotFormModal] 📝 Creating/updating lot with imageUrl:', lotImageUrl);
      const payload = {
        ...data,
        openTime : `${data.openTime}:00`,
        closeTime: `${data.closeTime}:00`,
        imageUrl : lotImageUrl,
      };

      let res;
      if (isEdit) {
        // For edit — remove totalSpots (not updatable via this endpoint)
        const { totalSpots, ...updatePayload } = payload;
        res = await updateLot(lot.lotId, updatePayload);
        toast.success('Lot updated successfully ✅');
      } else {
        res = await createLot(payload);
        toast.success('Lot submitted for admin approval ⏳');
      }

      onSuccess(res.data);

    } catch (err) {
      console.error('[LotFormModal] ❌ Error:', err);
      const msg = err.response?.data?.message ?? '';
      if (err.response?.status === 403) {
        toast.error('You can only manage your own lots.');
      } else if (msg) {
        toast.error(msg);
      } else {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} lot.`);
      }
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEdit ? '✏️ Edit Lot' : '🏢 Add New Parking Lot'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 mt-2">

          {/* ── Row 1: Name ── */}
          <div>
            <label className="label">
              <Hash size={13} className="inline mr-1" />
              Lot Name *
            </label>
            <input
              {...register('name')}
              placeholder="e.g. MG Road Parking Zone A"
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* ── Row 2: Address + City ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Address *</label>
              <input
                {...register('address')}
                placeholder="Street address"
                className={`input-field ${errors.address ? 'border-red-400' : ''}`}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>
            <div>
              <label className="label">City *</label>
              <input
                {...register('city')}
                placeholder="e.g. Bangalore"
                className={`input-field ${errors.city ? 'border-red-400' : ''}`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* ── Row 3: Lat / Lng + Geo Button ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">
                <MapPin size={13} className="inline mr-1" />
                Location Coordinates *
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="flex items-center gap-1.5 text-xs text-secondary
                           font-semibold hover:text-primary transition-colors
                           disabled:opacity-50"
              >
                {geoLoading ? (
                  <div className="w-3 h-3 border border-secondary border-t-transparent
                                  rounded-full animate-spin" />
                ) : (
                  <Navigation size={13} />
                )}
                Use My Location
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  {...register('latitude')}
                  type="number"
                  step="0.000001"
                  placeholder="Latitude (e.g. 12.9716)"
                  className={`input-field ${errors.latitude ? 'border-red-400' : ''}`}
                />
                {errors.latitude && (
                  <p className="text-xs text-red-500 mt-1">{errors.latitude.message}</p>
                )}
              </div>
              <div>
                <input
                  {...register('longitude')}
                  type="number"
                  step="0.000001"
                  placeholder="Longitude (e.g. 77.5946)"
                  className={`input-field ${errors.longitude ? 'border-red-400' : ''}`}
                />
                {errors.longitude && (
                  <p className="text-xs text-red-500 mt-1">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            {/* ── Leaflet Map ── */}
            <div className="mt-3 rounded-xl overflow-hidden border border-accent/40"
                 style={{ height: '220px' }}>
              <MapContainer
                center={markerPos ?? [20.5937, 78.9629]}
                zoom={markerPos ? 14 : 5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapClickHandler onLocationSelect={handleMapClick} />
                {markerPos && <Marker position={markerPos} />}
              </MapContainer>
            </div>
            <p className="text-xs text-muted mt-1.5">
              📍 Click on the map to set location, or use "Use My Location"
            </p>
          </div>

          {/* ── Row 4: Total Spots (create only) ── */}
          {!isEdit && (
            <div>
              <label className="label">Total Spots *</label>
              <input
                {...register('totalSpots')}
                type="number"
                min="1"
                placeholder="e.g. 80"
                className={`input-field ${errors.totalSpots ? 'border-red-400' : ''}`}
              />
              {errors.totalSpots && (
                <p className="text-xs text-red-500 mt-1">{errors.totalSpots.message}</p>
              )}
              <p className="text-xs text-muted mt-1">
                ⚠️ Total spots cannot be changed after creation.
              </p>
            </div>
          )}

          {/* ── Row 5: Open / Close Time ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Clock size={13} className="inline mr-1" />
                Opening Time *
              </label>
              <input
                {...register('openTime')}
                type="time"
                className={`input-field ${errors.openTime ? 'border-red-400' : ''}`}
              />
              {errors.openTime && (
                <p className="text-xs text-red-500 mt-1">{errors.openTime.message}</p>
              )}
            </div>
            <div>
              <label className="label">
                <Clock size={13} className="inline mr-1" />
                Closing Time *
              </label>
              <input
                {...register('closeTime')}
                type="time"
                className={`input-field ${errors.closeTime ? 'border-red-400' : ''}`}
              />
              {errors.closeTime && (
                <p className="text-xs text-red-500 mt-1">{errors.closeTime.message}</p>
              )}
            </div>
          </div>

          {/* ── Row 6: Lot Image Upload ── */}
          {!isEdit && (
            <div>
              <label className="label">
                <ImageIcon size={13} className="inline mr-1" />
                Lot Image
                <span className="text-muted font-normal ml-1">(optional — JPG, PNG, WebP • Max 10MB)</span>
              </label>

              {/* File input and preview */}
              <div className="space-y-3">
                {/* Preview */}
                {filePreview ? (
                  <div className="relative h-40 w-40 mx-auto">
                    <img
                      src={filePreview}
                      alt="Lot Preview"
                      className="w-full h-full rounded-xl object-cover 
                                 border-4 border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setFileError(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 
                                 bg-red-400 rounded-full flex items-center 
                                 justify-center text-white font-bold hover:bg-red-500"
                    >
                      ×
                    </button>
                  </div>
                ) : null}

                {/* File input */}
                <label className="block">
                  <div className="relative border-2 border-dashed border-accent/40 
                                  rounded-xl px-4 py-6 text-center cursor-pointer 
                                  hover:border-primary hover:bg-primary/5 
                                  transition-colors">
                    <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedFile ? selectedFile.name : 'Click to select or drag'}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
                        : 'Select an image file'}
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </label>

                {/* Error message */}
                {fileError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {fileError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Footer Buttons ── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-accent/30">
            {uploadingFile && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 
                              border border-primary rounded-lg text-primary 
                              font-semibold text-sm">
                <div className="h-4 w-4 animate-spin rounded-full 
                                border-2 border-primary/30 border-t-primary" />
                Uploading image to S3...
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingFile}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 rounded-lg transition-colors
                         disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingFile}
              className="btn-primary flex items-center gap-2 px-5 py-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEdit ? '💾 Save Changes' : '🏢 Submit Lot'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}