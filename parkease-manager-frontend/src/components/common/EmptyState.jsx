import { PackageOpen } from 'lucide-react';

/**
 * EmptyState — shown when a list/table has no data
 *
 * @param {string}    title
 * @param {string}    description
 * @param {ReactNode} icon
 * @param {ReactNode} action       - CTA button
 */
export default function EmptyState({
  title = 'Nothing here yet',
  description = '',
  icon,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-background flex items-center
                      justify-center border-2 border-accent/40">
        {icon ?? <PackageOpen size={28} className="text-muted" />}
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">{title}</p>
        {description && (
          <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}