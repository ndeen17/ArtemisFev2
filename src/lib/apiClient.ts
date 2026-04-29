import axios, { type AxiosInstance } from 'axios';

/**
 * Singleton API client for the Artemis backend.
 * - Uses Vite proxy `/api -> http://localhost:4000` in dev.
 * - In Phase 1 we'll add an interceptor that injects the Bearer access token
 *   from the auth store and refreshes on 401.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // refresh-token cookie (Phase 1)
  timeout: 15_000,
});
