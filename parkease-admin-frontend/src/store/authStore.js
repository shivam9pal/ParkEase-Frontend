import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwt, isTokenExpired } from "../utils/tokenUtils";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      admin: null,        // AdminProfileResponse shape
      isSuperAdmin: false,

      // Called after successful login
      // accessToken: JWT string
      // adminProfile: { adminId, fullName, email, isActive, isSuperAdmin, createdAt }
      login: (accessToken, adminProfile) => {
        const claims = decodeJwt(accessToken);
        set({
          token: accessToken,
          admin: adminProfile,
          isSuperAdmin: claims?.isSuperAdmin === true,
        });
      },

      // Called on logout or 401
      logout: () =>
        set({
          token: null,
          admin: null,
          isSuperAdmin: false,
        }),

      // Update admin profile in store (e.g., after profile update)
      updateAdmin: (updatedAdmin) => set({ admin: updatedAdmin }),

      // Check if currently authenticated with valid non-expired token
      isAuthenticated: () => {
        const { token } = get();
        return !!token && !isTokenExpired(token);
      },
    }),
    {
      name: "parkease-admin-auth",
      // Only persist these fields
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isSuperAdmin: state.isSuperAdmin,
      }),
    }
  )
);