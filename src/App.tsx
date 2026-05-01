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
