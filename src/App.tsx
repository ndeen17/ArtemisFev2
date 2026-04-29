import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';

/**
 * App root — wires global providers around the router.
 * Provider order: QueryClientProvider → (future: AuthProvider) → AppRoutes.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
