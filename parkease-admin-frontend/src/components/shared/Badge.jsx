const variants = {
  // Status
  active:    "bg-green-100 text-green-700 border-green-200",
  inactive:  "bg-red-100 text-red-700 border-red-200",
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  // Booking
  reserved:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  // Roles
  driver:    "bg-blue-100 text-blue-700 border-blue-200",
  manager:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  admin:     "bg-gray-100 text-gray-700 border-gray-200",
  superadmin:"bg-purple-100 text-purple-700 border-purple-200",
  // Payment
  paid:      "bg-green-100 text-green-700 border-green-200",
  refunded:  "bg-blue-100 text-blue-700 border-blue-200",
  // Channels
  app:       "bg-accent/10 text-accent border-accent/20",
  email:     "bg-orange-100 text-orange-700 border-orange-200",
  sms:       "bg-teal-100 text-teal-700 border-teal-200",
  // Booking type
  pre_booking: "bg-purple-100 text-purple-700 border-purple-200",
  walk_in:     "bg-gray-100 text-gray-600 border-gray-200",
  // Generic
  blue:      "bg-blue-100 text-blue-700 border-blue-200",
  green:     "bg-green-100 text-green-700 border-green-200",
  red:       "bg-red-100 text-red-700 border-red-200",
  yellow:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  purple:    "bg-purple-100 text-purple-700 border-purple-200",
  gray:      "bg-gray-100 text-gray-600 border-gray-200",
};

/**
 * Props:
 *   variant: one of the keys above (auto-lowercased)
 *   label: string (optional override — defaults to variant label)
 *   dot: boolean — shows colored dot before text
 */
export default function Badge({ variant = "gray", label, dot = false }) {
  const key = variant?.toLowerCase().replace(" ", "_");
  const cls = variants[key] ?? variants.gray;
  const displayLabel = label ?? variant;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]
        font-semibold border ${cls}
      `}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      {displayLabel}
    </span>
  );
}