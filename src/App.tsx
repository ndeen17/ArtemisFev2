import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { bootstrapAuth } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

/**
 * App root — wires global providers around the router.
 * Provider order: ErrorBoundary → QueryClientProvider → ToastProvider → AppRoutes.
 */
export default function App() {
  // Start ready when no bootstrap is needed (unauthenticated users, or when
  // the access token is already in memory). For authenticated users on a hard
  // reload the token is gone — hold back routes until bootstrapAuth() mints a
  // fresh one so child queries don't race it and fire without a token (which
  // causes needless 401 → refresh → replay round-trips on every page load).
  const { isAuthenticated, accessToken } = useAuthStore.getState();
  const [authReady, setAuthReady] = useState(!isAuthenticated || !!accessToken);

  useEffect(() => {
    bootstrapAuth().finally(() => setAuthReady(true));

    // Tabs left idle for hours can have an expired in-memory access token
    // by the time the user returns. Re-bootstrapping when the tab regains
    // focus pre-empts the visible 401 → refresh → replay flow on the very
    // first action after switching back. `bootstrapAuth` is a no-op when
    // we still have a token, so this is cheap.
    function onFocus() {
      void bootstrapAuth();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {authReady ? <AppRoutes /> : null}
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
