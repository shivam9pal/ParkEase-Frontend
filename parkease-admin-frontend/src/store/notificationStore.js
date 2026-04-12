import { create } from "zustand";

/**
 * Toast types: "success" | "error" | "warning" | "info"
 * Toasts auto-dismiss after 4 seconds (handled in ToastContainer component)
 */
export const useNotificationStore = create((set) => ({
  toasts: [],

  addToast: (message, type = "success") =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now() + Math.random(), message, type },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

// Convenience helpers — import and call directly
export const toast = {
  success: (msg) =>
    useNotificationStore.getState().addToast(msg, "success"),
  error: (msg) =>
    useNotificationStore.getState().addToast(msg, "error"),
  warning: (msg) =>
    useNotificationStore.getState().addToast(msg, "warning"),
  info: (msg) =>
    useNotificationStore.getState().addToast(msg, "info"),
};      