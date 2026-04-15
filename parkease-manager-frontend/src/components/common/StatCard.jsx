/**
 * Reusable stat card for dashboards
 *
 * @param {string}    title
 * @param {string|number} value
 * @param {ReactNode} icon
 * @param {string}    color    - "blue" | "green" | "yellow" | "red" | "purple"
 * @param {string}    subtitle - small helper text below value
 */

const COLOR_MAP = {
  blue  : { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700'   },
  green : { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', value: 'text-green-700'  },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600',value: 'text-yellow-700' },
  red   : { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     value: 'text-red-700'    },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',value: 'text-purple-700' },
  primary:{ bg: 'bg-parkease-bg',icon: 'bg-primary/10 text-primary',  value: 'text-primary'    },
};

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
}) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.primary;

  return (
    <div className={`card ${colors.bg} border-0 shadow-card`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${colors.value}`}>
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                           shrink-0 ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}