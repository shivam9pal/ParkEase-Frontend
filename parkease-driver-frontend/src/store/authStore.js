import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      // user shape: { userId, fullName, email, phone, role, vehiclePlate, profilePicUrl }

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (updatedUser) =>
        set((state) => ({ user: { ...state.user, ...updatedUser } })),
    }),
    {
      name: 'parkease-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);