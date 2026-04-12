import { useEffect, useState, useRef } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { getFareEstimate } from '../../api/bookingApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDateTime';

export default function FareTimer({ bookingId, checkInTime }) {
  const [fareData,  setFareData]  = useState(null);
  const [elapsed,   setElapsed]   = useState('00:00:00');
  const [error,     setError]     = useState(false);
  const checkInRef = useRef(checkInTime);

  useEffect(() => {
    checkInRef.current = checkInTime;
  }, [checkInTime]);

  // ── Fetch fare every 30s ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchFare = async () => {
      try {
        const res = await getFareEstimate(bookingId);
        setFareData(res.data);
        setError(false);
        // update checkIn ref from response if not passed via props
        if (res.data.checkInTime) {
          checkInRef.current = res.data.checkInTime;
        }
      } catch {
        setError(true);
      }
    };

    fetchFare();
    const fareInterval = setInterval(fetchFare, 30000);
    return () => clearInterval(fareInterval);
  }, [bookingId]);

  // ── Live clock every 1s ───────────────────────────────────────────────────
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const ref = checkInRef.current || fareData?.checkInTime;
      if (!ref) return;
      const diff = Date.now() - new Date(ref).getTime();
      if (diff < 0) return;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [fareData]);

  return (
    <div className="bg-[#3D52A0] rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#ADBBDA]" />
        <span className="text-xs font-semibold text-[#ADBBDA] 
                         uppercase tracking-widest">
          Live Session
        </span>
      </div>

      {/* Elapsed timer */}
      <div className="text-4xl font-mono font-black text-white 
                      tracking-wider mb-4">
        {elapsed}
      </div>

      {/* Fare estimate */}
      {error ? (
        <p className="text-sm text-white/50">
          Unable to fetch fare estimate
        </p>
      ) : fareData ? (
        <div className="flex items-center justify-between 
                        bg-white/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
              Estimated Fare
            </p>
            <p className="text-xl font-black text-white">
              {formatCurrency(fareData.estimatedFare)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#ADBBDA] font-medium mb-0.5">
              Duration
            </p>
            <p className="text-sm font-bold text-white">
              {fareData.estimatedHours?.toFixed(1)}h
            </p>
          </div>
          <TrendingUp className="w-6 h-6 text-[#7091E6]" />
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-white/10 
                        rounded-xl px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full 
                          border-2 border-white/30 border-t-white" />
          <span className="text-sm text-white/60">
            Calculating fare...
          </span>
        </div>
      )}

      {fareData?.checkInTime && (
        <p className="text-xs text-white/40 mt-3 text-right">
          Checked in at {formatDateTime(fareData.checkInTime)}
        </p>
      )}
    </div>
  );
}