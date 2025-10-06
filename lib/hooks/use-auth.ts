"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  address: string | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (address: string, token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

/**
 * Global authentication state using Zustand
 * Persists to localStorage for session continuity
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      address: null,
      token: null,
      isAuthenticated: false,

      setAuth: (address, token) => {
        set({
          address,
          token,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          address: null,
          token: null,
          isAuthenticated: false,
        });
      },

      logout: async () => {
        try {
          // Call logout endpoint to invalidate session
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          // Clear local state regardless
          set({
            address: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "verifi-auth-storage",
      partialize: (state) => ({
        address: state.address,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
