import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@artemis/shared';

interface AuthState {
  user: AuthUser | null;
  /** Access token lives only in memory — never persisted. Refresh token is in an httpOnly cookie. */
  accessToken: string | null;
  isAuthenticated: boolean;
  /**
   * True when the session was ended by the server (refresh token expired or
   * revoked) rather than by an explicit user logout. Drives the
   * "Session expired — please sign in again" banner on /signin. Not persisted.
   */
  sessionExpired: boolean;
  setAuth: (data: { user: AuthUser; accessToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  expireSession: () => void;
  acknowledgeExpired: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      sessionExpired: false,

      setAuth({ user, accessToken }) {
        set({ user, accessToken, isAuthenticated: true, sessionExpired: false });
      },
      setUser(user) {
        set((s) => ({ ...s, user }));
      },
      clearAuth() {
        // Explicit user-initiated logout — no expired banner.
        set({ user: null, accessToken: null, isAuthenticated: false, sessionExpired: false });
      },
      expireSession() {
        // Server rejected our refresh token — clear creds and flag the banner.
        set({ user: null, accessToken: null, isAuthenticated: false, sessionExpired: true });
      },
      acknowledgeExpired() {
        set({ sessionExpired: false });
      },
    }),
    {
      name: 'artemis.auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user — access token + transient flag must never touch storage.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
