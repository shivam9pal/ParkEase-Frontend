import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation dialog
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onConfirm
 * @param {string}   title
 * @param {string}   description
 * @param {string}   confirmLabel   - default "Confirm"
 * @param {string}   variant        - "danger" | "primary" (default: "danger")
 * @param {boolean}  loading
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-primary hover:bg-primary-hover text-white';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                            ${variant === 'danger' ? 'bg-red-100' : 'bg-primary/10'}`}>
              <AlertTriangle
                size={20}
                className={variant === 'danger' ? 'text-red-500' : 'text-primary'}
              />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-800">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted leading-relaxed px-1">
          {description}
        </p>

        <DialogFooter className="mt-2 gap-2 flex-row justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                       hover:bg-gray-200 rounded-lg transition-colors
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg
                        transition-colors disabled:opacity-50 flex items-center gap-2
                        ${confirmClass}`}
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}