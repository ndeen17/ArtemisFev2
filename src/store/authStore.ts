import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@artemis/shared';

interface AuthState {
  user: AuthUser | null;
  /** Access token lives only in memory — never persisted. Refresh token is in an httpOnly cookie. */
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: AuthUser; accessToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth({ user, accessToken }) {
        set({ user, accessToken, isAuthenticated: true });
      },
      setUser(user) {
        set((s) => ({ ...s, user }));
      },
      clearAuth() {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'artemis.auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user — access token must never touch storage.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
