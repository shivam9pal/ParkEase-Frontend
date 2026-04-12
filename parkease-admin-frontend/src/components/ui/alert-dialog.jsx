import { useEffect, createContext, useContext, useState } from "react";

// Create context for alert dialog state
const AlertDialogContext = createContext();

export function AlertDialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={{ onOpenChange }}>
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange?.(false)}
        />
        {/* Dialog */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-lg border border-muted/40 max-w-sm w-full animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </>
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function AlertDialogHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function AlertDialogTitle({ children, className = "" }) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-secondary mt-1 ${className}`}>{children}</p>
  );
}

export function AlertDialogFooter({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-end gap-3 mt-6 ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogAction({ onClick, children, className = "" }) {
  const { onOpenChange } = useContext(AlertDialogContext);

  return (
    <button
      onClick={() => {
        onClick?.();
        onOpenChange?.(false);
      }}
      className={`
        inline-flex items-center justify-center rounded-md
        bg-red-600 text-white px-4 py-2 text-sm font-semibold
        hover:bg-red-700 transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ onClick, children, className = "" }) {
  const { onOpenChange } = useContext(AlertDialogContext);

  return (
    <button
      onClick={() => {
        onClick?.();
        onOpenChange?.(false);
      }}
      className={`
        inline-flex items-center justify-center rounded-md
        bg-surface text-gray-700 px-4 py-2 text-sm font-semibold
        hover:bg-muted/40 transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}
