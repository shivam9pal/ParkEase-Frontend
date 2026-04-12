import { format, formatDistanceToNow, parseISO } from "date-fns";

// ─── Currency ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

// ─── Date & Time ──────────────────────────────────────────────────────────────
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy, hh:mm a");
  } catch {
    return "—";
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return "—";
  }
};

// ─── UUID Truncation ──────────────────────────────────────────────────────────
export const truncateId = (id) => {
  if (!id) return "—";
  return id.substring(0, 8) + "...";
};

// ─── Percentage ───────────────────────────────────────────────────────────────
export const formatPercent = (value) => {
  if (value == null) return "—";
  return `${Number(value).toFixed(1)}%`;
};

// ─── Number (compact) ─────────────────────────────────────────────────────────
export const formatNumber = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
};