/**
 * LoadingSpinner
 * @param {string}  size    - "sm" | "md" | "lg"  (default: "md")
 * @param {string}  text    - optional label below spinner
 * @param {boolean} fullPage - centers spinner in full viewport height
 */
export default function LoadingSpinner({
  size = 'md',
  text = '',
  fullPage = false,
}) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} border-primary border-t-transparent
                    rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-muted font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return spinner;
}