export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className="loading-wrapper flex-col gap-3">
      <div
        className={`${sizes[size]} animate-spin rounded-full 
                    border-4 border-parkease-border border-t-[#3D52A0]`}
      />
      {text && <p className="text-parkease-muted text-sm font-medium">{text}</p>}
    </div>
  );
}