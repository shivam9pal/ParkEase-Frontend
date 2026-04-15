/**
 * OccupancyMeter — Visual gauge showing occupied vs total spots
 *
 * @param {number} total
 * @param {number} available
 * @param {string} size  - "sm" | "md" | "lg"
 */
export default function OccupancyMeter({ total = 0, available = 0, size = 'md' }) {
  const occupied    = total - available;
  const percentage  = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Color thresholds
  const getColor = () => {
    if (percentage >= 90) return { bar: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50' };
    if (percentage >= 70) return { bar: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50' };
    return                       { bar: 'bg-green-500',  text: 'text-green-600',  bg: 'bg-green-50' };
  };

  const colors = getColor();

  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="w-full space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className={`${textSize[size]} text-muted font-medium`}>
          Occupancy
        </span>
        <span className={`${textSize[size]} font-bold ${colors.text}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={`w-full ${heights[size]} bg-accent/30 rounded-full overflow-hidden`}>
        <div
          className={`${heights[size]} ${colors.bar} rounded-full
                      transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          <span className="font-semibold text-gray-700">{occupied}</span> occupied
        </span>
        <span className="text-xs text-muted">
          <span className="font-semibold text-green-600">{available}</span> available
          {' / '}
          <span className="font-semibold text-gray-700">{total}</span> total
        </span>
      </div>
    </div>
  );
}