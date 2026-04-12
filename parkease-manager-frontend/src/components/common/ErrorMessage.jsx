import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage
 * @param {string}   message  - Error text to display
 * @param {Function} onRetry  - Optional retry callback
 * @param {boolean}  fullPage - Centers in full viewport height
 */
export default function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  onRetry,
  fullPage = false,
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center
                      justify-center">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">Oops! An error occurred</p>
        <p className="text-sm text-muted mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white
                     text-sm font-semibold rounded-lg hover:bg-primary-hover
                     transition-colors duration-150"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return (
    <div className="card border-red-200 bg-red-50/40">
      {content}
    </div>
  );
}