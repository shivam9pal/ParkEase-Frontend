import { useEffect } from "react";
import { useNotificationStore } from "../../store/notificationStore";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const icons = {
  success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  error:   <XCircle     size={16} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-yellow-500 shrink-0" />,
  info:    <Info         size={16} className="text-blue-500 shrink-0" />,
};

const styles = {
  success: "border-l-green-500",
  error:   "border-l-red-500",
  warning: "border-l-yellow-500",
  info:    "border-l-blue-500",
};

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`
        flex items-start gap-3 bg-white rounded-lg shadow-lg border border-muted/40
        border-l-4 px-4 py-3 min-w-[280px] max-w-[380px]
        animate-in slide-in-from-right duration-300
        ${styles[toast.type] ?? styles.info}
      `}
    >
      {icons[toast.type] ?? icons.info}
      <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-muted hover:text-gray-600 transition-colors ml-1 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}