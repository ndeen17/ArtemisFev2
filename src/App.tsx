import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { bootstrapAuth } from '@/lib/apiClient';

/**
 * App root — wires global providers around the router.
 * Provider order: ErrorBoundary → QueryClientProvider → ToastProvider → AppRoutes.
 */
export default function App() {
  useEffect(() => {
    // Mint a fresh access token on hard reload so the user's first action
    // doesn't eat a 401-then-retry round-trip (or, on long AI endpoints,
    // a timeout). The access token is intentionally never persisted.
    void bootstrapAuth();

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
          <AppRoutes />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
