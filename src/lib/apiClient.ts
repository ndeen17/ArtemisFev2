import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { AuthUser } from '@artemis/shared';

/**
 * Singleton API client for the Artemis backend.
 * - Uses Vite proxy `/api -> http://localhost:4000` in dev.
 * - Injects Bearer access token from `useAuthStore`.
 * - On 401 attempts a single refresh-then-replay; gives up if refresh also fails.
 */
// Strip any trailing slashes so URL concatenation in `performRefresh` doesn't
// produce `//auth/refresh` when VITE_API_BASE_URL is set with a trailing slash.
const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // refresh-token httpOnly cookie
  // 60s — long enough for AI-chain endpoints (CV-from-JD, action plan, etc.)
  // which routinely take 20–30s. Anything genuinely stuck past this is broken.
  timeout: 60_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<{ user: AuthUser; accessToken: string }>(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15_000 },
    );
    useAuthStore.getState().setAuth({ user: res.data.user, accessToken: res.data.accessToken });
    return res.data.accessToken;
  } catch (err) {
    // Only sign the user out when the BE explicitly rejects the refresh
    // (401/403 — invalid or revoked refresh token). Transient errors
    // (network blip, BE restart, 502/504, timeout) must NOT clear the
    // session, otherwise the user appears to be randomly signed out.
    const status = (err as AxiosError).response?.status;
    if (status === 401 || status === 403) {
      // Server-initiated session end — surfaces the "Session expired" banner on /signin.
      useAuthStore.getState().expireSession();
    }
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const url = original.url ?? '';
    if (
      url.includes('/auth/signin') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/google') ||
      url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }
    original._retry = true;
    refreshPromise ??= performRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient.request(original as AxiosRequestConfig);
  },
);

/**
 * Call once at app boot. If the persisted store says the user is authenticated
 * but we have no in-memory access token (typical after a full page reload —
 * the access token is intentionally never persisted), proactively refresh so
 * the user's first action doesn't have to absorb a 401-then-retry round-trip.
 *
 * Safe to call multiple times — coalesces with the lazy refresh path.
 */
export async function bootstrapAuth(): Promise<void> {
  const { isAuthenticated, accessToken } = useAuthStore.getState();
  if (!isAuthenticated || accessToken) return;
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  await refreshPromise;
}
