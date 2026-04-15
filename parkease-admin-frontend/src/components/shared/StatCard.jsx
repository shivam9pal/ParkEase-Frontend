import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Props:
 *   title: string
 *   value: string | number
 *   icon: LucideIcon component
 *   iconColor: tailwind bg class e.g. "bg-accent/10"
 *   iconTextColor: tailwind text class e.g. "text-accent"
 *   trend: { value: number, label: string } (optional)
 *   onClick: fn (optional) — makes card clickable
 *   badge: { label: string, color: "blue"|"green"|"yellow"|"red"|"purple" } (optional)
 */

const badgeColors = {
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red:    "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "bg-accent/10",
  iconTextColor = "text-accent",
  trend,
  onClick,
  badge,
}) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        stat-card flex items-start justify-between
        ${isClickable ? "cursor-pointer hover:shadow-card-hover" : ""}
      `}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-secondary uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="mt-1.5 text-2xl font-bold text-gray-800 truncate">
          {value ?? "—"}
        </p>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1 mt-1.5">
            {trend.value > 0 ? (
              <TrendingUp size={13} className="text-green-500" />
            ) : trend.value < 0 ? (
              <TrendingDown size={13} className="text-red-500" />
            ) : (
              <Minus size={13} className="text-secondary" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.value > 0
                  ? "text-green-600"
                  : trend.value < 0
                  ? "text-red-600"
                  : "text-secondary"
              }`}
            >
              {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
            </span>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span
            className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              badgeColors[badge.color] ?? badgeColors.blue
            }`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Icon */}
      {Icon && (
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3 ${iconColor}`}
        >
          <Icon size={20} className={iconTextColor} />
        </div>
      )}
    </div>
  );
}