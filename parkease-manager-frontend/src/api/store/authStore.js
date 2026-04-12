import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      // user shape:
      // { userId, fullName, email, phone, role, isActive, createdAt, profilePicUrl }

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (updatedUser) => set({ user: updatedUser }),
    }),
    {
      name: 'parkease-manager-auth',       // localStorage key
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);