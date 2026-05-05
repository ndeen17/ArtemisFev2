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
  // Render's free tier (and any cold-starting backend) can answer the very
  // first request after idle with a 502/503/504 from its proxy while the
  // service is spinning up. Retry the refresh up to twice with a short
  // backoff so a cold start doesn't appear to the user as "session expired".
  // We do NOT retry the original failing request here — only the refresh.
  const TRANSIENT_STATUSES = new Set([502, 503, 504]);
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await axios.post<{ user: AuthUser; accessToken: string }>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true, timeout: 15_000 },
      );
      useAuthStore.getState().setAuth({ user: res.data.user, accessToken: res.data.accessToken });
      return res.data.accessToken;
    } catch (err) {
      const status = (err as AxiosError).response?.status;
      // Server-explicit auth failure — clear the session and stop retrying.
      if (status === 401 || status === 403) {
        useAuthStore.getState().expireSession();
        return null;
      }
      const transient = status === undefined || TRANSIENT_STATUSES.has(status);
      if (!transient || attempt === MAX_ATTEMPTS) {
        // Network/transient failure on the final attempt — leave the session
        // intact (per the rationale below) and return null. The caller will
        // surface the original error to the user; they can retry the action.
        return null;
      }
      // Backoff: 750ms, 1500ms.
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  return null;
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
