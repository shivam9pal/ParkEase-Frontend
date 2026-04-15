/**
 * Props:
 *   size: "sm" | "md" | "lg"
 *   fullPage: boolean — centers spinner in full viewport
 *   text: string (optional)
 */
export default function LoadingSpinner({
  size = "md",
  fullPage = false,
  text = "Loading...",
}) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`
          ${sizes[size]} rounded-full
          border-muted border-t-primary
          animate-spin
        `}
      />
      {text && size !== "sm" && (
        <p className="text-sm text-secondary">{text}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        {spinner}
      </div>
    );
  }

  return spinner;
}