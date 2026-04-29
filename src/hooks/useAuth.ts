import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';

interface ApiErrorBody {
  error?: string;
  message?: string;
}

/** Extract a friendly message + machine code from an axios error. */
export function extractApiError(err: unknown): { code: string; message: string; status?: number } {
  const ax = err as AxiosError<ApiErrorBody>;
  const status = ax.response?.status;
  const body = ax.response?.data;
  return {
    code: body?.error ?? 'NETWORK_ERROR',
    message: body?.message ?? 'Something went wrong. Please try again.',
    status,
  };
}

export function useSignUp() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: (data) => setAuth(data),
  });
}

export function useSignIn() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (data) => setAuth(data),
  });
}

export function useGoogleAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.google,
    onSuccess: (data) => setAuth(data),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearAuth(),
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: authApi.resendVerification });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authApi.verifyEmail });
}

/** Convenience selector hook used by ProtectedRoute and the navbar. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return { user, accessToken, isAuthenticated };
}
