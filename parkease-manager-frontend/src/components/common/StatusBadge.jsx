/**
 * StatusBadge — Renders colored pill badge for any status value
 *
 * Covers: booking status, spot status, payment status, lot approval status
 */

const STATUS_CONFIG = {
  // ── Booking statuses ──
  RESERVED   : { label: 'Reserved',    className: 'badge-reserved' },
  ACTIVE     : { label: 'Active',      className: 'badge-active' },
  COMPLETED  : { label: 'Completed',   className: 'badge-completed' },
  CANCELLED  : { label: 'Cancelled',   className: 'badge-cancelled' },

  // ── Spot statuses ──
  AVAILABLE  : {
    label: 'Available',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200',
  },
  OCCUPIED   : {
    label: 'Occupied',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200',
  },

  // ── Payment statuses ──
  PAID       : {
    label: 'Paid',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200',
  },
  REFUNDED   : {
    label: 'Refunded',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200',
  },

  // ── Lot approval ──
  APPROVED   : { label: '✅ Approved',        className: 'badge-approved' },
  PENDING    : { label: '⏳ Pending Approval', className: 'badge-pending' },

  // ── Lot open/close ──
  OPEN       : {
    label: 'Open',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  CLOSED     : {
    label: 'Closed',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200',
  },

  // ── Booking type ──
  PRE_BOOKING: {
    label: 'Pre-Booking',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200',
  },
  WALK_IN    : {
    label: 'Walk-In',
    className: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200',
  },
};

/**
 * @param {string} status  - Status key (e.g. "ACTIVE", "AVAILABLE", "PAID")
 * @param {string} label   - Optional override label
 */
export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                       text-xs font-medium bg-gray-100 text-gray-600
                       border border-gray-200">
        {label ?? status}
      </span>
    );
  }

  return (
    <span className={config.className}>
      {label ?? config.label}
    </span>
  );
}