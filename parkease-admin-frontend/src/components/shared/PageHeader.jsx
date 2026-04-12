/**
 * Props:
 *   title: string
 *   subtitle: string (optional)
 *   actions: ReactNode (optional) — buttons on the right
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && (
          <p className="text-sm text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}