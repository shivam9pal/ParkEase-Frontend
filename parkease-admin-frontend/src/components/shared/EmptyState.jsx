import { Inbox } from "lucide-react";

/**
 * Props:
 *   message: string
 *   subtext: string (optional)
 *   icon: LucideIcon (optional)
 *   action: ReactNode (optional) — e.g. a button
 */
export default function EmptyState({
  message = "No data found",
  subtext,
  icon: Icon = Inbox,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mb-4">
        <Icon size={26} className="text-muted-foreground" />
      </div>
      <p className="text-gray-700 font-medium text-sm">{message}</p>
      {subtext && (
        <p className="text-secondary text-xs mt-1 max-w-xs">{subtext}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}