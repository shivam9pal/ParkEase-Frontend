import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * "2026-04-07T14:30:00" → "07 Apr 2026, 02:30 PM"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, 'dd MMM yyyy, hh:mm aa') : '—';
  } catch { return '—'; }
};

/**
 * "2026-04-07T14:30:00" → "07 Apr 2026"
 */
export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—';
  } catch { return '—'; }
};

/**
 * "2026-04-07T14:30:00" → "02:30 PM"
 */
export const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, 'hh:mm aa') : '—';
  } catch { return '—'; }
};

/**
 * "08:00:00" or "08:00" → "08:00 AM"
 */
export const formatTimeString = (timeStr) => {
  if (!timeStr) return '—';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, 'hh:mm aa');
  } catch { return timeStr; }
};

/**
 * "2026-04-07T14:30:00" → "2 hours ago" / "just now"
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d)
      ? formatDistanceToNow(d, { addSuffix: true })
      : '';
  } catch { return ''; }
};

/**
 * Calculate duration between two ISO strings → "2h 35m"
 */
export const calcDuration = (startStr, endStr) => {
  if (!startStr || !endStr) return '—';
  try {
    const start = parseISO(startStr);
    const end   = parseISO(endStr);
    const mins  = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch { return '—'; }
};