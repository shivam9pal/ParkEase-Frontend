import { format, parseISO, formatDistanceToNow } from 'date-fns';

export const formatDate = (iso) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy') : '—';

export const formatTime = (iso) =>
  iso ? format(parseISO(iso), 'hh:mm a') : '—';

export const formatDateTime = (iso) =>
  iso ? format(parseISO(iso), 'dd MMM yyyy, hh:mm a') : '—';

export const timeAgo = (iso) =>
  iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '—';

// Convert datetime-local input value to backend ISO format
// Input: "2026-04-07T10:30" → Output: "2026-04-07T10:30:00"
export const toBackendDateTime = (localValue) =>
  localValue ? `${localValue}:00` : null;