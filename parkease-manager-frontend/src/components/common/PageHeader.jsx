import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Consistent page header with optional back button and action slot
 *
 * @param {string}    title
 * @param {string}    subtitle
 * @param {boolean}   showBack
 * @param {string}    backTo      - explicit path (default: go back -1)
 * @param {ReactNode} actions     - right-side action buttons
 */
export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backTo,
  actions,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {showBack && (
          <button
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="mt-0.5 p-1.5 rounded-lg hover:bg-accent/40
                       text-muted hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}