/**
 * Converts minutes to "Xh YYm"
 * e.g. 95 → "1h 35m", 60 → "1h 00m", 30 → "30m"
 */
export const formatDuration = (minutes) => {
  if (minutes == null || isNaN(minutes)) return '—';
  const mins = Math.round(minutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

/**
 * Computes duration string from a checkInTime ISO string to now
 * e.g. "2h 15m"
 */
export const durationSince = (checkInTimeStr) => {
  if (!checkInTimeStr) return '—';
  const checkIn = new Date(checkInTimeStr);
  const now = new Date();
  const diffMs = now - checkIn;
  if (diffMs < 0) return '0m';
  const totalMinutes = Math.floor(diffMs / 60000);
  return formatDuration(totalMinutes);
};