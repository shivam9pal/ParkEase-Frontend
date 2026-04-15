import { useState, useRef, useEffect, createContext, useContext } from "react";

// Create context for dropdown state
const DropdownContext = createContext();

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, ...props }) {
  const { setOpen, triggerRef } = useContext(DropdownContext);

  if (asChild) {
    return (
      <div
        ref={triggerRef}
        onClick={(e) => {
          setOpen((prev) => !prev);
          if (children?.props?.onClick) children.props.onClick(e);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <button
      ref={triggerRef}
      onClick={() => setOpen((prev) => !prev)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "start",
  children,
  className = "",
}) {
  const { open, contentRef } = useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`
        absolute z-50 min-w-[200px] rounded-lg border border-muted/40
        bg-white shadow-lg py-1
        ${align === "end" ? "right-0" : "left-0"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children }) {
  return (
    <div className="px-4 py-2 text-sm font-medium text-gray-900">
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-muted/40" />;
}

export function DropdownMenuItem({
  onClick,
  children,
  className = "",
  ...props
}) {
  const { setOpen } = useContext(DropdownContext);

  return (
    <button
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={`
        w-full text-left px-4 py-2 text-sm text-gray-700
        hover:bg-surface hover:text-primary transition-colors
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
